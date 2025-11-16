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

/**
 * Create a new job in Firestore
 */
export async function createJob(jobData: Partial<Job>): Promise<Job> {
  const db = getFirestore();
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const job: Job = {
    jobId,
    status: 'queued',
    seedUrl: jobData.seedUrl || '',
    area: jobData.area || '',
    radius: jobData.radius || 16000,
    maxResults: jobData.maxResults || 100,
    counts: {
      found: 0,
      appended: 0,
      deduped: 0,
      errors: 0
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...jobData
  };

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
    const db = getFirestore();
    await db.collection('jobs').doc(jobId).update({
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    logInfo(`Updated job ${jobId}`, updates);
  } catch (error) {
    logError(`Error updating job ${jobId}`, error);
    throw error;
  }
}

/**
 * Delete a job (mark as canceled)
 */
export async function deleteJob(jobId: string): Promise<void> {
  try {
    await updateJob(jobId, { status: 'canceled' });
    logInfo(`Canceled job ${jobId}`);
  } catch (error) {
    logError(`Error canceling job ${jobId}`, error);
    throw error;
  }
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
    return [];
  }
}
