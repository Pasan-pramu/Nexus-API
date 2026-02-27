import { z } from 'zod';

export const inventoryIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid inventory ID format').transform(Number),
});

export const inventoryQuerySchema = z.object({
  product_id: z.string().regex(/^\d+$/).transform(Number).optional(),
  low_stock: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
});

export const stockAdjustmentSchema = z.object({
  product_id: z.number().int().positive(),
  quantity: z.number().int(),
  reason: z.string().min(5).max(500).trim(),
});

export const updateThresholdSchema = z.object({
  min_threshold: z.number().int().nonnegative(),
});
