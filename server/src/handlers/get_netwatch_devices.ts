import { type NetwatchFilterInput, type NetwatchDevice } from '../schema';

export async function getNetwatchDevices(filter: NetwatchFilterInput): Promise<NetwatchDevice[]> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is fetching netwatch devices from the database for a specific router profile.
    // It should support filtering by search term and status.
    // In the real implementation, this would sync data from MikroTik API and return filtered results.
    
    // Mock data for demonstration
    const mockDevices: NetwatchDevice[] = [
        {
            id: 1,
            router_profile_id: filter.router_profile_id,
            mikrotik_id: "*1",
            host: "8.8.8.8",
            comment: "Google DNS",
            status: "up",
            since: new Date(Date.now() - 3600000), // 1 hour ago
            timeout: "5s",
            interval: "00:01:00",
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            id: 2,
            router_profile_id: filter.router_profile_id,
            mikrotik_id: "*2",
            host: "192.168.1.100",
            comment: "Server Internal",
            status: "down",
            since: new Date(Date.now() - 300000), // 5 minutes ago
            timeout: "3s",
            interval: "00:01:00",
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            id: 3,
            router_profile_id: filter.router_profile_id,
            mikrotik_id: "*3",
            host: "192.168.1.50",
            comment: "Printer HP",
            status: "up",
            since: new Date(Date.now() - 7200000), // 2 hours ago
            timeout: "5s",
            interval: "00:02:00",
            created_at: new Date(),
            updated_at: new Date()
        }
    ];
    
    // Apply filtering based on search and status
    let filteredDevices = mockDevices;
    
    if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredDevices = filteredDevices.filter(device => 
            device.host.toLowerCase().includes(searchLower) ||
            (device.comment && device.comment.toLowerCase().includes(searchLower))
        );
    }
    
    if (filter.status && filter.status !== 'all') {
        filteredDevices = filteredDevices.filter(device => device.status === filter.status);
    }
    
    return Promise.resolve(filteredDevices);
}