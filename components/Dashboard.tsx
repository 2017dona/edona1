'use client';

import { useEffect, useMemo, useState } from 'react';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

type EmailDraft = {
  id: string;
  taskId: string;
  to: string;
  cc?: string | null;
  subject: string;
  body: string;
  createdAt: string;
};

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: number;
  tags: string[];
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  emailDrafts?: EmailDraft[];
};

async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {})
    }
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return (await res.json()) as T;
}

function mailtoHref(draft: EmailDraft) {
  const params = new URLSearchParams();
  if (draft.cc) params.set('cc', draft.cc);
  params.set('subject', draft.subject);
  params.set('body', draft.body);
  return `mailto:${encodeURIComponent(draft.to)}?${params.toString()}`;
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(3);
  const [tagsText, setTagsText] = useState('');

  const [emailTo, setEmailTo] = useState('');
  const [emailCc, setEmailCc] = useState('');
  const [emailTone, setEmailTone] = useState<'neutral' | 'friendly' | 'direct'>(
    'neutral'
  );

  const selected = useMemo(
    () => tasks.find((t) => t.id === selectedId) ?? null,
    [tasks, selectedId]
  );

  async function loadTasks() {
    setError(null);
    setLoading(true);
    try {
      const data = await api<Task[]>('/api/tasks', { method: 'GET' });
      setTasks(data);
      if (!selectedId && data[0]) setSelectedId(data[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }

  async function loadSelectedTask(taskId: string) {
    setError(null);
    try {
      const data = await api<Task>(`/api/tasks/${taskId}`, { method: 'GET' });
      setSelectedTask(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load task details');
    }
  }

  useEffect(() => {
    void loadTasks();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSelectedTask(null);
      return;
    }
    void loadSelectedTask(selectedId);
  }, [selectedId]);

  async function onCreateTask(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const created = await api<Task>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description: description || undefined,
          priority,
          tags,
          metadata: {}
        })
      });

      setTitle('');
      setDescription('');
      setPriority(3);
      setTagsText('');

      setTasks((prev) => [created, ...prev]);
      setSelectedId(created.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create task');
    }
  }

  async function onUpdateStatus(taskId: string, status: TaskStatus) {
    setError(null);
    try {
      const updated = await api<Task>(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });

      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      if (selectedId === taskId) await loadSelectedTask(taskId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update status');
    }
  }

  async function onDelete(taskId: string) {
    setError(null);
    try {
      await api<{ ok: true }>(`/api/tasks/${taskId}`, { method: 'DELETE' });
      setTasks((prev) => {
        const nextTasks = prev.filter((t) => t.id !== taskId);
        if (selectedId === taskId) setSelectedId(nextTasks[0]?.id ?? null);
        return nextTasks;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete task');
    }
  }

  async function onGenerateDraft() {
    if (!selectedId) return;
    setError(null);

    try {
      const res = await api<{ task?: Task }>(
        `/api/tasks/${selectedId}/email-drafts`,
        {
          method: 'POST',
          body: JSON.stringify({
            to: emailTo,
            cc: emailCc || undefined,
            tone: emailTone
          })
        }
      );

      if (res.task) setSelectedTask(res.task);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create email draft');
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[360px_1fr]">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          Create task
        </h2>
        <form onSubmit={onCreateTask} className="flex flex-col gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Title
            </span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Follow up with vendor"
              required
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Description
            </span>
            <textarea
              className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details..."
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Priority (1-5)
              </span>
              <input
                type="number"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                min={1}
                max={5}
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Tags (comma)
              </span>
              <input
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="sales, urgent"
              />
            </label>
          </div>

          <button
            type="submit"
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
          >
            Add task
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Tasks</h2>
          <button
            className="text-xs font-medium text-slate-700 underline"
            type="button"
            onClick={() => void loadTasks()}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="mt-3 text-sm text-slate-600">Loading…</p>
        ) : null}

        <div className="mt-3 flex flex-col gap-2">
          {tasks.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedId(t.id)}
              className={`rounded-md border px-3 py-2 text-left text-sm ${
                selectedId === t.id
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{t.title}</span>
                <span className="text-xs text-slate-500">P{t.priority}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-slate-600">{t.status}</span>
                <span className="text-xs text-slate-500">
                  {t.tags.length ? t.tags.join(', ') : ''}
                </span>
              </div>
            </button>
          ))}

          {!tasks.length && !loading ? (
            <p className="text-sm text-slate-600">No tasks yet.</p>
          ) : null}
        </div>

        {error ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">
              {selectedTask?.title ?? selected?.title ?? 'Select a task'}
            </h2>
            <p className="text-sm text-slate-600">
              {selectedTask?.description ?? selected?.description ?? ''}
            </p>
          </div>
          {selectedId ? (
            <button
              type="button"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              onClick={() => void onDelete(selectedId)}
            >
              Delete
            </button>
          ) : null}
        </div>

        {selectedId ? (
          <div className="mb-6 flex flex-wrap gap-2">
            {(['TODO', 'IN_PROGRESS', 'DONE'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void onUpdateStatus(selectedId, s)}
                className={`rounded-md px-3 py-2 text-sm ${
                  (selectedTask?.status ?? selected?.status) === s
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-300 bg-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}

        {selectedId ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-md border border-slate-200 p-3">
              <h3 className="text-sm font-semibold text-slate-700">
                Email drafts
              </h3>

              <div className="mt-3 grid grid-cols-1 gap-3">
                <label className="text-sm">
                  <span className="mb-1 block text-xs font-medium text-slate-600">
                    To
                  </span>
                  <input
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="name@company.com"
                  />
                </label>

                <label className="text-sm">
                  <span className="mb-1 block text-xs font-medium text-slate-600">
                    CC
                  </span>
                  <input
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    value={emailCc}
                    onChange={(e) => setEmailCc(e.target.value)}
                    placeholder="optional"
                  />
                </label>

                <label className="text-sm">
                  <span className="mb-1 block text-xs font-medium text-slate-600">
                    Tone
                  </span>
                  <select
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    value={emailTone}
                    onChange={(e) =>
                      setEmailTone(e.target.value as typeof emailTone)
                    }
                  >
                    <option value="neutral">Neutral</option>
                    <option value="friendly">Friendly</option>
                    <option value="direct">Direct</option>
                  </select>
                </label>

                <button
                  type="button"
                  className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                  onClick={() => void onGenerateDraft()}
                  disabled={!emailTo.trim()}
                >
                  Generate draft
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {(selectedTask?.emailDrafts ?? []).map((d) => (
                  <div
                    key={d.id}
                    className="rounded-md border border-slate-200 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-slate-700">
                          To: {d.to}
                        </p>
                        <p className="truncate text-xs text-slate-600">
                          {d.subject}
                        </p>
                      </div>
                      <a
                        className="text-xs font-medium text-slate-700 underline"
                        href={mailtoHref(d)}
                      >
                        Open
                      </a>
                    </div>
                    <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-slate-50 p-2 text-xs text-slate-800">
                      {d.body}
                    </pre>
                  </div>
                ))}

                {!selectedTask?.emailDrafts?.length ? (
                  <p className="text-sm text-slate-600">
                    No drafts yet for this task.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="rounded-md border border-slate-200 p-3">
              <h3 className="text-sm font-semibold text-slate-700">
                Agent integration (placeholder)
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Future AI call agents can create/update tasks by POSTing to{' '}
                <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
                  /api/agent/task
                </code>{' '}
                with a stable <code className="text-xs">source</code> +{' '}
                <code className="text-xs">externalId</code>.
              </p>
              <pre className="mt-3 overflow-auto rounded bg-slate-50 p-3 text-xs text-slate-800">
{`{
  "source": "my-agent",
  "externalId": "call_123",
  "title": "Call with Acme",
  "description": "Notes from the call...",
  "status": "TODO",
  "priority": 3,
  "tags": ["sales"],
  "metadata": {"callId": "call_123", "contact": "Jane"}
}`}
              </pre>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            Select a task on the left to view details and drafts.
          </p>
        )}
      </section>
    </div>
  );
}
