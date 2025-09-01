import { db } from '../db';
import { netwatchDevicesTable, routerProfilesTable } from '../db/schema';
import { type NetwatchSummary } from '../schema';
import { eq, count, and, sql } from 'drizzle-orm';

export async function getNetwatchSummary(routerProfileId: number): Promise<NetwatchSummary> {
  try {
    // Verify router profile exists
    const routerProfile = await db.select()
      .from(routerProfilesTable)
      .where(eq(routerProfilesTable.id, routerProfileId))
      .execute();

    if (routerProfile.length === 0) {
      throw new Error(`Router profile with ID ${routerProfileId} not found`);
    }

    // Get summary statistics for the specified router profile
    const summaryResult = await db.select({
      total_devices: count(),
      up_devices: sql<number>`COUNT(CASE WHEN ${netwatchDevicesTable.status} = 'up' THEN 1 END)`,
      down_devices: sql<number>`COUNT(CASE WHEN ${netwatchDevicesTable.status} = 'down' THEN 1 END)`,
      last_updated: sql<Date>`MAX(${netwatchDevicesTable.updated_at})`
    })
    .from(netwatchDevicesTable)
    .where(eq(netwatchDevicesTable.router_profile_id, routerProfileId))
    .execute();

    const result = summaryResult[0];

    return {
      total_devices: Number(result.total_devices),
      up_devices: Number(result.up_devices),
      down_devices: Number(result.down_devices),
      last_updated: result.last_updated ? new Date(result.last_updated) : new Date()
    };
  } catch (error) {
    console.error('Get netwatch summary failed:', error);
    throw error;
  }
}