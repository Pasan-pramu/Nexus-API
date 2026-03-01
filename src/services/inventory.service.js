import logger from '#config/logger.js';
import { db } from '#config/database.js';
import { inventory } from '#models/inventory.model.js';
import { products } from '#models/product.model.js';
import { eq, and, sql } from 'drizzle-orm';

export const getAllInventory = async (filters = {}) => {
  try {
    const conditions = [];

    if (filters.product_id) {
      conditions.push(eq(inventory.product_id, filters.product_id));
    }

    if (filters.low_stock === true) {
      conditions.push(sql`${inventory.quantity} < ${inventory.min_threshold}`);
    }

    const query = db
      .select({
        id: inventory.id,
        product_id: inventory.product_id,
        product_name: products.name,
        quantity: inventory.quantity,
        min_threshold: inventory.min_threshold,
        is_low_stock:
          sql`CASE WHEN ${inventory.quantity} < ${inventory.min_threshold} THEN true ELSE false END`.as(
            'is_low_stock'
          ),
        created_at: inventory.created_at,
        updated_at: inventory.updated_at,
      })
      .from(inventory)
      .leftJoin(products, eq(inventory.product_id, products.id));

    if (conditions.length > 0) {
      return await query.where(and(...conditions));
    }

    return await query;
  } catch (e) {
    logger.error('Error getting inventory', e);
    throw e;
  }
};

export const getInventoryById = async id => {
  try {
    const [inventoryItem] = await db
      .select({
        id: inventory.id,
        product_id: inventory.product_id,
        product_name: products.name,
        quantity: inventory.quantity,
        min_threshold: inventory.min_threshold,
        is_low_stock:
          sql`CASE WHEN ${inventory.quantity} < ${inventory.min_threshold} THEN true ELSE false END`.as(
            'is_low_stock'
          ),
        created_at: inventory.created_at,
        updated_at: inventory.updated_at,
      })
      .from(inventory)
      .leftJoin(products, eq(inventory.product_id, products.id))
      .where(eq(inventory.id, id))
      .limit(1);

    return inventoryItem;
  } catch (e) {
    logger.error('Error getting inventory by id', e);
    throw e;
  }
};

export const getInventoryByProductId = async productId => {
  try {
    const [inventoryItem] = await db
      .select({
        id: inventory.id,
        product_id: inventory.product_id,
        product_name: products.name,
        quantity: inventory.quantity,
        min_threshold: inventory.min_threshold,
        is_low_stock:
          sql`CASE WHEN ${inventory.quantity} < ${inventory.min_threshold} THEN true ELSE false END`.as(
            'is_low_stock'
          ),
        created_at: inventory.created_at,
        updated_at: inventory.updated_at,
      })
      .from(inventory)
      .leftJoin(products, eq(inventory.product_id, products.id))
      .where(eq(inventory.product_id, productId))
      .limit(1);

    return inventoryItem;
  } catch (e) {
    logger.error('Error getting inventory by product id', e);
    throw e;
  }
};

export const getLowStockAlerts = async () => {
  try {
    const alerts = await db
      .select({
        id: inventory.id,
        product_id: inventory.product_id,
        product_name: products.name,
        quantity: inventory.quantity,
        min_threshold: inventory.min_threshold,
        shortage: sql`${inventory.min_threshold} - ${inventory.quantity}`.as(
          'shortage'
        ),
        created_at: inventory.created_at,
        updated_at: inventory.updated_at,
      })
      .from(inventory)
      .leftJoin(products, eq(inventory.product_id, products.id))
      .where(sql`${inventory.quantity} < ${inventory.min_threshold}`);

    logger.info(`Found ${alerts.length} low stock alerts`);
    return alerts;
  } catch (e) {
    logger.error('Error getting low stock alerts', e);
    throw e;
  }
};

export const adjustStock = async ({
  productId,
  quantity,
  reason,
  adjustedBy,
}) => {
  try {
    // Check if inventory record exists for this product
    let [existingInventory] = await db
      .select()
      .from(inventory)
      .where(eq(inventory.product_id, productId))
      .limit(1);

    // If no inventory record exists, create one
    if (!existingInventory) {
      const [newInventory] = await db
        .insert(inventory)
        .values({
          product_id: productId,
          quantity: 0,
          min_threshold: 10,
        })
        .returning();

      existingInventory = newInventory;
      logger.info(`Created new inventory record for product ${productId}`);
    }

    const newQuantity = existingInventory.quantity + quantity;

    if (newQuantity < 0) {
      throw new Error('Adjustment would result in negative stock quantity');
    }

    const [updatedInventory] = await db
      .update(inventory)
      .set({
        quantity: newQuantity,
        updated_at: new Date(),
      })
      .where(eq(inventory.product_id, productId))
      .returning({
        id: inventory.id,
        product_id: inventory.product_id,
        quantity: inventory.quantity,
        min_threshold: inventory.min_threshold,
        created_at: inventory.created_at,
        updated_at: inventory.updated_at,
      });

    logger.info(
      `Stock adjusted for product ${productId}: ${existingInventory.quantity} -> ${newQuantity} (${quantity >= 0 ? '+' : ''}${quantity}). Reason: ${reason}. By user: ${adjustedBy}`
    );

    return updatedInventory;
  } catch (e) {
    logger.error('Error adjusting stock', e);
    throw e;
  }
};

export const updateMinThreshold = async (productId, minThreshold) => {
  try {
    // Check if inventory record exists for this product
    const [existingInventory] = await db
      .select()
      .from(inventory)
      .where(eq(inventory.product_id, productId))
      .limit(1);

    // If no inventory record exists, create one
    if (!existingInventory) {
      const [newInventory] = await db
        .insert(inventory)
        .values({
          product_id: productId,
          quantity: 0,
          min_threshold: minThreshold,
        })
        .returning({
          id: inventory.id,
          product_id: inventory.product_id,
          quantity: inventory.quantity,
          min_threshold: inventory.min_threshold,
          created_at: inventory.created_at,
          updated_at: inventory.updated_at,
        });

      logger.info(
        `Created new inventory record for product ${productId} with threshold ${minThreshold}`
      );
      return newInventory;
    }

    const [updatedInventory] = await db
      .update(inventory)
      .set({
        min_threshold: minThreshold,
        updated_at: new Date(),
      })
      .where(eq(inventory.product_id, productId))
      .returning({
        id: inventory.id,
        product_id: inventory.product_id,
        quantity: inventory.quantity,
        min_threshold: inventory.min_threshold,
        created_at: inventory.created_at,
        updated_at: inventory.updated_at,
      });

    logger.info(
      `Minimum threshold updated for product ${productId}: ${existingInventory.min_threshold} -> ${minThreshold}`
    );
    return updatedInventory;
  } catch (e) {
    logger.error('Error updating min threshold', e);
    throw e;
  }
};

export const syncInventoryWithProduct = async (productId, stockQuantity) => {
  try {
    // Check if inventory record exists
    const [existingInventory] = await db
      .select()
      .from(inventory)
      .where(eq(inventory.product_id, productId))
      .limit(1);

    if (!existingInventory) {
      // Create new inventory record
      const [newInventory] = await db
        .insert(inventory)
        .values({
          product_id: productId,
          quantity: stockQuantity,
          min_threshold: 10,
        })
        .returning();

      logger.info(
        `Created inventory record for product ${productId} with quantity ${stockQuantity}`
      );
      return newInventory;
    }

    // Update existing inventory record
    const [updatedInventory] = await db
      .update(inventory)
      .set({
        quantity: stockQuantity,
        updated_at: new Date(),
      })
      .where(eq(inventory.product_id, productId))
      .returning();

    logger.info(
      `Synced inventory for product ${productId} to quantity ${stockQuantity}`
    );
    return updatedInventory;
  } catch (e) {
    logger.error('Error syncing inventory with product', e);
    throw e;
  }
};
