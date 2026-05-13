import { z } from 'zod';

export const listCustomersQuerySchema = z.object({
  search: z.string().optional(),
  cursor: z.string().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
