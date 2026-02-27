import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2).max(100).trim(),
  description: z.string().max(500).trim().optional(),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  description: z.string().max(500).trim().optional(),
  isActive: z.boolean().optional(),
});

export const categoryIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid category ID format').transform(Number),
});
