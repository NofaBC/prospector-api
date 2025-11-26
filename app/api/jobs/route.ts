// app/api/jobs/route.ts
import { NextResponse } from 'next/server';
import { Job } from '@/lib/types';

// Mock data - replace with real Firebase/db calls later
const mockJobs: Job[] = [
  {
    id: 'job-1',
    status: 'done',
    seedUrl: 'https://example.com',
    area: 'Technology',
    createdAt: new Date().toISOString(),
    counts: { found: 45, appended: 42 },
    sheetUrl: 'https://sheets.google.com/...'
  },
  {
    id: 'job-2',
    status: 'running',
    seedUrl: 'https://test.com',
    area: 'Healthcare',
    createdAt: new Date().toISOString(),
    counts: { found: 12, appended: 8 }
  },
  {
    id: 'job-3',
    status: 'queued',
    seedUrl: 'https://demo.com',
    area: 'Finance',
    createdAt: new Date().toISOString(),
    counts: { found: 0, appended: 0 }
  }
];

export async function GET() {
  try {
    // TODO: Replace with actual database fetch
    // const jobs = await db.collection('jobs').orderBy('createdAt', 'desc').get();
    
    return NextResponse.json({ jobs: mockJobs });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
