import { z } from 'zod';

// Router connection profile schema
export const routerProfileSchema = z.object({
  id: z.number(),
  name: z.string(),
  host: z.string(),
  username: z.string(),
  password: z.string(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type RouterProfile = z.infer<typeof routerProfileSchema>;

// Input schema for creating router profiles
export const createRouterProfileInputSchema = z.object({
  name: z.string().min(1, "Router name is required"),
  host: z.string().min(1, "Host/IP address is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  is_active: z.boolean().optional().default(false)
});

export type CreateRouterProfileInput = z.infer<typeof createRouterProfileInputSchema>;

// Input schema for updating router profiles
export const updateRouterProfileInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  host: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  password: z.string().min(1).optional(),
  is_active: z.boolean().optional()
});

export type UpdateRouterProfileInput = z.infer<typeof updateRouterProfileInputSchema>;

// Netwatch device schema
export const netwatchDeviceSchema = z.object({
  id: z.number(),
  router_profile_id: z.number(),
  mikrotik_id: z.string(), // Original MikroTik ID from API
  host: z.string(),
  comment: z.string().nullable(),
  status: z.enum(['up', 'down']),
  since: z.coerce.date(),
  timeout: z.string().nullable(),
  interval: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type NetwatchDevice = z.infer<typeof netwatchDeviceSchema>;

// Input schema for creating netwatch devices
export const createNetwatchDeviceInputSchema = z.object({
  router_profile_id: z.number(),
  mikrotik_id: z.string(),
  host: z.string().min(1, "Host/IP address is required"),
  comment: z.string().nullable().optional(),
  status: z.enum(['up', 'down']),
  since: z.coerce.date(),
  timeout: z.string().nullable().optional(),
  interval: z.string().nullable().optional()
});

export type CreateNetwatchDeviceInput = z.infer<typeof createNetwatchDeviceInputSchema>;

// Input schema for updating netwatch devices
export const updateNetwatchDeviceInputSchema = z.object({
  id: z.number(),
  host: z.string().min(1).optional(),
  comment: z.string().nullable().optional(),
  status: z.enum(['up', 'down']).optional(),
  since: z.coerce.date().optional(),
  timeout: z.string().nullable().optional(),
  interval: z.string().nullable().optional()
});

export type UpdateNetwatchDeviceInput = z.infer<typeof updateNetwatchDeviceInputSchema>;

// Authentication schema for router connection
export const routerConnectionInputSchema = z.object({
  host: z.string().min(1, "Host/IP address is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});

export type RouterConnectionInput = z.infer<typeof routerConnectionInputSchema>;

// Connection result schema
export const connectionResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  router_identity: z.string().nullable()
});

export type ConnectionResult = z.infer<typeof connectionResultSchema>;

// Netwatch status summary schema
export const netwatchSummarySchema = z.object({
  total_devices: z.number().int(),
  up_devices: z.number().int(),
  down_devices: z.number().int(),
  last_updated: z.coerce.date()
});

export type NetwatchSummary = z.infer<typeof netwatchSummarySchema>;

// Search and filter schema
export const netwatchFilterInputSchema = z.object({
  router_profile_id: z.number(),
  search: z.string().optional(),
  status: z.enum(['up', 'down', 'all']).optional().default('all')
});

export type NetwatchFilterInput = z.infer<typeof netwatchFilterInputSchema>;

// Mock data response for development
export const mockNetwatchDataSchema = z.object({
  devices: z.array(netwatchDeviceSchema),
  summary: netwatchSummarySchema
});

export type MockNetwatchData = z.infer<typeof mockNetwatchDataSchema>;