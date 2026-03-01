import {
  pgTable,
  serial,
  timestamp,
  varchar,
  text,
  numeric,
  integer,
  jsonb,
} from 'drizzle-orm/pg-core';
import { users } from './user.model.js';

export const purchaseRequests = pgTable('purchase_requests', {
  id: serial('id').primaryKey(),
  requester_id: integer('requester_id')
    .notNull()
    .references(() => users.id),
  items: jsonb('items').notNull(),
  total_cost: numeric('total_cost', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  notes: text('notes'),
  approved_by: integer('approved_by').references(() => users.id),
  approved_at: timestamp('approved_at'),
  rejection_reason: text('rejection_reason'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});
