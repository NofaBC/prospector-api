// lib/jobs.ts
import { getFirestore } from './firestore';
import { logInfo, logError } from './logging';

export interface Job {
  jobId: string;
  status: 'queued' | 'running' | 'done' | 'error' | 'canceled';
  seedUrl: string;
  inferredKeyword?: string;
  area: string;
  radius: number;
  maxResults: number;
  sheetId?: string;
  sheetUrl?: string;
  cursor?: {
    pageToken?: string;
    offset?: number;
  };
  counts: {
    found: number;
    appended: number;
    deduped: number;
    errors: number;
  };
  createdAt: string;
  updatedAt: string;
  webhookUrl?: string;
}

function buildJob(jobId: string, jobData: Partial<Job>): Job {
  return {
    jobId,
    status: 'queued',
    seedUrl: jobData.seedUrl || '',
    area: jobData.area || '',
    radius: jobData.radius ?? 16000,
    maxResults: jobData.maxResults ?? 100,
    counts: {
      found: jobData.counts?.found ?? 0,
      appended: jobData.counts?.appended ?? 0,
      deduped: jobData.counts?.deduped ?? 0,
      errors: jobData.counts?.errors ?? 0
    },
    createdAt: jobData.createdAt || new Date().toISOString(),
    updatedAt: jobData.updatedAt || new Date().toISOString(),
    inferredKeyword: jobData.inferredKeyword,
    sheetId: jobData.sheetId,
    sheetUrl: jobData.sheetUrl,
    cursor: jobData.cursor,
    webhookUrl: jobData.webhookUrl,
    ...jobData
  } as Job;
}

/**
 * Create a new job in Firestore
 */
export async function createJob(jobData: Partial<Job>): Promise<Job> {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const job = buildJob(jobId, jobData);

  const db = getFirestore();
  await db.collection('jobs').doc(jobId).set(job);
  logInfo(`Created job ${jobId}`);

  return job;
}

/**
 * Get a job from Firestore
 */
export async function getJob(jobId: string): Promise<Job | null> {
  try {
    const db = getFirestore();
    const doc = await db.collection('jobs').doc(jobId).get();

    if (!doc.exists) {
      return null;
    }

    return doc.data() as Job;
  } catch (error) {
    logError(`Error getting job ${jobId}`, error);
    throw error;
  }
}

/**
 * Update a job in Firestore
 */
export async function updateJob(jobId: string, updates: Partial<Job>): Promise<void> {
  try {
    const payload = {
      ...updates,
      updatedAt: new Date().toISOString()
    } as Partial<Job>;

    const db = getFirestore();
    await db.collection('jobs').doc(jobId).update(payload);

    logInfo(`Updated job ${jobId}`, updates);
  } catch (error) {
    logError(`Error updating job ${jobId}`, error);
    throw error;
  }
}

/**
 * Delete a job (mark as canceled)
 */
export async function cancelJob(jobId: string): Promise<void> {
  try {
    await updateJob(jobId, { status: 'canceled' });
    logInfo(`Canceled job ${jobId}`);
  } catch (error) {
    logError(`Error canceling job ${jobId}`, error);
    throw error;
  }
}

/**
 * Process the next batch of prospects for a job
 * Placeholder implementation keeps Firestore in sync so that
 * API routes can be exercised without the full worker pipeline.
 */
export async function processNextBatch(jobId: string): Promise<void> {
  const job = await getJob(jobId);

  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  const nextStatus = job.status === 'queued' ? 'running' : job.status;

  await updateJob(jobId, {
    status: nextStatus,
    counts: job.counts
  });

  logInfo(`Processed next batch for job ${jobId}`);
}

/**
 * Get recent jobs
 */
export async function getRecentJobs(limit: number = 10): Promise<Job[]> {
  try {
    const db = getFirestore();
    const snapshot = await db
      .collection('jobs')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => doc.data() as Job);
  } catch (error) {
    logError('Error getting recent jobs', error);
    throw error;
  }
}
