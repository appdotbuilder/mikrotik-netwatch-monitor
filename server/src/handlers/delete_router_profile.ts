import { db } from '../db';
import { routerProfilesTable, netwatchDevicesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteRouterProfile(id: number): Promise<{ success: boolean; message: string }> {
  try {
    // First, check if the router profile exists
    const existingProfile = await db.select()
      .from(routerProfilesTable)
      .where(eq(routerProfilesTable.id, id))
      .execute();

    if (existingProfile.length === 0) {
      return {
        success: false,
        message: `Router profile with ID ${id} not found`
      };
    }

    // Check if there are any netwatch devices associated with this router profile
    const associatedDevices = await db.select()
      .from(netwatchDevicesTable)
      .where(eq(netwatchDevicesTable.router_profile_id, id))
      .execute();

    if (associatedDevices.length > 0) {
      return {
        success: false,
        message: `Cannot delete router profile with ID ${id}. It has ${associatedDevices.length} associated netwatch device(s). Please delete the associated devices first.`
      };
    }

    // Delete the router profile
    const deleteResult = await db.delete(routerProfilesTable)
      .where(eq(routerProfilesTable.id, id))
      .returning()
      .execute();

    if (deleteResult.length === 0) {
      return {
        success: false,
        message: `Failed to delete router profile with ID ${id}`
      };
    }

    return {
      success: true,
      message: `Router profile with ID ${id} has been deleted successfully`
    };
  } catch (error) {
    console.error('Router profile deletion failed:', error);
    throw error;
  }
}