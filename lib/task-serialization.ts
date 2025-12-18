import type { EmailDraft, Task } from '@prisma/client';

export type TaskWithDrafts = Task & { emailDrafts?: EmailDraft[] };

function safeParseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((t) => typeof t === 'string') : [];
  } catch {
    return [];
  }
}

export function serializeTask(task: TaskWithDrafts) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    tags: safeParseJsonArray(task.tagsJson),
    metadata: task.metadata,
    externalSource: task.externalSource,
    externalId: task.externalId,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    emailDrafts: task.emailDrafts
      ? task.emailDrafts.map((d) => ({
          id: d.id,
          taskId: d.taskId,
          to: d.to,
          cc: d.cc,
          subject: d.subject,
          body: d.body,
          createdAt: d.createdAt
        }))
      : undefined
  };
}

export function tagsToJson(tags: string[] | undefined) {
  return JSON.stringify((tags ?? []).map((t) => t.trim()).filter(Boolean));
}
