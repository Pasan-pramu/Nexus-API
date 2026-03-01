import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2).max(255).trim(),
  description: z.string().max(1000).trim().optional(),
  category: z.string().min(2).max(100).trim(),
  price: z
    .number()
    .positive()
    .or(
      z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/)
        .transform(Number)
    ),
  status: z.enum(['active', 'inactive', 'out_of_stock']).default('active'),
  stock: z.number().int().nonnegative().default(0),
});

export const updateProductSchema = z.object({
  name: z.string().min(2).max(255).trim().optional(),
  description: z.string().max(1000).trim().optional(),
  category: z.string().min(2).max(100).trim().optional(),
  price: z
    .number()
    .positive()
    .or(
      z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/)
        .transform(Number)
    )
    .optional(),
  status: z.enum(['active', 'inactive', 'out_of_stock']).optional(),
  stock: z.number().int().nonnegative().optional(),
});

export const productIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid product ID format').transform(Number),
});

export const productQuerySchema = z.object({
  category: z.string().optional(),
  status: z.enum(['active', 'inactive', 'out_of_stock']).optional(),
  search: z.string().optional(),
});
