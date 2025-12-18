import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

function asObject(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body: unknown = await req.json().catch(() => ({}));
  const obj = asObject(body) ?? {};

  const data: Parameters<typeof prisma.customer.update>[0]['data'] = {};
  if (typeof obj.name === 'string' && obj.name.trim()) data.name = obj.name.trim();
  if (obj.notes !== undefined)
    data.notes = obj.notes === null ? null : String(obj.notes);
  if (obj.metadata !== undefined)
    data.metadata = obj.metadata as Prisma.InputJsonValue;

  const updated = await prisma.customer.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
