import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { routerProfilesTable } from '../db/schema';
import { type CreateRouterProfileInput } from '../schema';
import { createRouterProfile } from '../handlers/create_router_profile';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateRouterProfileInput = {
  name: 'Test Router',
  host: '192.168.1.1',
  username: 'admin',
  password: 'test123',
  is_active: true
};

// Test input without optional field - omit is_active to use default
const minimalInput = {
  name: 'Minimal Router',
  host: '10.0.0.1',
  username: 'user',
  password: 'pass123'
} as CreateRouterProfileInput;

describe('createRouterProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a router profile with all fields', async () => {
    const result = await createRouterProfile(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Router');
    expect(result.host).toEqual('192.168.1.1');
    expect(result.username).toEqual('admin');
    expect(result.password).toEqual('test123');
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a router profile with default is_active value', async () => {
    const result = await createRouterProfile(minimalInput);

    // Verify default value is applied
    expect(result.name).toEqual('Minimal Router');
    expect(result.host).toEqual('10.0.0.1');
    expect(result.username).toEqual('user');
    expect(result.password).toEqual('pass123');
    expect(result.is_active).toEqual(false); // Default value
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save router profile to database', async () => {
    const result = await createRouterProfile(testInput);

    // Query database to verify data was saved
    const profiles = await db.select()
      .from(routerProfilesTable)
      .where(eq(routerProfilesTable.id, result.id))
      .execute();

    expect(profiles).toHaveLength(1);
    expect(profiles[0].name).toEqual('Test Router');
    expect(profiles[0].host).toEqual('192.168.1.1');
    expect(profiles[0].username).toEqual('admin');
    expect(profiles[0].password).toEqual('test123');
    expect(profiles[0].is_active).toEqual(true);
    expect(profiles[0].created_at).toBeInstanceOf(Date);
    expect(profiles[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle special characters in router profile data', async () => {
    const specialInput: CreateRouterProfileInput = {
      name: 'Router-01_Test & Development',
      host: '192.168.1.254',
      username: 'admin@mikrotik',
      password: 'P@ssw0rd!#$',
      is_active: false
    };

    const result = await createRouterProfile(specialInput);

    expect(result.name).toEqual('Router-01_Test & Development');
    expect(result.host).toEqual('192.168.1.254');
    expect(result.username).toEqual('admin@mikrotik');
    expect(result.password).toEqual('P@ssw0rd!#$');
    expect(result.is_active).toEqual(false);
  });

  it('should create multiple router profiles independently', async () => {
    const profile1 = await createRouterProfile({
      name: 'Router 1',
      host: '192.168.1.1',
      username: 'admin',
      password: 'pass1'
    } as CreateRouterProfileInput);

    const profile2 = await createRouterProfile({
      name: 'Router 2',
      host: '192.168.2.1',
      username: 'admin',
      password: 'pass2',
      is_active: true
    });

    // Verify both profiles exist with different IDs
    expect(profile1.id).not.toEqual(profile2.id);
    expect(profile1.name).toEqual('Router 1');
    expect(profile2.name).toEqual('Router 2');
    expect(profile1.is_active).toEqual(false);
    expect(profile2.is_active).toEqual(true);

    // Verify both are in database
    const allProfiles = await db.select()
      .from(routerProfilesTable)
      .execute();

    expect(allProfiles).toHaveLength(2);
  });

  it('should set timestamps correctly', async () => {
    const beforeCreation = new Date();
    const result = await createRouterProfile(testInput);
    const afterCreation = new Date();

    // Verify timestamps are within reasonable range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });
});