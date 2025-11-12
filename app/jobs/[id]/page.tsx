'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import JobStatus from '@/components/JobStatus'

export default function JobPage() {
const { id } = useParams()
const [jobId, setJobId] = useState<string>('')

useEffect(() => {
if (id) {
setJobId(Array.isArray(id) ? id[0] : id)
}
}, [id])

if (!jobId) {
return <div>Loading...</div>
}

return (
<div className="min-h-screen bg-gray-50 py-12">
<div className="max-w-4xl mx-auto px-4">
<h1 className="text-3xl font-bold text-center mb-8">Job Status: {jobId}</h1>

<div className="bg-white rounded-lg shadow-md p-6">
<JobStatus jobId={jobId} />
</div>
</div>
</div>
)
}
