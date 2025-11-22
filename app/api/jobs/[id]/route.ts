// app/api/jobs/[id]/route.ts
import { NextRequest } from 'next/server';
import { JobIdSchema } from '@/lib/validate';
import { getJob, processNextBatch, cancelJob } from '@/lib/jobs';
import { getProspectsSample, FirestoreConfigError } from '@/lib/firestore';
import { logging } from '@/lib/logging';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = JobIdSchema.parse(params.id);
    const job = await getJob(jobId);

    if (!job) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const prospectsSample = await getProspectsSample(jobId);

    return new Response(JSON.stringify({ job, prospectsSample }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    logging.error('Error in /api/jobs/[id] GET:', error);

    if (error instanceof FirestoreConfigError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (error.name === 'ZodError') {
      return new Response(JSON.stringify({ error: 'Invalid job ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = JobIdSchema.parse(params.id);
    await processNextBatch(jobId);

    return new Response(
      JSON.stringify({ message: 'Batch processed successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    logging.error('Error in /api/jobs/[id] POST:', error);

    if (error instanceof FirestoreConfigError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (error.name === 'ZodError') {
      return new Response(JSON.stringify({ error: 'Invalid job ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = JobIdSchema.parse(params.id);
    await cancelJob(jobId);

    return new Response(
      JSON.stringify({ message: 'Job canceled successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    logging.error('Error in /api/jobs/[id] DELETE:', error);

    if (error instanceof FirestoreConfigError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (error.name === 'ZodError') {
      return new Response(JSON.stringify({ error: 'Invalid job ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
