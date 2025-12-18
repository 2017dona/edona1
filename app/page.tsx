import Dashboard from '@/components/Dashboard';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <header className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Task Management Dashboard</h1>
        <p className="text-sm text-slate-600">
          Create tasks, store metadata, and generate email drafts. (AI agents can
          integrate via an API endpoint.)
        </p>
      </header>
      <Dashboard />
    </main>
  );
}
