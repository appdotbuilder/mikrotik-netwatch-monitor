import { db } from '../db';
import { routerProfilesTable } from '../db/schema';
import { type UpdateRouterProfileInput, type RouterProfile } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateRouterProfile(input: UpdateRouterProfileInput): Promise<RouterProfile> {
  try {
    // First verify the router profile exists
    const existingProfile = await db.select()
      .from(routerProfilesTable)
      .where(eq(routerProfilesTable.id, input.id))
      .execute();

    if (existingProfile.length === 0) {
      throw new Error(`Router profile with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.host !== undefined) {
      updateData.host = input.host;
    }
    if (input.username !== undefined) {
      updateData.username = input.username;
    }
    if (input.password !== undefined) {
      updateData.password = input.password;
    }
    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }

    // Update the router profile
    const result = await db.update(routerProfilesTable)
      .set(updateData)
      .where(eq(routerProfilesTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Router profile update failed:', error);
    throw error;
  }
}