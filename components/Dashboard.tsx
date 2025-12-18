'use client';

import { useEffect, useMemo, useState } from 'react';

import { Icon } from '@/components/ui/Icon';

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
  customer?: string | null;
  taskType?: string | null;
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

  const [createOpen, setCreateOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | TaskStatus>('ALL');
  const [filterCustomer, setFilterCustomer] = useState<string>('ALL');
  const [filterTaskType, setFilterTaskType] = useState<string>('ALL');
  const [groupBy, setGroupBy] = useState<'customer' | 'taskType' | 'none'>(
    'customer'
  );

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [customer, setCustomer] = useState('');
  const [taskType, setTaskType] = useState('');
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

  const customers = useMemo(() => {
    const s = new Set<string>();
    for (const t of tasks) if (t.customer) s.add(t.customer);
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  const taskTypes = useMemo(() => {
    const s = new Set<string>();
    for (const t of tasks) if (t.taskType) s.add(t.taskType);
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks
      .filter((t) => {
        if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
        if (filterCustomer !== 'ALL' && (t.customer ?? '') !== filterCustomer)
          return false;
        if (filterTaskType !== 'ALL' && (t.taskType ?? '') !== filterTaskType)
          return false;
        if (!q) return true;
        const hay = [
          t.title,
          t.description ?? '',
          t.customer ?? '',
          t.taskType ?? '',
          ...(t.tags ?? [])
        ]
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [tasks, search, filterStatus, filterCustomer, filterTaskType]);

  const groupedTasks = useMemo(() => {
    const groups = new Map<string, Task[]>();
    const keyOf = (t: Task) => {
      if (groupBy === 'customer') return t.customer ?? 'Unassigned';
      if (groupBy === 'taskType') return t.taskType ?? 'Unassigned';
      return 'All Tasks';
    };
    for (const t of filteredTasks) {
      const k = keyOf(t);
      groups.set(k, [...(groups.get(k) ?? []), t]);
    }
    const keys = Array.from(groups.keys()).sort((a, b) => {
      if (a === 'Unassigned') return 1;
      if (b === 'Unassigned') return -1;
      return a.localeCompare(b);
    });
    return keys.map((k) => ({ key: k, tasks: groups.get(k) ?? [] }));
  }, [filteredTasks, groupBy]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === 'TODO').length;
    const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const completed = tasks.filter((t) => t.status === 'DONE').length;
    return { total, pending, inProgress, completed };
  }, [tasks]);

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
          customer: customer || undefined,
          taskType: taskType || undefined,
          priority,
          tags,
          metadata: {}
        })
      });

      setTitle('');
      setDescription('');
      setCustomer('');
      setTaskType('');
      setPriority(3);
      setTagsText('');
      setCreateOpen(false);

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

  function StatusPill({ status }: { status: TaskStatus }) {
    const cls =
      status === 'DONE'
        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
        : status === 'IN_PROGRESS'
          ? 'bg-sky-50 text-sky-700 ring-sky-200'
          : 'bg-amber-50 text-amber-700 ring-amber-200';
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${cls}`}
      >
        {status === 'IN_PROGRESS' ? 'In Progress' : status === 'TODO' ? 'Pending' : 'Completed'}
      </span>
    );
  }

  function PriorityPill({ priority: p }: { priority: number }) {
    const cls =
      p >= 5
        ? 'bg-rose-50 text-rose-700 ring-rose-200'
        : p >= 4
          ? 'bg-orange-50 text-orange-700 ring-orange-200'
          : 'bg-slate-100 text-slate-700 ring-slate-200';
    const label = p >= 5 ? 'Critical' : p >= 4 ? 'High' : p === 3 ? 'Medium' : 'Low';
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${cls}`}
      >
        {label}
      </span>
    );
  }

  function Select({
    value,
    onChange,
    options
  }: {
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
  }) {
    return (
      <div className="relative">
        <select
          className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 pr-9 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Icon
          name="chevronDown"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-600">
            Manage your tasks and AI call agents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            <Icon name="plus" className="h-4 w-4" /> New Task
          </button>
          <button
            type="button"
            onClick={() => void loadTasks()}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-slate-600">Total Tasks</div>
              <div className="mt-2 text-3xl font-semibold">{stats.total}</div>
              <div className="mt-1 text-xs text-emerald-700">
                +{Math.min(12, stats.total)}% from last week
              </div>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
              <Icon name="check" className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-slate-600">Pending</div>
              <div className="mt-2 text-3xl font-semibold">{stats.pending}</div>
              <div className="mt-1 text-xs text-slate-600">Awaiting action</div>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
              <Icon name="clock" className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-slate-600">In Progress</div>
              <div className="mt-2 text-3xl font-semibold">{stats.inProgress}</div>
              <div className="mt-1 text-xs text-slate-600">Currently active</div>
            </div>
            <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
              <Icon name="spark" className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-slate-600">Completed</div>
              <div className="mt-2 text-3xl font-semibold">{stats.completed}</div>
              <div className="mt-1 text-xs text-slate-600">This week</div>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
              <Icon name="check" className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Icon
                name="search"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks…"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <div className="grid w-full grid-cols-2 gap-2 md:flex md:w-auto md:flex-wrap">
              <Select
                value={filterStatus}
                onChange={(v) => setFilterStatus(v as typeof filterStatus)}
                options={[
                  { value: 'ALL', label: 'All Status' },
                  { value: 'TODO', label: 'Pending' },
                  { value: 'IN_PROGRESS', label: 'In Progress' },
                  { value: 'DONE', label: 'Completed' }
                ]}
              />
              <Select
                value={filterCustomer}
                onChange={setFilterCustomer}
                options={[
                  { value: 'ALL', label: 'All Customers' },
                  ...customers.map((c) => ({ value: c, label: c }))
                ]}
              />
              <Select
                value={filterTaskType}
                onChange={setFilterTaskType}
                options={[
                  { value: 'ALL', label: 'All Types' },
                  ...taskTypes.map((t) => ({ value: t, label: t }))
                ]}
              />
              <Select
                value={groupBy}
                onChange={(v) => setGroupBy(v as typeof groupBy)}
                options={[
                  { value: 'customer', label: 'Group: Customer' },
                  { value: 'taskType', label: 'Group: Task Type' },
                  { value: 'none', label: 'Group: None' }
                ]}
              />
            </div>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-slate-600">Loading…</p>
          ) : null}

          <div className="mt-5 space-y-6">
            {!groupedTasks.length && !loading ? (
              <p className="text-sm text-slate-600">No tasks match your filters.</p>
            ) : null}

            {groupedTasks.map((g) => (
              <div key={g.key}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">{g.key}</h3>
                  <span className="text-xs text-slate-500">{g.tasks.length}</span>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {g.tasks.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedId(t.id)}
                      className={`rounded-2xl border p-4 text-left shadow-sm transition ${
                        selectedId === t.id
                          ? 'border-emerald-300 bg-emerald-50/40'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">{t.title}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <StatusPill status={t.status} />
                            <PriorityPill priority={t.priority} />
                          </div>
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {(t.customer || t.taskType) ? (
                        <div className="mt-2 text-xs text-slate-600">
                          {[t.customer, t.taskType].filter(Boolean).join(' • ')}
                        </div>
                      ) : null}

                      {t.description ? (
                        <div className="mt-2 line-clamp-2 text-sm text-slate-600">
                          {t.description}
                        </div>
                      ) : null}

                      {t.tags?.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {t.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                            >
                              {tag}
                            </span>
                          ))}
                          {t.tags.length > 3 ? (
                            <span className="text-xs text-slate-500">
                              +{t.tags.length - 3}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {error ? (
            <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </p>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold">
                  {selectedTask?.title ?? selected?.title ?? 'Select a task'}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedTask?.customer ?? selected?.customer ?? ''}
                  {(selectedTask?.customer ?? selected?.customer) &&
                  (selectedTask?.taskType ?? selected?.taskType)
                    ? ' • '
                    : ''}
                  {selectedTask?.taskType ?? selected?.taskType ?? ''}
                </p>
              </div>

              {selectedId ? (
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => void onDelete(selectedId)}
                >
                  Delete
                </button>
              ) : null}
            </div>

            {selectedId ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {(['TODO', 'IN_PROGRESS', 'DONE'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void onUpdateStatus(selectedId, s)}
                    className={`rounded-xl px-3 py-2 text-sm ${
                      (selectedTask?.status ?? selected?.status) === s
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {s === 'IN_PROGRESS'
                      ? 'In Progress'
                      : s === 'TODO'
                        ? 'Pending'
                        : 'Completed'}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Pick a task to see details and drafts.
              </p>
            )}

            {selectedId && (selectedTask?.description ?? selected?.description) ? (
              <p className="mt-4 text-sm text-slate-700">
                {selectedTask?.description ?? selected?.description}
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800">Email drafts</h3>

            <div className="mt-3 grid grid-cols-1 gap-3">
              <label className="text-sm">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  To
                </span>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
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
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
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
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  value={emailTone}
                  onChange={(e) => setEmailTone(e.target.value as typeof emailTone)}
                >
                  <option value="neutral">Neutral</option>
                  <option value="friendly">Friendly</option>
                  <option value="direct">Direct</option>
                </select>
              </label>

              <button
                type="button"
                className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-950 disabled:opacity-50"
                onClick={() => void onGenerateDraft()}
                disabled={!emailTo.trim() || !selectedId}
              >
                Generate draft
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {(selectedTask?.emailDrafts ?? []).map((d) => (
                <div
                  key={d.id}
                  className="rounded-2xl border border-slate-200 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-slate-700">
                        To: {d.to}
                      </p>
                      <p className="truncate text-xs text-slate-600">{d.subject}</p>
                    </div>
                    <a
                      className="text-xs font-semibold text-emerald-700 underline"
                      href={mailtoHref(d)}
                    >
                      Open
                    </a>
                  </div>
                  <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-2 text-xs text-slate-800">
                    {d.body}
                  </pre>
                </div>
              ))}

              {selectedId && !selectedTask?.emailDrafts?.length ? (
                <p className="text-sm text-slate-600">No drafts yet.</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800">
              Agent integration (placeholder)
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Your future AI call agents can create/update tasks by POSTing to{' '}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
                /api/agent/task
              </code>{' '}
              using a stable <code className="text-xs">source</code> +{' '}
              <code className="text-xs">externalId</code>.
            </p>
          </div>
        </div>
      </div>

      {createOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            onClick={() => setCreateOpen(false)}
            aria-label="Close"
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <div>
                <div className="text-sm font-semibold">New Task</div>
                <div className="text-xs text-slate-500">
                  Add customer + task type for grouping.
                </div>
              </div>
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-700"
                onClick={() => setCreateOpen(false)}
              >
                Close
              </button>
            </div>

            <form onSubmit={onCreateTask} className="flex h-full flex-col gap-3 p-4">
              <label className="text-sm">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  Title
                </span>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Schedule demo call"
                  required
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  Customer
                </span>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="e.g. Acme Corp"
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  Task Type
                </span>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  placeholder="e.g. Follow-up, Onboarding, Support"
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  Description
                </span>
                <textarea
                  className="min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional details…"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  <span className="mb-1 block text-xs font-medium text-slate-600">
                    Priority (1–5)
                  </span>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
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
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    value={tagsText}
                    onChange={(e) => setTagsText(e.target.value)}
                    placeholder="sales, urgent"
                  />
                </label>
              </div>

              <div className="mt-auto border-t border-slate-200 pt-4">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                >
                  Create task
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
