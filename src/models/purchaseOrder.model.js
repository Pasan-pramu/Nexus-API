import { pgTable, serial, timestamp, varchar, text, numeric, integer, jsonb } from 'drizzle-orm/pg-core';
import { suppliers } from './supplier.model.js';
import { purchaseRequests } from './purchaseRequest.model.js';
import { users } from './user.model.js';

export const purchaseOrders = pgTable('purchase_orders', {
  id: serial('id').primaryKey(),
  supplier_id: integer('supplier_id').notNull().references(() => suppliers.id),
  pr_id: integer('pr_id').notNull().references(() => purchaseRequests.id),
  items: jsonb('items').notNull(),
  total_amount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  notes: text('notes'),
  created_by: integer('created_by').notNull().references(() => users.id),
  received_at: timestamp('received_at'),
  received_by: integer('received_by').references(() => users.id),
  cancelled_by: integer('cancelled_by').references(() => users.id),
  cancelled_at: timestamp('cancelled_at'),
  cancellation_reason: text('cancellation_reason'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});
