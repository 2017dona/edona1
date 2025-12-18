import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';

function asObject(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function asString(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}

export async function GET() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: 'asc' }
  });

  // Counts by status
  const grouped = await prisma.task.groupBy({
    by: ['customerId', 'status'],
    _count: { _all: true },
    where: { customerId: { not: null } }
  });

  const counts = new Map<
    string,
    { total: number; todo: number; inProgress: number; done: number }
  >();

  for (const row of grouped) {
    const id = row.customerId as string;
    const c = counts.get(id) ?? { total: 0, todo: 0, inProgress: 0, done: 0 };
    const n = row._count._all;
    c.total += n;
    if (row.status === 'TODO') c.todo += n;
    if (row.status === 'IN_PROGRESS') c.inProgress += n;
    if (row.status === 'DONE') c.done += n;
    counts.set(id, c);
  }

  return NextResponse.json(
    customers.map((c) => ({
      id: c.id,
      name: c.name,
      notes: c.notes,
      metadata: c.metadata,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      taskCounts: counts.get(c.id) ?? { total: 0, todo: 0, inProgress: 0, done: 0 }
    }))
  );
}

export async function POST(req: Request) {
  const body: unknown = await req.json().catch(() => ({}));
  const obj = asObject(body) ?? {};

  const name = (asString(obj.name) ?? '').trim();
  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const notes = asString(obj.notes);
  const metadata = obj.metadata;

  const created = await prisma.customer.create({
    data: {
      name,
      notes: notes ?? undefined,
      metadata: metadata as Prisma.InputJsonValue
    }
  });

  return NextResponse.json(created, { status: 201 });
}
