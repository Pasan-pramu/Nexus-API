import { pgTable, serial, timestamp, integer } from 'drizzle-orm/pg-core';
import { products } from './product.model.js';

export const inventory = pgTable('inventory', {
  id: serial('id').primaryKey(),
  product_id: integer('product_id')
    .notNull()
    .references(() => products.id)
    .unique(),
  quantity: integer('quantity').notNull().default(0),
  min_threshold: integer('min_threshold').notNull().default(10),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});
