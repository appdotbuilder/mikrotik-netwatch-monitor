import { serial, text, pgTable, timestamp, boolean, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for netwatch device status
export const netwatchStatusEnum = pgEnum('netwatch_status', ['up', 'down']);

// Router profiles table - stores saved connection profiles
export const routerProfilesTable = pgTable('router_profiles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  host: text('host').notNull(),
  username: text('username').notNull(),
  password: text('password').notNull(), // In production, this should be encrypted
  is_active: boolean('is_active').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Netwatch devices table - stores monitored devices from MikroTik
export const netwatchDevicesTable = pgTable('netwatch_devices', {
  id: serial('id').primaryKey(),
  router_profile_id: integer('router_profile_id').references(() => routerProfilesTable.id).notNull(),
  mikrotik_id: text('mikrotik_id').notNull(), // Original MikroTik ID from API
  host: text('host').notNull(),
  comment: text('comment'), // Nullable - device name/description
  status: netwatchStatusEnum('status').notNull(),
  since: timestamp('since').notNull(), // When status last changed
  timeout: text('timeout'), // Nullable - timeout setting
  interval: text('interval'), // Nullable - check interval setting
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Define relations between tables
export const routerProfilesRelations = relations(routerProfilesTable, ({ many }) => ({
  netwatchDevices: many(netwatchDevicesTable)
}));

export const netwatchDevicesRelations = relations(netwatchDevicesTable, ({ one }) => ({
  routerProfile: one(routerProfilesTable, {
    fields: [netwatchDevicesTable.router_profile_id],
    references: [routerProfilesTable.id]
  })
}));

// TypeScript types for the table schemas
export type RouterProfile = typeof routerProfilesTable.$inferSelect; // For SELECT operations
export type NewRouterProfile = typeof routerProfilesTable.$inferInsert; // For INSERT operations

export type NetwatchDevice = typeof netwatchDevicesTable.$inferSelect; // For SELECT operations
export type NewNetwatchDevice = typeof netwatchDevicesTable.$inferInsert; // For INSERT operations

// Export all tables for proper query building
export const tables = { 
  routerProfiles: routerProfilesTable,
  netwatchDevices: netwatchDevicesTable
};