import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import all schemas
import {
  createRouterProfileInputSchema,
  updateRouterProfileInputSchema,
  routerConnectionInputSchema,
  netwatchFilterInputSchema
} from './schema';

// Import all handlers
import { createRouterProfile } from './handlers/create_router_profile';
import { getRouterProfiles } from './handlers/get_router_profiles';
import { updateRouterProfile } from './handlers/update_router_profile';
import { deleteRouterProfile } from './handlers/delete_router_profile';
import { testRouterConnection } from './handlers/test_router_connection';
import { getNetwatchDevices } from './handlers/get_netwatch_devices';
import { getNetwatchSummary } from './handlers/get_netwatch_summary';
import { syncNetwatchData } from './handlers/sync_netwatch_data';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Router Profile Management
  createRouterProfile: publicProcedure
    .input(createRouterProfileInputSchema)
    .mutation(({ input }) => createRouterProfile(input)),

  getRouterProfiles: publicProcedure
    .query(() => getRouterProfiles()),

  updateRouterProfile: publicProcedure
    .input(updateRouterProfileInputSchema)
    .mutation(({ input }) => updateRouterProfile(input)),

  deleteRouterProfile: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteRouterProfile(input.id)),

  // Router Connection Testing
  testRouterConnection: publicProcedure
    .input(routerConnectionInputSchema)
    .mutation(({ input }) => testRouterConnection(input)),

  // Netwatch Device Management
  getNetwatchDevices: publicProcedure
    .input(netwatchFilterInputSchema)
    .query(({ input }) => getNetwatchDevices(input)),

  getNetwatchSummary: publicProcedure
    .input(z.object({ routerProfileId: z.number() }))
    .query(({ input }) => getNetwatchSummary(input.routerProfileId)),

  // Real-time data synchronization
  syncNetwatchData: publicProcedure
    .input(routerConnectionInputSchema)
    .mutation(({ input }) => syncNetwatchData(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`MikroTik Netwatch Monitor TRPC server listening at port: ${port}`);
  console.log('Available endpoints:');
  console.log('- healthcheck: GET /healthcheck');
  console.log('- Router Profiles: createRouterProfile, getRouterProfiles, updateRouterProfile, deleteRouterProfile');
  console.log('- Connection Testing: testRouterConnection');
  console.log('- Netwatch Monitoring: getNetwatchDevices, getNetwatchSummary, syncNetwatchData');
}

start();