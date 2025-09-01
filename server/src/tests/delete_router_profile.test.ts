import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { routerProfilesTable, netwatchDevicesTable } from '../db/schema';
import { deleteRouterProfile } from '../handlers/delete_router_profile';
import { eq } from 'drizzle-orm';

describe('deleteRouterProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing router profile successfully', async () => {
    // Create a test router profile
    const insertResult = await db.insert(routerProfilesTable)
      .values({
        name: 'Test Router',
        host: '192.168.1.1',
        username: 'admin',
        password: 'password123',
        is_active: true
      })
      .returning()
      .execute();

    const profileId = insertResult[0].id;

    // Delete the router profile
    const result = await deleteRouterProfile(profileId);

    // Verify the result
    expect(result.success).toBe(true);
    expect(result.message).toBe(`Router profile with ID ${profileId} has been deleted successfully`);

    // Verify the profile was actually deleted from the database
    const deletedProfile = await db.select()
      .from(routerProfilesTable)
      .where(eq(routerProfilesTable.id, profileId))
      .execute();

    expect(deletedProfile).toHaveLength(0);
  });

  it('should return error when trying to delete non-existent router profile', async () => {
    const nonExistentId = 999;

    const result = await deleteRouterProfile(nonExistentId);

    expect(result.success).toBe(false);
    expect(result.message).toBe(`Router profile with ID ${nonExistentId} not found`);
  });

  it('should prevent deletion when router profile has associated netwatch devices', async () => {
    // Create a test router profile
    const routerResult = await db.insert(routerProfilesTable)
      .values({
        name: 'Router with Devices',
        host: '192.168.1.1',
        username: 'admin',
        password: 'password123',
        is_active: true
      })
      .returning()
      .execute();

    const profileId = routerResult[0].id;

    // Create associated netwatch devices
    await db.insert(netwatchDevicesTable)
      .values([
        {
          router_profile_id: profileId,
          mikrotik_id: 'device1',
          host: '192.168.1.10',
          comment: 'Device 1',
          status: 'up',
          since: new Date()
        },
        {
          router_profile_id: profileId,
          mikrotik_id: 'device2',
          host: '192.168.1.11',
          comment: 'Device 2',
          status: 'down',
          since: new Date()
        }
      ])
      .execute();

    // Try to delete the router profile
    const result = await deleteRouterProfile(profileId);

    // Verify deletion was prevented
    expect(result.success).toBe(false);
    expect(result.message).toBe(`Cannot delete router profile with ID ${profileId}. It has 2 associated netwatch device(s). Please delete the associated devices first.`);

    // Verify the profile still exists in the database
    const existingProfile = await db.select()
      .from(routerProfilesTable)
      .where(eq(routerProfilesTable.id, profileId))
      .execute();

    expect(existingProfile).toHaveLength(1);
  });

  it('should allow deletion after associated netwatch devices are removed', async () => {
    // Create a test router profile
    const routerResult = await db.insert(routerProfilesTable)
      .values({
        name: 'Router with Temporary Devices',
        host: '192.168.1.1',
        username: 'admin',
        password: 'password123',
        is_active: false
      })
      .returning()
      .execute();

    const profileId = routerResult[0].id;

    // Create an associated netwatch device
    const deviceResult = await db.insert(netwatchDevicesTable)
      .values({
        router_profile_id: profileId,
        mikrotik_id: 'temp_device',
        host: '192.168.1.20',
        comment: 'Temporary Device',
        status: 'up',
        since: new Date()
      })
      .returning()
      .execute();

    // First attempt should fail due to associated device
    const firstAttempt = await deleteRouterProfile(profileId);
    expect(firstAttempt.success).toBe(false);

    // Remove the associated device
    await db.delete(netwatchDevicesTable)
      .where(eq(netwatchDevicesTable.id, deviceResult[0].id))
      .execute();

    // Second attempt should succeed
    const secondAttempt = await deleteRouterProfile(profileId);
    expect(secondAttempt.success).toBe(true);
    expect(secondAttempt.message).toBe(`Router profile with ID ${profileId} has been deleted successfully`);

    // Verify the profile was deleted
    const deletedProfile = await db.select()
      .from(routerProfilesTable)
      .where(eq(routerProfilesTable.id, profileId))
      .execute();

    expect(deletedProfile).toHaveLength(0);
  });

  it('should handle multiple router profiles correctly', async () => {
    // Create multiple router profiles
    const profileResults = await db.insert(routerProfilesTable)
      .values([
        {
          name: 'Router A',
          host: '192.168.1.1',
          username: 'admin',
          password: 'password123',
          is_active: true
        },
        {
          name: 'Router B',
          host: '192.168.1.2',
          username: 'admin',
          password: 'password456',
          is_active: false
        },
        {
          name: 'Router C',
          host: '192.168.1.3',
          username: 'admin',
          password: 'password789',
          is_active: true
        }
      ])
      .returning()
      .execute();

    const profileIds = profileResults.map(p => p.id);

    // Delete the middle router profile
    const result = await deleteRouterProfile(profileIds[1]);
    expect(result.success).toBe(true);

    // Verify only the targeted profile was deleted
    const remainingProfiles = await db.select()
      .from(routerProfilesTable)
      .execute();

    expect(remainingProfiles).toHaveLength(2);
    expect(remainingProfiles.map(p => p.id)).toEqual([profileIds[0], profileIds[2]]);
  });
});