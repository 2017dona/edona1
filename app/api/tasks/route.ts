import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';
import { serializeTask, tagsToJson } from '@/lib/task-serialization';
import { CreateTaskSchema } from '@/lib/validators';

export async function GET() {
  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(tasks.map((t) => serializeTask(t)));
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = CreateTaskSchema.parse(body);

  const data: Parameters<typeof prisma.task.create>[0]['data'] = {
    title: parsed.title,
    description: parsed.description ?? undefined,
    customer: parsed.customer ?? undefined,
    taskType: parsed.taskType ?? undefined,
    tagsJson: tagsToJson(parsed.tags),
    metadata: parsed.metadata as Prisma.InputJsonValue
  };

  if (parsed.status) data.status = parsed.status;
  if (typeof parsed.priority === 'number') data.priority = parsed.priority;

  const created = await prisma.task.create({
    data
  });

  return NextResponse.json(serializeTask(created), { status: 201 });
}
