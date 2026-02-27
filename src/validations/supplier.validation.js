import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z.string().min(2).max(255).trim(),
  email: z.string().email().max(255).toLowerCase().trim(),
  phone: z.string().max(50).trim().optional(),
  address: z.string().max(1000).trim().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
});

export const updateSupplierSchema = z.object({
  name: z.string().min(2).max(255).trim().optional(),
  email: z.string().email().max(255).toLowerCase().trim().optional(),
  phone: z.string().max(50).trim().optional(),
  address: z.string().max(1000).trim().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

export const supplierIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid supplier ID format').transform(Number),
});
