'use client'

import { useState, useEffect } from "react";
import { Job, JobStatus } from "@/lib/types";

export default function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const response = await fetch("/api/jobs");
        if (!response.ok) {
          throw new Error("Failed to fetch jobs");
        }
        const data = await response.json();
        setJobs(data.jobs);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, []);

  function getStatusColor(status: JobStatus): string {
    switch (status) {
      case "queued": return "bg-yellow-100 text-yellow-800";
      case "running": return "bg-blue-100 text-blue-800";
      case "done": return "bg-green-100 text-green-800";
      case "error": return "bg-red-100 text-red-800";
      case "canceled": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }

  if (loading) return <div className="p-4">Loading jobs...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Prospector Jobs</h1>
      {jobs.length === 0 ? (
        <p>No jobs found. Create a new job to get started.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seed URL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Found</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appended</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{job.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(job.status)}`}>{job.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">{job.seedUrl}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.area}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.counts.found}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.counts.appended}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(job.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <a href={`/jobs/${job.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">View</a>
                    {job.sheetUrl && (
                      <a href={job.sheetUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-900">Sheet</a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
