import { prisma } from '@/lib/db';

export function normalizeCustomerName(name: string) {
  return name.trim().replace(/\s+/g, ' ');
}

export async function upsertCustomerByName(name: string) {
  const normalized = normalizeCustomerName(name);
  if (!normalized) return null;

  return prisma.customer.upsert({
    where: { name: normalized },
    create: { name: normalized },
    update: {}
  });
}
