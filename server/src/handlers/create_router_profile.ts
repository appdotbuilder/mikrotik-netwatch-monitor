import { db } from '../db';
import { routerProfilesTable } from '../db/schema';
import { type CreateRouterProfileInput, type RouterProfile } from '../schema';

export const createRouterProfile = async (input: CreateRouterProfileInput): Promise<RouterProfile> => {
  try {
    // Insert router profile record
    const result = await db.insert(routerProfilesTable)
      .values({
        name: input.name,
        host: input.host,
        username: input.username,
        password: input.password,
        is_active: input.is_active ?? false // Use nullish coalescing for default
      })
      .returning()
      .execute();

    // Return the created router profile
    const routerProfile = result[0];
    return routerProfile;
  } catch (error) {
    console.error('Router profile creation failed:', error);
    throw error;
  }
};