import { z } from 'zod';

export const RunJobSchema = z.object({
seedUrl: z.string().url(),
area: z.string().min(1),
keywordOverride: z.string().optional(),
radius: z.number().min(1).max(50000).optional().default(16000),
maxResults: z.number().min(1).max(300).optional().default(100),
webhookUrl: z.string().url().optional()
});

export const JobIdSchema = z.string().min(1);

export const WebhookSchema = z.object({
jobId: z.string().min(1),
status: z.enum(['queued', 'running', 'done', 'error', 'canceled']),
counts: z.object({
found: z.number(),
appended: z.number(),
deduped: z.number(),
errors: z.number()
})
});
