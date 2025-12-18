import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';
import { serializeTask, tagsToJson } from '@/lib/task-serialization';
import { UpdateTaskSchema } from '@/lib/validators';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const task = await prisma.task.findUnique({
    where: { id },
    include: { emailDrafts: { orderBy: { createdAt: 'desc' } } }
  });

  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(serializeTask(task));
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = UpdateTaskSchema.parse(body);

  const data: Parameters<typeof prisma.task.update>[0]['data'] = {};
  if (typeof parsed.title === 'string') data.title = parsed.title;
  if (parsed.description !== undefined)
    data.description = parsed.description === null ? null : parsed.description;
  if (parsed.status) data.status = parsed.status;
  if (typeof parsed.priority === 'number') data.priority = parsed.priority;
  if (parsed.tags) data.tagsJson = tagsToJson(parsed.tags);
  if (parsed.metadata !== undefined)
    data.metadata = parsed.metadata as Prisma.InputJsonValue;

  const updated = await prisma.task.update({
    where: { id },
    data
  });

  return NextResponse.json(serializeTask(updated));
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
