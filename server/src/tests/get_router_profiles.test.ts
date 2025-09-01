import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { routerProfilesTable } from '../db/schema';
import { getRouterProfiles } from '../handlers/get_router_profiles';

describe('getRouterProfiles', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no profiles exist', async () => {
    const result = await getRouterProfiles();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all router profiles', async () => {
    // Create test router profiles
    await db.insert(routerProfilesTable)
      .values([
        {
          name: 'Office Router',
          host: '192.168.1.1',
          username: 'admin',
          password: 'office123',
          is_active: true
        },
        {
          name: 'Home Router',
          host: '192.168.0.1',
          username: 'admin',
          password: 'home456',
          is_active: false
        }
      ])
      .execute();

    const result = await getRouterProfiles();

    expect(result).toHaveLength(2);
    
    // Verify both profiles are returned with correct data
    const officeProfile = result.find(p => p.name === 'Office Router');
    const homeProfile = result.find(p => p.name === 'Home Router');
    
    expect(officeProfile).toBeDefined();
    expect(officeProfile!.host).toEqual('192.168.1.1');
    expect(officeProfile!.username).toEqual('admin');
    expect(officeProfile!.password).toEqual('office123');
    expect(officeProfile!.is_active).toBe(true);
    expect(officeProfile!.id).toBeDefined();
    expect(officeProfile!.created_at).toBeInstanceOf(Date);
    expect(officeProfile!.updated_at).toBeInstanceOf(Date);

    expect(homeProfile).toBeDefined();
    expect(homeProfile!.host).toEqual('192.168.0.1');
    expect(homeProfile!.username).toEqual('admin');
    expect(homeProfile!.password).toEqual('home456');
    expect(homeProfile!.is_active).toBe(false);
  });

  it('should return profiles ordered by most recently updated first', async () => {
    // Create profiles with slight delay to ensure different timestamps
    const firstProfile = await db.insert(routerProfilesTable)
      .values({
        name: 'First Router',
        host: '192.168.1.1',
        username: 'admin',
        password: 'pass1',
        is_active: false
      })
      .returning()
      .execute();

    // Add small delay to ensure different updated_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondProfile = await db.insert(routerProfilesTable)
      .values({
        name: 'Second Router',
        host: '192.168.1.2',
        username: 'admin',
        password: 'pass2',
        is_active: true
      })
      .returning()
      .execute();

    const result = await getRouterProfiles();

    expect(result).toHaveLength(2);
    // Second profile should be first due to desc ordering by updated_at
    expect(result[0].name).toEqual('Second Router');
    expect(result[0].updated_at.getTime()).toBeGreaterThanOrEqual(result[1].updated_at.getTime());
    expect(result[1].name).toEqual('First Router');
  });

  it('should handle profiles with various data types correctly', async () => {
    await db.insert(routerProfilesTable)
      .values({
        name: 'Test Router With Special Data',
        host: '10.0.0.1',
        username: 'test-user_123',
        password: 'complex!@#$%password',
        is_active: true
      })
      .execute();

    const result = await getRouterProfiles();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Test Router With Special Data');
    expect(result[0].host).toEqual('10.0.0.1');
    expect(result[0].username).toEqual('test-user_123');
    expect(result[0].password).toEqual('complex!@#$%password');
    expect(result[0].is_active).toBe(true);
    expect(typeof result[0].id).toBe('number');
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return multiple profiles with mixed active status', async () => {
    await db.insert(routerProfilesTable)
      .values([
        {
          name: 'Active Router 1',
          host: '192.168.1.10',
          username: 'admin',
          password: 'pass1',
          is_active: true
        },
        {
          name: 'Inactive Router',
          host: '192.168.1.20',
          username: 'admin',
          password: 'pass2',
          is_active: false
        },
        {
          name: 'Active Router 2',
          host: '192.168.1.30',
          username: 'admin',
          password: 'pass3',
          is_active: true
        }
      ])
      .execute();

    const result = await getRouterProfiles();

    expect(result).toHaveLength(3);
    
    // Verify all profiles are returned regardless of active status
    const activeCount = result.filter(profile => profile.is_active).length;
    const inactiveCount = result.filter(profile => !profile.is_active).length;
    
    expect(activeCount).toBe(2);
    expect(inactiveCount).toBe(1);
    
    // Verify each profile has all required fields
    result.forEach(profile => {
      expect(profile.id).toBeDefined();
      expect(profile.name).toBeDefined();
      expect(profile.host).toBeDefined();
      expect(profile.username).toBeDefined();
      expect(profile.password).toBeDefined();
      expect(typeof profile.is_active).toBe('boolean');
      expect(profile.created_at).toBeInstanceOf(Date);
      expect(profile.updated_at).toBeInstanceOf(Date);
    });
  });
});