import { db } from '../db';
import { routerProfilesTable } from '../db/schema';
import { desc } from 'drizzle-orm';
import { type RouterProfile } from '../schema';

export const getRouterProfiles = async (): Promise<RouterProfile[]> => {
  try {
    // Fetch all router profiles ordered by most recently updated first
    const results = await db.select()
      .from(routerProfilesTable)
      .orderBy(desc(routerProfilesTable.updated_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch router profiles:', error);
    throw error;
  }
};