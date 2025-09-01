import { type RouterConnectionInput, type MockNetwatchData, type NetwatchDevice } from '../schema';

export async function syncNetwatchData(input: RouterConnectionInput): Promise<MockNetwatchData> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is connecting to MikroTik router and fetching fresh netwatch data.
    // It should update the database with the latest device statuses and return the updated data.
    // For now, it generates mock data to simulate real-time updates.
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate mock netwatch data with random statuses to simulate real-time changes
    const mockDevices: NetwatchDevice[] = [
        {
            id: 1,
            router_profile_id: 1, // This should be determined by the connection
            mikrotik_id: "*1",
            host: "8.8.8.8",
            comment: "Google DNS",
            status: Math.random() > 0.1 ? "up" : "down", // 90% uptime
            since: new Date(Date.now() - Math.random() * 7200000), // Random time in last 2 hours
            timeout: "5s",
            interval: "00:01:00",
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            id: 2,
            router_profile_id: 1,
            mikrotik_id: "*2",
            host: "192.168.1.100",
            comment: "Server Internal",
            status: Math.random() > 0.2 ? "up" : "down", // 80% uptime
            since: new Date(Date.now() - Math.random() * 3600000), // Random time in last hour
            timeout: "3s",
            interval: "00:01:00",
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            id: 3,
            router_profile_id: 1,
            mikrotik_id: "*3",
            host: "192.168.1.50",
            comment: "Printer HP",
            status: Math.random() > 0.15 ? "up" : "down", // 85% uptime
            since: new Date(Date.now() - Math.random() * 1800000), // Random time in last 30 minutes
            timeout: "5s",
            interval: "00:02:00",
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            id: 4,
            router_profile_id: 1,
            mikrotik_id: "*4",
            host: "1.1.1.1",
            comment: "Cloudflare DNS",
            status: Math.random() > 0.05 ? "up" : "down", // 95% uptime
            since: new Date(Date.now() - Math.random() * 10800000), // Random time in last 3 hours
            timeout: "5s",
            interval: "00:01:00",
            created_at: new Date(),
            updated_at: new Date()
        }
    ];
    
    const upCount = mockDevices.filter(d => d.status === 'up').length;
    const downCount = mockDevices.filter(d => d.status === 'down').length;
    
    const mockData: MockNetwatchData = {
        devices: mockDevices,
        summary: {
            total_devices: mockDevices.length,
            up_devices: upCount,
            down_devices: downCount,
            last_updated: new Date()
        }
    };
    
    return Promise.resolve(mockData);
}