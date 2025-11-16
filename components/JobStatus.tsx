'use client';

import { useEffect, useState } from 'react';

interface Job {
  jobId: string;
  status: string;
  sheetUrl?: string;
  counts: {
    found: number;
    appended: number;
    deduped: number;
    errors: number;
  };
}

interface JobStatusProps {
  jobId: string;
}

export default function JobStatus({ jobId }: JobStatusProps) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJobStatus();
    const interval = setInterval(fetchJobStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [jobId]);

  const fetchJobStatus = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch job status');
      }
      const data = await response.json();
      setJob(data.job);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  const processNextBatch = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Failed to process batch');
      }
      await fetchJobStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const cancelJob = async () => {
    if (!confirm('Are you sure you want to cancel this job?')) return;
    
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Failed to cancel job');
      }
      await fetchJobStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  if (loading && !job) {
    return <div className="p-4">Loading job status...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  if (!job) {
    return <div className="p-4">Job not found</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Job Status</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Job ID</p>
            <p className="font-mono">{job.jobId}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <p className="font-semibold capitalize">{job.status}</p>
          </div>
        </div>

        {job.sheetUrl && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Google Sheet</p>
            <a 
              href={job.sheetUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View Spreadsheet →
            </a>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Found</p>
            <p className="text-2xl font-bold">{job.counts.found}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Appended</p>
            <p className="text-2xl font-bold">{job.counts.appended}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Deduped</p>
            <p className="text-2xl font-bold">{job.counts.deduped}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Errors</p>
            <p className="text-2xl font-bold text-red-600">{job.counts.errors}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        {job.status === 'running' && (
          <button
            onClick={processNextBatch}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Process Next Batch'}
          </button>
        )}
        
        {(job.status === 'running' || job.status === 'queued') && (
          <button
            onClick={cancelJob}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Cancel Job
          </button>
        )}
      </div>
    </div>
  );
}
