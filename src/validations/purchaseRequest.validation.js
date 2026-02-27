import { z } from 'zod';

const itemSchema = z.object({
  product_id: z.number().int().positive(),
  product_name: z.string().min(1).max(255),
  quantity: z.number().int().positive(),
  unit_price: z.number().positive(),
  total_price: z.number().positive(),
});

export const createPurchaseRequestSchema = z.object({
  items: z.array(itemSchema).min(1, 'At least one item is required'),
  notes: z.string().max(1000).trim().optional(),
});

export const updatePurchaseRequestSchema = z.object({
  items: z.array(itemSchema).min(1, 'At least one item is required').optional(),
  notes: z.string().max(1000).trim().optional(),
});

export const purchaseRequestIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid purchase request ID format').transform(Number),
});

export const purchaseRequestQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled']).optional(),
  requester_id: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const approvePurchaseRequestSchema = z.object({
  notes: z.string().max(500).trim().optional(),
});

export const rejectPurchaseRequestSchema = z.object({
  rejection_reason: z.string().min(5).max(500).trim(),
});
