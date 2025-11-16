import { z } from 'zod';

/**
 * Schema for /api/run request body
 */
export const runJobSchema = z.object({
  seedUrl: z.string().url('Invalid seed URL'),
  area: z.string().min(1, 'Area is required'),
  keywordOverride: z.string().optional(),
  radius: z.number().min(1).max(50000).optional().default(16000),
  maxResults: z.number().min(1).max(300).optional().default(100),
  webhookUrl: z.string().url('Invalid webhook URL').optional()
});

export type RunJobInput = z.infer<typeof runJobSchema>;

/**
 * Schema for prospect data
 */
export const prospectSchema = z.object({
  jobId: z.string(),
  placeId: z.string(),
  name: z.string(),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  domain: z.string().optional(),
  email: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
  types: z.array(z.string()).optional(),
  rating: z.number().optional(),
  user_ratings_total: z.number().optional(),
  source: z.string().default('places'),
  createdAt: z.string()
});

export type Prospect = z.infer<typeof prospectSchema>;

/**
 * Validate request body
 */
export function validateRunJob(data: unknown): RunJobInput {
  return runJobSchema.parse(data);
}
