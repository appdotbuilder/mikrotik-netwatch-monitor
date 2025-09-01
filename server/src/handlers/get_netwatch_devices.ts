import { db } from '../db';
import { netwatchDevicesTable } from '../db/schema';
import { type NetwatchFilterInput, type NetwatchDevice } from '../schema';
import { eq, and, or, sql, type SQL } from 'drizzle-orm';

export const getNetwatchDevices = async (filter: NetwatchFilterInput): Promise<NetwatchDevice[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Always filter by router profile ID
    conditions.push(eq(netwatchDevicesTable.router_profile_id, filter.router_profile_id));

    // Apply status filter if specified and not 'all'
    if (filter.status && filter.status !== 'all') {
      conditions.push(eq(netwatchDevicesTable.status, filter.status));
    }

    // Apply search filter if specified
    if (filter.search) {
      const searchPattern = `%${filter.search.toLowerCase()}%`;
      const searchCondition = or(
        sql`LOWER(${netwatchDevicesTable.host}) LIKE ${searchPattern}`,
        sql`LOWER(${netwatchDevicesTable.comment}) LIKE ${searchPattern}`
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    // Execute query with all conditions
    const results = await db.select()
      .from(netwatchDevicesTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .execute();
    
    return results;
  } catch (error) {
    console.error('Failed to fetch netwatch devices:', error);
    throw error;
  }
};