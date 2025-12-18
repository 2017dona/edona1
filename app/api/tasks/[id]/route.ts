import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';
import { upsertCustomerByName } from '@/lib/customer-utils';
import { serializeTask, tagsToJson } from '@/lib/task-serialization';
import { UpdateTaskSchema } from '@/lib/validators';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      customerEntity: true,
      emailDrafts: { orderBy: { createdAt: 'desc' } }
    }
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
  if (parsed.customerId !== undefined)
    data.customerId = parsed.customerId === null ? null : parsed.customerId;
  if (parsed.customer !== undefined)
    data.customer = parsed.customer === null ? null : parsed.customer;
  if (parsed.taskType !== undefined)
    data.taskType = parsed.taskType === null ? null : parsed.taskType;
  if (parsed.status) data.status = parsed.status;
  if (typeof parsed.priority === 'number') data.priority = parsed.priority;
  if (parsed.tags) data.tagsJson = tagsToJson(parsed.tags);
  if (parsed.metadata !== undefined)
    data.metadata = parsed.metadata as Prisma.InputJsonValue;

  if (
    data.customerId === undefined &&
    typeof parsed.customer === 'string' &&
    parsed.customer.trim()
  ) {
    const c = await upsertCustomerByName(parsed.customer);
    if (c) data.customerId = c.id;
  }

  const updated = await prisma.task.update({
    where: { id },
    data,
    include: { customerEntity: true }
  });

  return NextResponse.json(serializeTask(updated));
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
