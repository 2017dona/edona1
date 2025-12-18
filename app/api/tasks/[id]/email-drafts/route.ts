import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { serializeTask } from '@/lib/task-serialization';
import { CreateEmailDraftSchema } from '@/lib/validators';

type Ctx = { params: Promise<{ id: string }> };

function buildDraft({
  taskTitle,
  taskDescription,
  customer,
  taskType,
  tone
}: {
  taskTitle: string;
  taskDescription?: string | null;
  customer?: string | null;
  taskType?: string | null;
  tone: 'neutral' | 'friendly' | 'direct';
}) {
  const subjectParts = [customer ? `${customer}` : null, taskTitle].filter(Boolean);
  const subject = `Update: ${subjectParts.join(' — ')}`;

  const opener =
    tone === 'friendly'
      ? 'Hi there,'
      : tone === 'direct'
        ? 'Hello,'
        : 'Hello,';

  const closing =
    tone === 'friendly'
      ? 'Thanks!'
      : tone === 'direct'
        ? 'Regards,'
        : 'Thanks,';

  const bodyLines = [
    opener,
    '',
    `I wanted to share an update on: ${taskTitle}.`,
    customer ? `Customer: ${customer}` : undefined,
    taskType ? `Task type: ${taskType}` : undefined,
    taskDescription ? `\nContext:\n${taskDescription}` : undefined,
    '\nNext steps:',
    '- (fill in)\n',
    closing,
    '(your name)'
  ].filter(Boolean);

  return {
    subject,
    body: bodyLines.join('\n')
  };
}

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const drafts = await prisma.emailDraft.findMany({
    where: { taskId: id },
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json(drafts);
}

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = CreateEmailDraftSchema.parse(body);

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const draft = buildDraft({
    taskTitle: task.title,
    taskDescription: task.description,
    customer: task.customer,
    taskType: task.taskType,
    tone: parsed.tone ?? 'neutral'
  });

  const created = await prisma.emailDraft.create({
    data: {
      taskId: task.id,
      to: parsed.to,
      cc: parsed.cc ?? undefined,
      subject: draft.subject,
      body: draft.body
    }
  });

  const refreshed = await prisma.task.findUnique({
    where: { id },
    include: { emailDrafts: { orderBy: { createdAt: 'desc' } } }
  });

  return NextResponse.json({
    emailDraft: created,
    task: refreshed ? serializeTask(refreshed) : undefined
  });
}
