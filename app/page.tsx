import JobForm from '@/components/JobForm'
import JobList from '@/components/JobList'

export default function Home() {
return (
<div className="min-h-screen bg-gray-50 py-12">
<div className="max-w-4xl mx-auto px-4">
<h1 className="text-3xl font-bold text-center mb-8">Prospector-api - Business Data Enrichment</h1>

<div className="bg-white rounded-lg shadow-md p-6 mb-8">
<JobForm />
</div>

<div className="bg-white rounded-lg shadow-md p-6">
<h2 className="text-xl font-semibold mb-4">Recent Jobs</h2>
<JobList />
</div>
</div>
</div>
)
}
