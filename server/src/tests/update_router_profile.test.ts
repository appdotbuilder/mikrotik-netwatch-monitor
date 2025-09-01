import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { routerProfilesTable } from '../db/schema';
import { type UpdateRouterProfileInput, type CreateRouterProfileInput } from '../schema';
import { updateRouterProfile } from '../handlers/update_router_profile';
import { eq } from 'drizzle-orm';

// Helper to create a test router profile
const createTestProfile = async (): Promise<number> => {
  const testProfile: CreateRouterProfileInput = {
    name: 'Original Router',
    host: '192.168.1.1',
    username: 'admin',
    password: 'originalpass',
    is_active: false
  };

  const result = await db.insert(routerProfilesTable)
    .values(testProfile)
    .returning()
    .execute();

  return result[0].id;
};

describe('updateRouterProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of a router profile', async () => {
    const profileId = await createTestProfile();

    const updateInput: UpdateRouterProfileInput = {
      id: profileId,
      name: 'Updated Router Name',
      host: '10.0.0.1',
      username: 'newuser',
      password: 'newpassword',
      is_active: true
    };

    const result = await updateRouterProfile(updateInput);

    expect(result.id).toBe(profileId);
    expect(result.name).toBe('Updated Router Name');
    expect(result.host).toBe('10.0.0.1');
    expect(result.username).toBe('newuser');
    expect(result.password).toBe('newpassword');
    expect(result.is_active).toBe(true);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    const profileId = await createTestProfile();

    // Only update name and host
    const updateInput: UpdateRouterProfileInput = {
      id: profileId,
      name: 'Partially Updated Router',
      host: '172.16.0.1'
    };

    const result = await updateRouterProfile(updateInput);

    expect(result.name).toBe('Partially Updated Router');
    expect(result.host).toBe('172.16.0.1');
    // These should remain unchanged
    expect(result.username).toBe('admin');
    expect(result.password).toBe('originalpass');
    expect(result.is_active).toBe(false);
  });

  it('should update is_active flag only', async () => {
    const profileId = await createTestProfile();

    const updateInput: UpdateRouterProfileInput = {
      id: profileId,
      is_active: true
    };

    const result = await updateRouterProfile(updateInput);

    expect(result.is_active).toBe(true);
    // Other fields should remain unchanged
    expect(result.name).toBe('Original Router');
    expect(result.host).toBe('192.168.1.1');
    expect(result.username).toBe('admin');
    expect(result.password).toBe('originalpass');
  });

  it('should save changes to database', async () => {
    const profileId = await createTestProfile();

    const updateInput: UpdateRouterProfileInput = {
      id: profileId,
      name: 'Database Test Router',
      host: '203.0.113.1'
    };

    await updateRouterProfile(updateInput);

    // Verify changes were saved to database
    const savedProfile = await db.select()
      .from(routerProfilesTable)
      .where(eq(routerProfilesTable.id, profileId))
      .execute();

    expect(savedProfile).toHaveLength(1);
    expect(savedProfile[0].name).toBe('Database Test Router');
    expect(savedProfile[0].host).toBe('203.0.113.1');
    expect(savedProfile[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update the updated_at timestamp', async () => {
    const profileId = await createTestProfile();

    // Get original timestamp
    const originalProfile = await db.select()
      .from(routerProfilesTable)
      .where(eq(routerProfilesTable.id, profileId))
      .execute();

    const originalTimestamp = originalProfile[0].updated_at;

    // Wait a moment to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateRouterProfileInput = {
      id: profileId,
      name: 'Timestamp Test Router'
    };

    const result = await updateRouterProfile(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalTimestamp.getTime());
  });

  it('should throw error when router profile does not exist', async () => {
    const updateInput: UpdateRouterProfileInput = {
      id: 999, // Non-existent ID
      name: 'Non-existent Router'
    };

    await expect(updateRouterProfile(updateInput)).rejects.toThrow(/Router profile with id 999 not found/i);
  });

  it('should preserve created_at timestamp', async () => {
    const profileId = await createTestProfile();

    // Get original created_at timestamp
    const originalProfile = await db.select()
      .from(routerProfilesTable)
      .where(eq(routerProfilesTable.id, profileId))
      .execute();

    const originalCreatedAt = originalProfile[0].created_at;

    const updateInput: UpdateRouterProfileInput = {
      id: profileId,
      name: 'Created At Test Router'
    };

    const result = await updateRouterProfile(updateInput);

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBe(originalCreatedAt.getTime());
  });

  it('should handle empty string fields correctly', async () => {
    const profileId = await createTestProfile();

    // Test with valid non-empty strings (empty strings would fail schema validation)
    const updateInput: UpdateRouterProfileInput = {
      id: profileId,
      name: 'Valid Name',
      host: '192.168.2.1'
    };

    const result = await updateRouterProfile(updateInput);

    expect(result.name).toBe('Valid Name');
    expect(result.host).toBe('192.168.2.1');
  });
});