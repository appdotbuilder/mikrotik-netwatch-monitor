import { type RouterProfile } from '../schema';

export async function getRouterProfiles(): Promise<RouterProfile[]> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is fetching all saved router profiles from the database.
    // This will populate the "Tersimpan" (Saved) screen with user's saved connection profiles.
    return Promise.resolve([
        {
            id: 1,
            name: "Router Kantor",
            host: "192.168.1.1",
            username: "admin",
            password: "password123",
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            id: 2,
            name: "Router Rumah",
            host: "192.168.0.1",
            username: "admin",
            password: "homepass",
            is_active: false,
            created_at: new Date(),
            updated_at: new Date()
        }
    ] as RouterProfile[]);
}