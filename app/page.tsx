// app/page.tsx
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">Prospector API</h1>
      <p className="text-lg">API is running successfully!</p>
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <code>GET /api/endpoint</code> - to access your API endpoints
      </div>
    </main>
  );
}
