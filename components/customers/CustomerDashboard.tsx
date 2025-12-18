'use client';

import { useEffect, useMemo, useState } from 'react';

import { Icon } from '@/components/ui/Icon';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

type Customer = {
  id: string;
  name: string;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  taskCounts?: { total: number; todo: number; inProgress: number; done: number };
};

type Task = {
  id: string;
  title: string;
  description?: string | null;
  customerId?: string | null;
  customer?: string | null;
  taskType?: string | null;
  status: TaskStatus;
  priority: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
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

function StatusPill({ status }: { status: TaskStatus }) {
  const cls =
    status === 'DONE'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : status === 'IN_PROGRESS'
        ? 'bg-sky-50 text-sky-700 ring-sky-200'
        : 'bg-amber-50 text-amber-700 ring-amber-200';
  const label =
    status === 'IN_PROGRESS' ? 'In Progress' : status === 'TODO' ? 'Pending' : 'Completed';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${cls}`}>
      {label}
    </span>
  );
}

function PriorityPill({ priority }: { priority: number }) {
  const cls =
    priority >= 5
      ? 'bg-rose-50 text-rose-700 ring-rose-200'
      : priority >= 4
        ? 'bg-orange-50 text-orange-700 ring-orange-200'
        : 'bg-slate-100 text-slate-700 ring-slate-200';
  const label =
    priority >= 5 ? 'Critical' : priority >= 4 ? 'High' : priority === 3 ? 'Medium' : 'Low';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${cls}`}>
      {label}
    </span>
  );
}

function TabButton({
  active,
  label,
  onClick
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-sm font-medium ${
        active
          ? 'bg-emerald-50 text-emerald-700'
          : 'text-slate-700 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );
}

export default function CustomerDashboard() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<'overview' | 'tasks' | 'notes'>('overview');

  // customer search
  const [customerSearch, setCustomerSearch] = useState('');

  // new customer modal
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerNotes, setNewCustomerNotes] = useState('');

  // notes editor
  const [notesDraft, setNotesDraft] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);

  // new task drawer
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskType, setTaskType] = useState('');
  const [taskPriority, setTaskPriority] = useState(3);
  const [taskTagsText, setTaskTagsText] = useState('');

  const visibleCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => c.name.toLowerCase().includes(q));
  }, [customers, customerSearch]);

  const selectedCounts = useMemo(() => {
    const base = selectedCustomer?.taskCounts;
    if (base) return base;
    const total = tasks.length;
    const todo = tasks.filter((t) => t.status === 'TODO').length;
    const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const done = tasks.filter((t) => t.status === 'DONE').length;
    return { total, todo, inProgress, done };
  }, [selectedCustomer, tasks]);

  async function loadCustomers() {
    setError(null);
    setLoadingCustomers(true);
    try {
      const data = await api<Customer[]>('/api/customers');
      setCustomers(data);
      if (!selectedCustomerId && data[0]) setSelectedCustomerId(data[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load customers');
    } finally {
      setLoadingCustomers(false);
    }
  }

  async function loadCustomer(customerId: string) {
    setError(null);
    setLoadingCustomer(true);
    try {
      const [c, t] = await Promise.all([
        api<Customer>(`/api/customers/${customerId}`),
        api<Task[]>(`/api/customers/${customerId}/tasks`)
      ]);
      setSelectedCustomer(c);
      setTasks(t);
      setNotesDraft(c.notes ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load customer');
    } finally {
      setLoadingCustomer(false);
    }
  }

  useEffect(() => {
    void loadCustomers();
  }, []);

  useEffect(() => {
    if (!selectedCustomerId) {
      setSelectedCustomer(null);
      setTasks([]);
      return;
    }
    void loadCustomer(selectedCustomerId);
  }, [selectedCustomerId]);

  async function onCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      const created = await api<Customer>('/api/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: newCustomerName,
          notes: newCustomerNotes || undefined,
          metadata: {}
        })
      });
      setCustomers((prev) => [created, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedCustomerId(created.id);
      setNewCustomerName('');
      setNewCustomerNotes('');
      setNewCustomerOpen(false);
      setTab('overview');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create customer');
    }
  }

  async function onSaveNotes() {
    if (!selectedCustomerId) return;
    setError(null);
    setNotesSaving(true);
    try {
      const updated = await api<Customer>(`/api/customers/${selectedCustomerId}`, {
        method: 'PATCH',
        body: JSON.stringify({ notes: notesDraft })
      });
      setSelectedCustomer(updated);
      setCustomers((prev) => prev.map((c) => (c.id === updated.id ? { ...c, notes: updated.notes } : c)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save notes');
    } finally {
      setNotesSaving(false);
    }
  }

  async function onCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomerId) return;
    setError(null);

    const tags = taskTagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const created = await api<Task>(`/api/customers/${selectedCustomerId}/tasks`, {
        method: 'POST',
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription || undefined,
          taskType: taskType || undefined,
          priority: taskPriority,
          tags,
          metadata: {}
        })
      });

      setTasks((prev) => [created, ...prev]);
      setTaskTitle('');
      setTaskDescription('');
      setTaskType('');
      setTaskPriority(3);
      setTaskTagsText('');
      setNewTaskOpen(false);
      setTab('tasks');

      // refresh customer list counts
      void loadCustomers();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create task');
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
      {/* Customer list */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Customers</div>
            <div className="text-xs text-slate-500">Store notes & tasks per customer</div>
          </div>
          <button
            type="button"
            onClick={() => setNewCustomerOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            <Icon name="plus" className="h-4 w-4" /> Add
          </button>
        </div>

        <div className="mt-3">
          <div className="relative">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            />
            <input
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Search customers…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        </div>

        {loadingCustomers ? <p className="mt-3 text-sm text-slate-600">Loading…</p> : null}

        <div className="mt-3 flex flex-col gap-2">
          {visibleCustomers.map((c) => {
            const active = c.id === selectedCustomerId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedCustomerId(c.id);
                  setTab('overview');
                }}
                className={`rounded-2xl border p-3 text-left shadow-sm ${
                  active
                    ? 'border-emerald-300 bg-emerald-50/40'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{c.name}</div>
                    <div className="mt-1 text-xs text-slate-600">
                      {c.taskCounts ? `${c.taskCounts.total} tasks` : ''}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(c.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </button>
            );
          })}

          {!visibleCustomers.length && !loadingCustomers ? (
            <p className="text-sm text-slate-600">No customers yet.</p>
          ) : null}
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={() => void loadCustomers()}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </section>

      {/* Customer detail */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {selectedCustomer?.name ?? (selectedCustomerId ? 'Loading…' : 'Select a customer')}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {selectedCustomerId
                ? 'Tasks and notes are organized per customer.'
                : 'Create a customer to start capturing tasks and context.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setNewTaskOpen(true)}
              disabled={!selectedCustomerId}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-950 disabled:opacity-50"
            >
              <Icon name="plus" className="h-4 w-4" /> New Task
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="text-xs text-slate-600">Total</div>
            <div className="mt-1 text-2xl font-semibold">{selectedCounts.total}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="text-xs text-slate-600">Pending</div>
            <div className="mt-1 text-2xl font-semibold">{selectedCounts.todo}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="text-xs text-slate-600">In progress</div>
            <div className="mt-1 text-2xl font-semibold">{selectedCounts.inProgress}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="text-xs text-slate-600">Completed</div>
            <div className="mt-1 text-2xl font-semibold">{selectedCounts.done}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <TabButton active={tab === 'overview'} label="Overview" onClick={() => setTab('overview')} />
          <TabButton active={tab === 'tasks'} label="Tasks" onClick={() => setTab('tasks')} />
          <TabButton active={tab === 'notes'} label="Customer Notes" onClick={() => setTab('notes')} />
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        {loadingCustomer ? <p className="mt-4 text-sm text-slate-600">Loading…</p> : null}

        {/* Tab content */}
        {tab === 'overview' ? (
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="text-sm font-semibold">Recent tasks</div>
              <div className="mt-3 flex flex-col gap-2">
                {tasks.slice(0, 6).map((t) => (
                  <div key={t.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{t.title}</div>
                        {t.taskType ? (
                          <div className="mt-1 text-xs text-slate-600">{t.taskType}</div>
                        ) : null}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusPill status={t.status} />
                      <PriorityPill priority={t.priority} />
                    </div>
                  </div>
                ))}
                {!tasks.length ? (
                  <p className="text-sm text-slate-600">No tasks yet for this customer.</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="text-sm font-semibold">Customer context</div>
              <p className="mt-2 text-sm text-slate-600">
                Store call summaries, preferences, key stakeholders, and follow-up plans in the
                Customer Notes tab.
              </p>
              <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                Tip: When you add AI call agents later, have them POST customer notes + tasks to
                these endpoints:
                <div className="mt-2 font-mono">
                  /api/customers<br />
                  /api/customers/:id/tasks
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {tab === 'tasks' ? (
          <div className="mt-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {tasks.map((t) => (
                <div key={t.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{t.title}</div>
                      {t.description ? (
                        <div className="mt-1 line-clamp-2 text-sm text-slate-600">{t.description}</div>
                      ) : null}
                      {t.taskType ? (
                        <div className="mt-2 text-xs text-slate-600">Type: {t.taskType}</div>
                      ) : null}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusPill status={t.status} />
                    <PriorityPill priority={t.priority} />
                    {t.tags?.slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {!tasks.length ? (
              <p className="mt-3 text-sm text-slate-600">No tasks yet for this customer.</p>
            ) : null}
          </div>
        ) : null}

        {tab === 'notes' ? (
          <div className="mt-4">
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">Customer Notes</div>
                  <div className="text-xs text-slate-500">
                    Save important context (call summaries, preferences, key contacts).
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void onSaveNotes()}
                  disabled={!selectedCustomerId || notesSaving}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {notesSaving ? 'Saving…' : 'Save'}
                </button>
              </div>

              <textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Example:\n- Call recap\n- Stakeholders\n- Renewal date\n- Preferred tone for follow-ups\n"
                className="mt-3 min-h-56 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                disabled={!selectedCustomerId}
              />
            </div>
          </div>
        ) : null}
      </section>

      {/* New customer modal */}
      {newCustomerOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            onClick={() => setNewCustomerOpen(false)}
            aria-label="Close"
          />
          <div className="absolute left-1/2 top-1/2 w-[min(560px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-4 shadow-xl">
            <div className="text-sm font-semibold">New Customer</div>
            <div className="mt-1 text-xs text-slate-500">
              Customers hold the tabs. Tasks live under a customer.
            </div>

            <form onSubmit={onCreateCustomer} className="mt-4 flex flex-col gap-3">
              <label className="text-sm">
                <span className="mb-1 block text-xs font-medium text-slate-600">Name</span>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  required
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block text-xs font-medium text-slate-600">Notes (optional)</span>
                <textarea
                  className="min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  value={newCustomerNotes}
                  onChange={(e) => setNewCustomerNotes(e.target.value)}
                  placeholder="High-level context…"
                />
              </label>

              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewCustomerOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* New task drawer */}
      {newTaskOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            onClick={() => setNewTaskOpen(false)}
            aria-label="Close"
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <div>
                <div className="text-sm font-semibold">New Task</div>
                <div className="text-xs text-slate-500">
                  {selectedCustomer?.name ? `Customer: ${selectedCustomer.name}` : 'Select a customer'}
                </div>
              </div>
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-700"
                onClick={() => setNewTaskOpen(false)}
              >
                Close
              </button>
            </div>

            <form onSubmit={onCreateTask} className="flex h-full flex-col gap-3 p-4">
              <label className="text-sm">
                <span className="mb-1 block text-xs font-medium text-slate-600">Title</span>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Follow up with client"
                  required
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block text-xs font-medium text-slate-600">Task type</span>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  placeholder="e.g. Follow-up, Onboarding, Support"
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block text-xs font-medium text-slate-600">Description</span>
                <textarea
                  className="min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Optional details…"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  <span className="mb-1 block text-xs font-medium text-slate-600">Priority (1–5)</span>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(Number(e.target.value))}
                    min={1}
                    max={5}
                  />
                </label>

                <label className="text-sm">
                  <span className="mb-1 block text-xs font-medium text-slate-600">Tags (comma)</span>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    value={taskTagsText}
                    onChange={(e) => setTaskTagsText(e.target.value)}
                    placeholder="urgent, renewal"
                  />
                </label>
              </div>

              <div className="mt-auto border-t border-slate-200 pt-4">
                <button
                  type="submit"
                  disabled={!selectedCustomerId}
                  className="w-full rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
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
