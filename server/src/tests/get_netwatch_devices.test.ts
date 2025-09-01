import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { routerProfilesTable, netwatchDevicesTable } from '../db/schema';
import { type NetwatchFilterInput, type CreateRouterProfileInput, type CreateNetwatchDeviceInput } from '../schema';
import { getNetwatchDevices } from '../handlers/get_netwatch_devices';

describe('getNetwatchDevices', () => {
  let routerProfileId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a test router profile
    const routerProfileInput: CreateRouterProfileInput = {
      name: 'Test Router',
      host: '192.168.1.1',
      username: 'admin',
      password: 'password',
      is_active: true
    };

    const routerProfileResult = await db.insert(routerProfilesTable)
      .values(routerProfileInput)
      .returning()
      .execute();
    
    routerProfileId = routerProfileResult[0].id;

    // Create test netwatch devices
    const devices: CreateNetwatchDeviceInput[] = [
      {
        router_profile_id: routerProfileId,
        mikrotik_id: '*1',
        host: '8.8.8.8',
        comment: 'Google DNS',
        status: 'up',
        since: new Date(Date.now() - 3600000), // 1 hour ago
        timeout: '5s',
        interval: '00:01:00'
      },
      {
        router_profile_id: routerProfileId,
        mikrotik_id: '*2',
        host: '192.168.1.100',
        comment: 'Server Internal',
        status: 'down',
        since: new Date(Date.now() - 300000), // 5 minutes ago
        timeout: '3s',
        interval: '00:01:00'
      },
      {
        router_profile_id: routerProfileId,
        mikrotik_id: '*3',
        host: '192.168.1.50',
        comment: 'Printer HP',
        status: 'up',
        since: new Date(Date.now() - 7200000), // 2 hours ago
        timeout: '5s',
        interval: '00:02:00'
      },
      {
        router_profile_id: routerProfileId,
        mikrotik_id: '*4',
        host: '10.0.0.1',
        comment: null,
        status: 'down',
        since: new Date(Date.now() - 1800000), // 30 minutes ago
        timeout: '3s',
        interval: '00:01:00'
      }
    ];

    await db.insert(netwatchDevicesTable)
      .values(devices)
      .execute();
  });

  afterEach(resetDB);

  it('should fetch all devices for a router profile without filters', async () => {
    const filter: NetwatchFilterInput = {
      router_profile_id: routerProfileId,
      status: 'all'
    };

    const result = await getNetwatchDevices(filter);

    expect(result).toHaveLength(4);
    expect(result[0].router_profile_id).toEqual(routerProfileId);
    expect(result[0].host).toBeDefined();
    expect(result[0].status).toBeDefined();
    expect(result[0].mikrotik_id).toBeDefined();
    expect(result[0].since).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should filter devices by status - up only', async () => {
    const filter: NetwatchFilterInput = {
      router_profile_id: routerProfileId,
      status: 'up'
    };

    const result = await getNetwatchDevices(filter);

    expect(result).toHaveLength(2);
    result.forEach(device => {
      expect(device.status).toEqual('up');
      expect(device.router_profile_id).toEqual(routerProfileId);
    });
  });

  it('should filter devices by status - down only', async () => {
    const filter: NetwatchFilterInput = {
      router_profile_id: routerProfileId,
      status: 'down'
    };

    const result = await getNetwatchDevices(filter);

    expect(result).toHaveLength(2);
    result.forEach(device => {
      expect(device.status).toEqual('down');
      expect(device.router_profile_id).toEqual(routerProfileId);
    });
  });

  it('should filter devices by status - all devices', async () => {
    const filter: NetwatchFilterInput = {
      router_profile_id: routerProfileId,
      status: 'all'
    };

    const result = await getNetwatchDevices(filter);

    expect(result).toHaveLength(4);
    expect(result.some(device => device.status === 'up')).toBe(true);
    expect(result.some(device => device.status === 'down')).toBe(true);
  });

  it('should search devices by host address', async () => {
    const filter: NetwatchFilterInput = {
      router_profile_id: routerProfileId,
      search: '8.8.8',
      status: 'all'
    };

    const result = await getNetwatchDevices(filter);

    expect(result).toHaveLength(1);
    expect(result[0].host).toEqual('8.8.8.8');
    expect(result[0].comment).toEqual('Google DNS');
  });

  it('should search devices by comment', async () => {
    const filter: NetwatchFilterInput = {
      router_profile_id: routerProfileId,
      search: 'server',
      status: 'all'
    };

    const result = await getNetwatchDevices(filter);

    expect(result).toHaveLength(1);
    expect(result[0].host).toEqual('192.168.1.100');
    expect(result[0].comment).toEqual('Server Internal');
  });

  it('should search devices case-insensitively', async () => {
    const filter: NetwatchFilterInput = {
      router_profile_id: routerProfileId,
      search: 'GOOGLE',
      status: 'all'
    };

    const result = await getNetwatchDevices(filter);

    expect(result).toHaveLength(1);
    expect(result[0].comment).toEqual('Google DNS');
  });

  it('should combine status and search filters', async () => {
    const filter: NetwatchFilterInput = {
      router_profile_id: routerProfileId,
      status: 'up',
      search: '192.168'
    };

    const result = await getNetwatchDevices(filter);

    expect(result).toHaveLength(1);
    expect(result[0].host).toEqual('192.168.1.50');
    expect(result[0].status).toEqual('up');
    expect(result[0].comment).toEqual('Printer HP');
  });

  it('should return empty array when no devices match filters', async () => {
    const filter: NetwatchFilterInput = {
      router_profile_id: routerProfileId,
      search: 'nonexistent',
      status: 'all'
    };

    const result = await getNetwatchDevices(filter);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent router profile', async () => {
    const filter: NetwatchFilterInput = {
      router_profile_id: 999999, // Non-existent ID
      status: 'all'
    };

    const result = await getNetwatchDevices(filter);

    expect(result).toHaveLength(0);
  });

  it('should handle devices with null comments in search', async () => {
    const filter: NetwatchFilterInput = {
      router_profile_id: routerProfileId,
      search: '10.0.0.1',
      status: 'all'
    };

    const result = await getNetwatchDevices(filter);

    expect(result).toHaveLength(1);
    expect(result[0].host).toEqual('10.0.0.1');
    expect(result[0].comment).toBeNull();
  });

  it('should verify device data integrity', async () => {
    const filter: NetwatchFilterInput = {
      router_profile_id: routerProfileId,
      status: 'all'
    };

    const result = await getNetwatchDevices(filter);
    const device = result.find(d => d.host === '8.8.8.8');

    expect(device).toBeDefined();
    expect(device!.mikrotik_id).toEqual('*1');
    expect(device!.timeout).toEqual('5s');
    expect(device!.interval).toEqual('00:01:00');
    expect(device!.since).toBeInstanceOf(Date);
    expect(device!.created_at).toBeInstanceOf(Date);
    expect(device!.updated_at).toBeInstanceOf(Date);
  });
});