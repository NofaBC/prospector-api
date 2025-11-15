'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Job {
id: string;
status: string;
seedUrl: string;
area: string;
radius: number;
maxResults: number;
sheetId: string;
sheetUrl: string;
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

interface Prospect {
name: string;
phone: string;
address: string;
website: string;
email?: string;
rating?: number;
user_ratings_total?: number;
}

export default function JobStatus({ jobId }: { jobId: string }) {
const router = useRouter()
const [job, setJob] = useState<Job | null>(null)
const [prospects, setProspects] = useState<Prospect[]>([])
const [loading, setLoading] = useState(true)
const [processLoading, setProcessLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

const fetchJob = async () => {
try {
const response = await fetch(/api/jobs/${jobId})
if (!response.ok) {
throw new Error('Failed to fetch job status')
}
const data = await response.json()
setJob(data.job)
if (data.prospectsSample) {
setProspects(data.prospectsSample)
}
} catch (err) {
setError(err instanceof Error ? err.message : 'An unknown error occurred')
} finally {
setLoading(false)
}
}

const handleProcessNext = async () => {
setProcessLoading(true)
try {
const response = await fetch(/api/jobs/${jobId}, {
method: 'POST'
})
if (!response.ok) {
throw new Error('Failed to process next batch')
}
await fetchJob() // Refresh job status
} catch (err) {
setError(err instanceof Error ? err.message : 'An unknown error occurred')
} finally {
setProcessLoading(false)
}
}

const handleCancelJob = async () => {
try {
const response = await fetch(/api/jobs/${jobId}, {
method: 'DELETE'
})
if (!response.ok) {
throw new Error('Failed to cancel job')
}
router.push('/')
} catch (err) {
setError(err instanceof Error ? err.message : 'An unknown error occurred')
}
}

useEffect(() => {
fetchJob()
const interval = setInterval(fetchJob, 5000) // Poll every 5 seconds
return () => clearInterval(interval)
}, [jobId])

if (loading) {
return <div>Loading job status...</div>
}

if (error) {
return <div className="text-red-600">Error: {error}</div>
}

if (!job) {
return <div>Job not found</div>
}

return (
<div>
<div className="mb-6">
<h2 className="text-xl font-semibold mb-2">Job Details</h2>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div><strong>Status:</strong> <span className={px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ job.status === 'done' ? 'bg-green-100 text-green-800' : job.status === 'running' ? 'bg-yellow-100 text-yellow-800' : job.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800' }}>
{job.status}
</span></div>
<div><strong>Seed URL:</strong> {job.seedUrl}</div>
<div><strong>Area:</strong> {job.area}</div>
<div><strong>Radius:</strong> {job.radius}m</div>
<div><strong>Max Results:</strong> {job.maxResults}</div>
<div><strong>Created:</strong> {new Date(job.createdAt).toLocaleString()}</div>
<div><strong>Updated:</strong> {new Date(job.updatedAt).toLocaleString()}</div>
<div><strong>Counts:</strong> Found: {job.counts.found}, Appended: {job.counts.appended}, Deduped: {job.counts.deduped}, Errors: {job.counts.errors}</div>
</div>
</div>

{job.sheetUrl && (
<div className="mb-6">
<a
href={job.sheetUrl}
target="_blank"
rel="noopener noreferrer"
className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
>
Open Google Sheet
</a>
</div>
)}

<div className="flex space-x-4 mb-6">
<button
onClick={handleProcessNext}
disabled={processLoading || job.status === 'done' || job.status === 'canceled' || job.status === 'error'}
className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
>
{processLoading ? 'Processing...' : 'Process Next Batch'}
</button>

<button
onClick={handleCancelJob}
disabled={job.status === 'done' || job.status === 'canceled'}
className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
>
Cancel Job
</button>
</div>

{prospects.length > 0 && (
<div className="mb-6">
<h3 className="text-lg font-medium mb-2">Sample Prospects</h3>
<div className="overflow-x-auto">
<table className="min-w-full divide-y divide-gray-200">
<thead className="bg-gray-50">
<tr>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Website</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
</tr>
</thead>
<tbody className="bg-white divide-y divide-gray-200">
{prospects.map((prospect, index) => (
<tr key={index}>
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{prospect.name}</td>
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prospect.phone}</td>
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prospect.address}</td>
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
{prospect.website ? <a href={prospect.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Link</a> : '-'}
</td>
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prospect.email || '-'}</td>
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prospect.rating ? `${prospect.rating}/5 (${prospect.user_ratings_total || 0} reviews)` : '-'}</td>
</tr>
))}
</tbody>
</table>
</div>
</div>
)}
</div>
)
}
