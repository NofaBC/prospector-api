import { NextRequest } from 'next/server';
import { RunJobSchema } from '@/lib/validate';
import { checkRateLimit, getRetryAfter } from '@/lib/rateLimit';
import { createJob } from '@/lib/jobs';
import { logging } from '@/lib/logging';

export async function POST(request: NextRequest) {
try {
// Rate limiting based on IP and seedUrl
const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
const requestBody = await request.json();
const seedUrl = requestBody.seedUrl;

const rateLimitKey = `${ip}_${seedUrl}`;
if (!checkRateLimit(rateLimitKey)) {
return new Response(
JSON.stringify({ error: 'Rate limit exceeded' }),
{
status: 429,
headers: {
'Content-Type': 'application/json',
'Retry-After': getRetryAfter(rateLimitKey).toString()
}
}
);
}

// Validate input
const validatedData = RunJobSchema.parse(requestBody);

// Create job
const result = await createJob(validatedData);

return new Response(JSON.stringify(result), {
status: 200,
headers: { 'Content-Type': 'application/json' }
});
} catch (error: any) {
logging.error('Error in /api/run:', error);

if (error.name === 'ZodError') {
return new Response(
JSON.stringify({ error: 'Invalid input', details: error.errors }),
{ status: 400, headers: { 'Content-Type': 'application/json' } }
);
}

return new Response(
JSON.stringify({ error: error.message || 'Internal server error' }),
{ status: 500, headers: { 'Content-Type': 'application/json' } }
);
}
}
