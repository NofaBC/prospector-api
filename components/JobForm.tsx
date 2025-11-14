'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function JobForm() {
const router = useRouter()

const [formData, setFormData] = useState({
seedUrl: '',
area: '',
keywordOverride: '',
radius: 16000,
maxResults: 100,
webhookUrl: ''
})

const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault()
setLoading(true)
setError(null)

try {
const response = await fetch('/api/run', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(formData)
})

if (!response.ok) {
const errorData = await response.json()
throw new Error(errorData.error || 'Failed to start job')
}

const result = await response.json()
router.push(`/jobs/${result.jobId}`)
} catch (err) {
setError(err instanceof Error ? err.message : 'An unknown error occurred')
} finally {
setLoading(false)
}
}

return (
<form onSubmit={handleSubmit} className="space-y-4">
<div>
<label className="block text-sm font-medium text-gray-700 mb-1">
Seed URL (e.g., https://example.com/services/dentist )
</label>
<input
type="url"
required
value={formData.seedUrl}
onChange={(e) => setFormData({...formData, seedUrl: e.target.value})}
className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
placeholder="https://example.com/services/dentist "
/>
</div>

<div>
<label className="block text-sm font-medium text-gray-700 mb-1">
Area/ZIP Code
</label>
<input
type="text"
required
value={formData.area}
onChange={(e) => setFormData({...formData, area: e.target.value})}
className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
placeholder="21108 or City, State"
/>
</div>

<div>
<label className="block text-sm font-medium text-gray-700 mb-1">
Keyword Override (optional)
</label>
<input
type="text"
value={formData.keywordOverride}
onChange={(e) => setFormData({...formData, keywordOverride: e.target.value})}
className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
placeholder="dentist"
/>
</div>

<div className="grid grid-cols-2 gap-4">
<div>
<label className="block text-sm font-medium text-gray-700 mb-1">
Radius (meters, default 16000)
</label>
<input
type="number"
value={formData.radius}
onChange={(e) => setFormData({...formData, radius: Number(e.target.value)})}
className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
/>
</div>

<div>
<label className="block text-sm font-medium text-gray-700 mb-1">
Max Results (default 100, max 300)
</label>
<input
type="number"
value={formData.maxResults}
onChange={(e) => setFormData({...formData, maxResults: Number(e.target.value)})}
className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
/>
</div>
</div>

<div>
<label className="block text-sm font-medium text-gray-700 mb-1">
Webhook URL (optional)
</label>
<input
type="url"
value={formData.webhookUrl}
onChange={(e) => setFormData({...formData, webhookUrl: e.target.value})}
className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
placeholder="https://your-webhook.com/endpoint"
/>
</div>

<button
type="submit"
disabled={loading}
className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
>
{loading ? 'Starting Job...' : 'Start Job'}
</button>

{error && <div className="text-red-600 text-sm mt-2">{error}</div>}
</form>
)
}
