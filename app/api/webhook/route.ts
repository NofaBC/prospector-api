// app/api/webhook/route.ts
import { NextRequest } from 'next/server';
import { WebhookSchema } from '@/lib/validate';
import { getJob } from '@/lib/jobs';
import { logging } from '@/lib/logging';
import { FirestoreConfigError } from '@/lib/firestore';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Validate webhook payload
    const payload = WebhookSchema.parse(await request.json());

    // Load the job (to get its webhookUrl, if any)
    const job = await getJob(payload.jobId);
    if (!job) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // If the job has a webhook URL, forward the payload
    if (job.webhookUrl) {
      const response = await fetch(job.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        logging.error(
          `Failed to forward webhook to ${job.webhookUrl}: ${response.status}`
        );
        // Intentionally do not fail the request just because forwarding failed
      } else {
        logging.info(`Successfully forwarded webhook to ${job.webhookUrl}`);
      }
    }

    return new Response(JSON.stringify({ message: 'Webhook processed' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    logging.error('Error in /api/webhook:', error);

    if (error instanceof FirestoreConfigError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (error.name === 'ZodError') {
      return new Response(
        JSON.stringify({
          error: 'Invalid webhook payload',
          details: error.errors
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
