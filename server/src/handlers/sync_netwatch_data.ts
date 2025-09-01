import { db } from '../db';
import { routerProfilesTable, netwatchDevicesTable } from '../db/schema';
import { type RouterConnectionInput, type MockNetwatchData, type NetwatchDevice } from '../schema';
import { eq, and, sql } from 'drizzle-orm';

export const syncNetwatchData = async (input: RouterConnectionInput): Promise<MockNetwatchData> => {
  try {
    // Find router profile by connection details
    const routerProfiles = await db.select()
      .from(routerProfilesTable)
      .where(
        and(
          eq(routerProfilesTable.host, input.host),
          eq(routerProfilesTable.username, input.username),
          eq(routerProfilesTable.password, input.password)
        )
      )
      .execute();

    if (routerProfiles.length === 0) {
      throw new Error('Router profile not found with provided connection details');
    }

    const routerProfile = routerProfiles[0];

    // Simulate API call delay (simulating MikroTik API connection)
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Generate mock netwatch data with random statuses to simulate real-time changes
    const mockNetwatchData = [
      {
        mikrotik_id: "*1",
        host: "8.8.8.8",
        comment: "Google DNS",
        status: (Math.random() > 0.1 ? "up" : "down") as "up" | "down", // 90% uptime
        since: new Date(Date.now() - Math.random() * 7200000), // Random time in last 2 hours
        timeout: "5s",
        interval: "00:01:00"
      },
      {
        mikrotik_id: "*2",
        host: "192.168.1.100",
        comment: "Server Internal",
        status: (Math.random() > 0.2 ? "up" : "down") as "up" | "down", // 80% uptime
        since: new Date(Date.now() - Math.random() * 3600000), // Random time in last hour
        timeout: "3s",
        interval: "00:01:00"
      },
      {
        mikrotik_id: "*3",
        host: "192.168.1.50",
        comment: "Printer HP",
        status: (Math.random() > 0.15 ? "up" : "down") as "up" | "down", // 85% uptime
        since: new Date(Date.now() - Math.random() * 1800000), // Random time in last 30 minutes
        timeout: "5s",
        interval: "00:02:00"
      },
      {
        mikrotik_id: "*4",
        host: "1.1.1.1",
        comment: "Cloudflare DNS",
        status: (Math.random() > 0.05 ? "up" : "down") as "up" | "down", // 95% uptime
        since: new Date(Date.now() - Math.random() * 10800000), // Random time in last 3 hours
        timeout: "5s",
        interval: "00:01:00"
      }
    ];

    // Update database with new data using upsert pattern
    const updatedDevices: NetwatchDevice[] = [];
    
    for (const deviceData of mockNetwatchData) {
      // Check if device exists
      const existingDevices = await db.select()
        .from(netwatchDevicesTable)
        .where(
          and(
            eq(netwatchDevicesTable.router_profile_id, routerProfile.id),
            eq(netwatchDevicesTable.mikrotik_id, deviceData.mikrotik_id)
          )
        )
        .execute();

      if (existingDevices.length > 0) {
        // Update existing device
        const updateResult = await db.update(netwatchDevicesTable)
          .set({
            host: deviceData.host,
            comment: deviceData.comment || null,
            status: deviceData.status,
            since: deviceData.since,
            timeout: deviceData.timeout || null,
            interval: deviceData.interval || null,
            updated_at: new Date()
          })
          .where(eq(netwatchDevicesTable.id, existingDevices[0].id))
          .returning()
          .execute();

        updatedDevices.push(updateResult[0]);
      } else {
        // Insert new device
        const insertResult = await db.insert(netwatchDevicesTable)
          .values({
            router_profile_id: routerProfile.id,
            mikrotik_id: deviceData.mikrotik_id,
            host: deviceData.host,
            comment: deviceData.comment || null,
            status: deviceData.status,
            since: deviceData.since,
            timeout: deviceData.timeout || null,
            interval: deviceData.interval || null
          })
          .returning()
          .execute();

        updatedDevices.push(insertResult[0]);
      }
    }

    // Calculate summary statistics
    const upCount = updatedDevices.filter(d => d.status === 'up').length;
    const downCount = updatedDevices.filter(d => d.status === 'down').length;
    
    const mockData: MockNetwatchData = {
      devices: updatedDevices,
      summary: {
        total_devices: updatedDevices.length,
        up_devices: upCount,
        down_devices: downCount,
        last_updated: new Date()
      }
    };
    
    return mockData;
  } catch (error) {
    console.error('Netwatch data sync failed:', error);
    throw error;
  }
};