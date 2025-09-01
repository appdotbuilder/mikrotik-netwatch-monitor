import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { routerProfilesTable, netwatchDevicesTable } from '../db/schema';
import { getNetwatchSummary } from '../handlers/get_netwatch_summary';
import { type CreateRouterProfileInput, type CreateNetwatchDeviceInput } from '../schema';

// Test router profile data
const testRouterProfile: CreateRouterProfileInput = {
  name: 'Test Router',
  host: '192.168.1.1',
  username: 'admin',
  password: 'password123',
  is_active: true
};

describe('getNetwatchSummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return summary with zero devices when no devices exist', async () => {
    // Create router profile first
    const routerResult = await db.insert(routerProfilesTable)
      .values(testRouterProfile)
      .returning()
      .execute();

    const routerProfileId = routerResult[0].id;

    const summary = await getNetwatchSummary(routerProfileId);

    expect(summary.total_devices).toEqual(0);
    expect(summary.up_devices).toEqual(0);
    expect(summary.down_devices).toEqual(0);
    expect(summary.last_updated).toBeInstanceOf(Date);
  });

  it('should return correct summary statistics with mixed device statuses', async () => {
    // Create router profile
    const routerResult = await db.insert(routerProfilesTable)
      .values(testRouterProfile)
      .returning()
      .execute();

    const routerProfileId = routerResult[0].id;

    // Create test devices with mixed statuses
    const testDevices: CreateNetwatchDeviceInput[] = [
      {
        router_profile_id: routerProfileId,
        mikrotik_id: '1',
        host: '192.168.1.100',
        comment: 'Device 1',
        status: 'up',
        since: new Date()
      },
      {
        router_profile_id: routerProfileId,
        mikrotik_id: '2',
        host: '192.168.1.101',
        comment: 'Device 2',
        status: 'up',
        since: new Date()
      },
      {
        router_profile_id: routerProfileId,
        mikrotik_id: '3',
        host: '192.168.1.102',
        comment: 'Device 3',
        status: 'down',
        since: new Date()
      },
      {
        router_profile_id: routerProfileId,
        mikrotik_id: '4',
        host: '192.168.1.103',
        comment: 'Device 4',
        status: 'up',
        since: new Date()
      },
      {
        router_profile_id: routerProfileId,
        mikrotik_id: '5',
        host: '192.168.1.104',
        comment: 'Device 5',
        status: 'down',
        since: new Date()
      }
    ];

    await db.insert(netwatchDevicesTable)
      .values(testDevices)
      .execute();

    const summary = await getNetwatchSummary(routerProfileId);

    expect(summary.total_devices).toEqual(5);
    expect(summary.up_devices).toEqual(3);
    expect(summary.down_devices).toEqual(2);
    expect(summary.last_updated).toBeInstanceOf(Date);
  });

  it('should return summary for only the specified router profile', async () => {
    // Create two router profiles
    const router1Result = await db.insert(routerProfilesTable)
      .values({
        ...testRouterProfile,
        name: 'Router 1'
      })
      .returning()
      .execute();

    const router2Result = await db.insert(routerProfilesTable)
      .values({
        ...testRouterProfile,
        name: 'Router 2',
        host: '192.168.2.1'
      })
      .returning()
      .execute();

    const router1Id = router1Result[0].id;
    const router2Id = router2Result[0].id;

    // Add devices to router 1
    const router1Devices: CreateNetwatchDeviceInput[] = [
      {
        router_profile_id: router1Id,
        mikrotik_id: '1',
        host: '192.168.1.100',
        status: 'up',
        since: new Date()
      },
      {
        router_profile_id: router1Id,
        mikrotik_id: '2',
        host: '192.168.1.101',
        status: 'down',
        since: new Date()
      }
    ];

    // Add devices to router 2
    const router2Devices: CreateNetwatchDeviceInput[] = [
      {
        router_profile_id: router2Id,
        mikrotik_id: '3',
        host: '192.168.2.100',
        status: 'up',
        since: new Date()
      },
      {
        router_profile_id: router2Id,
        mikrotik_id: '4',
        host: '192.168.2.101',
        status: 'up',
        since: new Date()
      },
      {
        router_profile_id: router2Id,
        mikrotik_id: '5',
        host: '192.168.2.102',
        status: 'up',
        since: new Date()
      }
    ];

    await db.insert(netwatchDevicesTable)
      .values([...router1Devices, ...router2Devices])
      .execute();

    // Test router 1 summary
    const router1Summary = await getNetwatchSummary(router1Id);
    expect(router1Summary.total_devices).toEqual(2);
    expect(router1Summary.up_devices).toEqual(1);
    expect(router1Summary.down_devices).toEqual(1);

    // Test router 2 summary
    const router2Summary = await getNetwatchSummary(router2Id);
    expect(router2Summary.total_devices).toEqual(3);
    expect(router2Summary.up_devices).toEqual(3);
    expect(router2Summary.down_devices).toEqual(0);
  });

  it('should return summary with all devices up', async () => {
    // Create router profile
    const routerResult = await db.insert(routerProfilesTable)
      .values(testRouterProfile)
      .returning()
      .execute();

    const routerProfileId = routerResult[0].id;

    // Create devices all with 'up' status
    const testDevices: CreateNetwatchDeviceInput[] = [
      {
        router_profile_id: routerProfileId,
        mikrotik_id: '1',
        host: '192.168.1.100',
        status: 'up',
        since: new Date()
      },
      {
        router_profile_id: routerProfileId,
        mikrotik_id: '2',
        host: '192.168.1.101',
        status: 'up',
        since: new Date()
      }
    ];

    await db.insert(netwatchDevicesTable)
      .values(testDevices)
      .execute();

    const summary = await getNetwatchSummary(routerProfileId);

    expect(summary.total_devices).toEqual(2);
    expect(summary.up_devices).toEqual(2);
    expect(summary.down_devices).toEqual(0);
    expect(summary.last_updated).toBeInstanceOf(Date);
  });

  it('should return summary with all devices down', async () => {
    // Create router profile
    const routerResult = await db.insert(routerProfilesTable)
      .values(testRouterProfile)
      .returning()
      .execute();

    const routerProfileId = routerResult[0].id;

    // Create devices all with 'down' status
    const testDevices: CreateNetwatchDeviceInput[] = [
      {
        router_profile_id: routerProfileId,
        mikrotik_id: '1',
        host: '192.168.1.100',
        status: 'down',
        since: new Date()
      },
      {
        router_profile_id: routerProfileId,
        mikrotik_id: '2',
        host: '192.168.1.101',
        status: 'down',
        since: new Date()
      },
      {
        router_profile_id: routerProfileId,
        mikrotik_id: '3',
        host: '192.168.1.102',
        status: 'down',
        since: new Date()
      }
    ];

    await db.insert(netwatchDevicesTable)
      .values(testDevices)
      .execute();

    const summary = await getNetwatchSummary(routerProfileId);

    expect(summary.total_devices).toEqual(3);
    expect(summary.up_devices).toEqual(0);
    expect(summary.down_devices).toEqual(3);
    expect(summary.last_updated).toBeInstanceOf(Date);
  });

  it('should throw error when router profile does not exist', async () => {
    const nonExistentId = 999;

    await expect(getNetwatchSummary(nonExistentId))
      .rejects.toThrow(/Router profile with ID 999 not found/i);
  });

  it('should handle devices with nullable fields correctly', async () => {
    // Create router profile
    const routerResult = await db.insert(routerProfilesTable)
      .values(testRouterProfile)
      .returning()
      .execute();

    const routerProfileId = routerResult[0].id;

    // Create devices with nullable fields
    const testDevices: CreateNetwatchDeviceInput[] = [
      {
        router_profile_id: routerProfileId,
        mikrotik_id: '1',
        host: '192.168.1.100',
        comment: null, // Nullable field
        status: 'up',
        since: new Date(),
        timeout: null, // Nullable field
        interval: null // Nullable field
      },
      {
        router_profile_id: routerProfileId,
        mikrotik_id: '2',
        host: '192.168.1.101',
        comment: 'Device with comment',
        status: 'down',
        since: new Date(),
        timeout: '5s',
        interval: '10s'
      }
    ];

    await db.insert(netwatchDevicesTable)
      .values(testDevices)
      .execute();

    const summary = await getNetwatchSummary(routerProfileId);

    expect(summary.total_devices).toEqual(2);
    expect(summary.up_devices).toEqual(1);
    expect(summary.down_devices).toEqual(1);
    expect(summary.last_updated).toBeInstanceOf(Date);
  });
});