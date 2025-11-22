diff --git a/components/JobList.tsx b/components/JobList.tsx
index c9955c7eb97d8a44ba7d6c835fb3d55762d130e7..8cfc90b301697ebee8e0ef6fed774211f403154a 100644
--- a/components/JobList.tsx
+++ b/components/JobList.tsx
@@ -1,84 +1,109 @@
-'use client'
+'use client';
 
-import { useState, useEffect } from 'react'
-import Link from 'next/link'
+import { useState, useEffect } from 'react';
+import Link from 'next/link';
 
 interface Job {
-id: string;
-status: string;
-createdAt: string;
-seedUrl: string;
-area: string;
-counts: {
-found: number;
-appended: number;
-deduped: number;
-errors: number;
-};
+  jobId: string;
+  status: string;
+  createdAt: string;
+  seedUrl: string;
+  area: string;
+  counts: {
+    found: number;
+    appended: number;
+    deduped: number;
+    errors: number;
+  };
 }
 
 export default function JobList() {
-const [jobs, setJobs] = useState<Job[]>([])
-const [loading, setLoading] = useState(true)
+  const [jobs, setJobs] = useState<Job[]>([]);
+  const [loading, setLoading] = useState(true);
 
-useEffect(() => {
-const fetchJobs = async () => {
-try {
-const response = await fetch('/api/jobs')
-if (response.ok) {
-const data = await response.json()
-setJobs(data.jobs)
-}
-} catch (error) {
-console.error('Error fetching jobs:', error)
-} finally {
-setLoading(false)
-}
-}
+  useEffect(() => {
+    const fetchJobs = async () => {
+      try {
+        const response = await fetch('/api/jobs');
+        if (response.ok) {
+          const data = await response.json();
+          setJobs(data.jobs);
+        }
+      } catch (error) {
+        console.error('Error fetching jobs:', error);
+      } finally {
+        setLoading(false);
+      }
+    };
 
-fetchJobs()
-}, [])
+    fetchJobs();
+  }, []);
 
-if (loading) {
-return <div>Loading recent jobs...</div>
-}
+  if (loading) {
+    return <div>Loading recent jobs...</div>;
+  }
 
-return (
-<div className="overflow-x-auto">
-<table className="min-w-full divide-y divide-gray-200">
-<thead className="bg-gray-50">
-<tr>
-<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job ID</th>
-<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
-<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seed URL</th>
-<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
-<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Counts</th>
-<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
-</tr>
-</thead>
-<tbody className="bg-white divide-y divide-gray-200">
-{jobs.map((job) => (
-<tr key={job.id}>
-<td className="px-6 py-4 whitespace-nowrap">
-<Link href={/jobs/${job.id}} className="text-indigo-600 hover:text-indigo-900">
-{job.id}
-</Link>
-</td>
-<td className="px-6 py-4 whitespace-nowrap">
-<span className={px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ job.status === 'done' ? 'bg-green-100 text-green-800' : job.status === 'running' ? 'bg-yellow-100 text-yellow-800' : job.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800' }}>
-{job.status}
-</span>
-</td>
-<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">{job.seedUrl}</td>
-<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.area}</td>
-<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
-Found: {job.counts.found}, Appended: {job.counts.appended}, Deduped: {job.counts.deduped}, Errors: {job.counts.errors}
-</td>
-<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(job.createdAt).toLocaleString()}</td>
-</tr>
-))}
-</tbody>
-</table>
-</div>
-)
+  return (
+    <div className="overflow-x-auto">
+      <table className="min-w-full divide-y divide-gray-200">
+        <thead className="bg-gray-50">
+          <tr>
+            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
+              Job ID
+            </th>
+            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
+              Status
+            </th>
+            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
+              Seed URL
+            </th>
+            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
+              Area
+            </th>
+            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
+              Counts
+            </th>
+            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
+              Created
+            </th>
+          </tr>
+        </thead>
+        <tbody className="bg-white divide-y divide-gray-200">
+          {jobs.map(job => (
+            <tr key={job.jobId}>
+              <td className="px-6 py-4 whitespace-nowrap">
+                <Link href={`/jobs/${job.jobId}`} className="text-indigo-600 hover:text-indigo-900">
+                  {job.jobId}
+                </Link>
+              </td>
+              <td className="px-6 py-4 whitespace-nowrap">
+                <span
+                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
+                    job.status === 'done'
+                      ? 'bg-green-100 text-green-800'
+                      : job.status === 'running'
+                      ? 'bg-yellow-100 text-yellow-800'
+                      : job.status === 'error'
+                      ? 'bg-red-100 text-red-800'
+                      : 'bg-gray-100 text-gray-800'
+                  }`}
+                >
+                  {job.status}
+                </span>
+              </td>
+              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">{job.seedUrl}</td>
+              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.area}</td>
+              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
+                Found: {job.counts.found}, Appended: {job.counts.appended}, Deduped: {job.counts.deduped}, Errors:{' '}
+                {job.counts.errors}
+              </td>
+              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
+                {new Date(job.createdAt).toLocaleString()}
+              </td>
+            </tr>
+          ))}
+        </tbody>
+      </table>
+    </div>
+  );
 }
