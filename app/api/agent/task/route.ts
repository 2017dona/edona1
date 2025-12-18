import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';
import { upsertCustomerByName } from '@/lib/customer-utils';
import { serializeTask, tagsToJson } from '@/lib/task-serialization';
import { AgentUpsertTaskSchema } from '@/lib/validators';

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = AgentUpsertTaskSchema.parse(body);

  const customerId =
    parsed.customerId ??
    (parsed.customer ? (await upsertCustomerByName(parsed.customer))?.id : null);

  const task = await prisma.task.upsert({
    where: {
      externalSource_externalId: {
        externalSource: parsed.source,
        externalId: parsed.externalId
      }
    },
    create: {
      externalSource: parsed.source,
      externalId: parsed.externalId,
      title: parsed.title,
      description: parsed.description ?? undefined,
      customerId: customerId ?? undefined,
      customer: parsed.customer ?? undefined,
      taskType: parsed.taskType ?? undefined,
      status: parsed.status,
      priority: parsed.priority,
      tagsJson: tagsToJson(parsed.tags),
      metadata: parsed.metadata as Prisma.InputJsonValue
    },
    update: {
      title: parsed.title,
      description: parsed.description ?? undefined,
      customerId: customerId ?? undefined,
      customer: parsed.customer ?? undefined,
      taskType: parsed.taskType ?? undefined,
      status: parsed.status,
      priority: parsed.priority,
      tagsJson: parsed.tags ? tagsToJson(parsed.tags) : undefined,
      metadata: parsed.metadata as Prisma.InputJsonValue
    }
    ,
    include: { customerEntity: true }
  });

  return NextResponse.json(serializeTask(task));
}
