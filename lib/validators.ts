import { z } from 'zod';

export const TaskStatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'DONE']);

const CustomerSchema = z.string().min(1).max(200);
const TaskTypeSchema = z.string().min(1).max(120);

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(10000).optional().nullable(),
  customer: CustomerSchema.optional().nullable(),
  taskType: TaskTypeSchema.optional().nullable(),
  status: TaskStatusSchema.optional(),
  priority: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.string().min(1).max(50)).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const UpdateTaskSchema = CreateTaskSchema.partial();

export const CreateEmailDraftSchema = z.object({
  to: z.string().min(1).max(320),
  cc: z.string().max(320).optional().nullable(),
  tone: z.enum(['neutral', 'friendly', 'direct']).optional()
});

export const AgentUpsertTaskSchema = z.object({
  source: z.string().min(1).max(100),
  externalId: z.string().min(1).max(200),
  title: z.string().min(1).max(200),
  description: z.string().max(10000).optional().nullable(),
  customer: CustomerSchema.optional().nullable(),
  taskType: TaskTypeSchema.optional().nullable(),
  status: TaskStatusSchema.optional(),
  priority: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.string().min(1).max(50)).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});
