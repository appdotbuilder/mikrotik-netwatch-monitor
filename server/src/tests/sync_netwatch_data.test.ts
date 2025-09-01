import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { routerProfilesTable, netwatchDevicesTable } from '../db/schema';
import { type RouterConnectionInput } from '../schema';
import { syncNetwatchData } from '../handlers/sync_netwatch_data';
import { eq, and } from 'drizzle-orm';

// Test router connection input
const testRouterConnection: RouterConnectionInput = {
  host: '192.168.1.1',
  username: 'admin',
  password: 'password123'
};

// Test router profile data
const testRouterProfile = {
  name: 'Test Router',
  host: '192.168.1.1',
  username: 'admin',
  password: 'password123',
  is_active: true
};

describe('syncNetwatchData', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should sync netwatch data and return mock data with summary', async () => {
    // Create router profile first
    const routerResults = await db.insert(routerProfilesTable)
      .values(testRouterProfile)
      .returning()
      .execute();

    const routerProfile = routerResults[0];

    const result = await syncNetwatchData(testRouterConnection);

    // Verify result structure
    expect(result.devices).toBeDefined();
    expect(Array.isArray(result.devices)).toBe(true);
    expect(result.summary).toBeDefined();
    
    // Verify devices
    expect(result.devices.length).toBeGreaterThan(0);
    result.devices.forEach(device => {
      expect(device.id).toBeDefined();
      expect(device.router_profile_id).toBe(routerProfile.id);
      expect(device.mikrotik_id).toBeDefined();
      expect(device.host).toBeDefined();
      expect(['up', 'down']).toContain(device.status);
      expect(device.since).toBeInstanceOf(Date);
      expect(device.created_at).toBeInstanceOf(Date);
      expect(device.updated_at).toBeInstanceOf(Date);
    });

    // Verify summary calculations
    const upCount = result.devices.filter(d => d.status === 'up').length;
    const downCount = result.devices.filter(d => d.status === 'down').length;
    
    expect(result.summary.total_devices).toBe(result.devices.length);
    expect(result.summary.up_devices).toBe(upCount);
    expect(result.summary.down_devices).toBe(downCount);
    expect(result.summary.total_devices).toBe(upCount + downCount);
    expect(result.summary.last_updated).toBeInstanceOf(Date);
  });

  it('should save devices to database on first sync', async () => {
    // Create router profile first
    await db.insert(routerProfilesTable)
      .values(testRouterProfile)
      .returning()
      .execute();

    const result = await syncNetwatchData(testRouterConnection);

    // Verify devices were saved to database
    const savedDevices = await db.select()
      .from(netwatchDevicesTable)
      .execute();

    expect(savedDevices.length).toBe(result.devices.length);
    
    // Verify each device exists in database
    for (const device of result.devices) {
      const dbDevice = savedDevices.find(d => d.id === device.id);
      expect(dbDevice).toBeDefined();
      expect(dbDevice!.mikrotik_id).toBe(device.mikrotik_id);
      expect(dbDevice!.host).toBe(device.host);
      expect(dbDevice!.status).toBe(device.status);
      expect(dbDevice!.since).toEqual(device.since);
    }
  });

  it('should update existing devices on subsequent syncs', async () => {
    // Create router profile first
    const routerResults = await db.insert(routerProfilesTable)
      .values(testRouterProfile)
      .returning()
      .execute();

    const routerProfile = routerResults[0];

    // Create an existing device
    const existingDevice = await db.insert(netwatchDevicesTable)
      .values({
        router_profile_id: routerProfile.id,
        mikrotik_id: "*1",
        host: "8.8.8.8",
        comment: "Old Google DNS",
        status: "down",
        since: new Date(Date.now() - 86400000), // 1 day ago
        timeout: "10s",
        interval: "00:05:00"
      })
      .returning()
      .execute();

    const originalUpdatedAt = existingDevice[0].updated_at;

    // Add small delay to ensure updated_at difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const result = await syncNetwatchData(testRouterConnection);

    // Find the updated device
    const updatedDevice = result.devices.find(d => d.mikrotik_id === "*1");
    expect(updatedDevice).toBeDefined();
    expect(updatedDevice!.id).toBe(existingDevice[0].id); // Same ID
    
    // Verify device was updated in database
    const dbDevices = await db.select()
      .from(netwatchDevicesTable)
      .where(eq(netwatchDevicesTable.id, existingDevice[0].id))
      .execute();

    expect(dbDevices.length).toBe(1);
    const dbDevice = dbDevices[0];
    
    // Verify updated_at changed
    expect(dbDevice.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    
    // Verify other fields were updated
    expect(dbDevice.comment).toBe("Google DNS"); // Updated from mock data
  });

  it('should handle mixed new and existing devices', async () => {
    // Create router profile first
    const routerResults = await db.insert(routerProfilesTable)
      .values(testRouterProfile)
      .returning()
      .execute();

    const routerProfile = routerResults[0];

    // Create some existing devices (partial set)
    await db.insert(netwatchDevicesTable)
      .values([
        {
          router_profile_id: routerProfile.id,
          mikrotik_id: "*1",
          host: "8.8.8.8",
          comment: "Existing DNS",
          status: "up",
          since: new Date(Date.now() - 3600000), // 1 hour ago
          timeout: "5s",
          interval: "00:01:00"
        },
        {
          router_profile_id: routerProfile.id,
          mikrotik_id: "*2",
          host: "192.168.1.100",
          comment: "Existing Server",
          status: "down",
          since: new Date(Date.now() - 1800000), // 30 min ago
          timeout: "3s",
          interval: "00:01:00"
        }
      ])
      .execute();

    const result = await syncNetwatchData(testRouterConnection);

    // Verify all mock devices are returned (existing updated + new inserted)
    expect(result.devices.length).toBeGreaterThanOrEqual(4); // At least 4 from mock data

    // Verify database contains all devices
    const allDbDevices = await db.select()
      .from(netwatchDevicesTable)
      .where(eq(netwatchDevicesTable.router_profile_id, routerProfile.id))
      .execute();

    expect(allDbDevices.length).toBe(result.devices.length);

    // Verify specific MikroTik IDs exist
    const mikrotikIds = allDbDevices.map(d => d.mikrotik_id);
    expect(mikrotikIds).toContain("*1");
    expect(mikrotikIds).toContain("*2");
    expect(mikrotikIds).toContain("*3");
    expect(mikrotikIds).toContain("*4");
  });

  it('should throw error when router profile not found', async () => {
    // Don't create any router profile
    
    const invalidConnection: RouterConnectionInput = {
      host: 'nonexistent.router',
      username: 'invalid',
      password: 'wrong'
    };

    await expect(syncNetwatchData(invalidConnection))
      .rejects.toThrow(/router profile not found/i);
  });

  it('should handle router profile with different connection details', async () => {
    // Create router profile with different details
    await db.insert(routerProfilesTable)
      .values({
        name: 'Different Router',
        host: '10.0.0.1',
        username: 'root',
        password: 'different_pass',
        is_active: false
      })
      .execute();

    // Try to sync with original test connection
    await expect(syncNetwatchData(testRouterConnection))
      .rejects.toThrow(/router profile not found/i);
  });

  it('should work with inactive router profile', async () => {
    // Create inactive router profile
    await db.insert(routerProfilesTable)
      .values({
        ...testRouterProfile,
        is_active: false
      })
      .returning()
      .execute();

    // Should still work - is_active doesn't affect sync functionality
    const result = await syncNetwatchData(testRouterConnection);

    expect(result.devices).toBeDefined();
    expect(result.devices.length).toBeGreaterThan(0);
    expect(result.summary).toBeDefined();
  });

  it('should handle devices with null comments correctly', async () => {
    // Create router profile
    await db.insert(routerProfilesTable)
      .values(testRouterProfile)
      .returning()
      .execute();

    const result = await syncNetwatchData(testRouterConnection);

    // Some devices might have null comments - this should be handled properly
    result.devices.forEach(device => {
      if (device.comment === null) {
        expect(device.comment).toBeNull();
      } else {
        expect(typeof device.comment).toBe('string');
      }
    });
  });
});