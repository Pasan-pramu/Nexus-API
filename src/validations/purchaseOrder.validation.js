import { z } from 'zod';

const itemSchema = z.object({
  product_id: z.number().int().positive(),
  product_name: z.string().min(1).max(255),
  quantity: z.number().int().positive(),
  unit_price: z.number().positive(),
  total_price: z.number().positive(),
});

export const createPurchaseOrderSchema = z.object({
  supplier_id: z.number().int().positive(),
  pr_id: z.number().int().positive(),
  items: z.array(itemSchema).min(1, 'At least one item is required'),
  notes: z.string().max(1000).trim().optional(),
});

export const updatePurchaseOrderSchema = z.object({
  supplier_id: z.number().int().positive().optional(),
  items: z.array(itemSchema).min(1, 'At least one item is required').optional(),
  notes: z.string().max(1000).trim().optional(),
});

export const purchaseOrderIdSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'Invalid purchase order ID format')
    .transform(Number),
});

export const purchaseOrderQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'received', 'cancelled']).optional(),
  supplier_id: z.string().regex(/^\d+$/).transform(Number).optional(),
  pr_id: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const markAsReceivedSchema = z.object({
  notes: z.string().max(500).trim().optional(),
});

export const cancelPurchaseOrderSchema = z.object({
  cancellation_reason: z.string().min(5).max(500).trim(),
});
