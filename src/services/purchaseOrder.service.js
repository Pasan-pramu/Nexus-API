import logger from '#config/logger.js';
import { db } from '#config/database.js';
import { purchaseOrders } from '#models/purchaseOrder.model.js';
import { purchaseRequests } from '#models/purchaseRequest.model.js';
import { products } from '#models/product.model.js';
import { inventory } from '#models/inventory.model.js';
import { eq, and, sql } from 'drizzle-orm';

export const createPurchaseOrder = async ({ supplierId, prId, items, notes, createdBy }) => {
  try {
    // Verify that the PR exists and is approved
    const [pr] = await db
      .select()
      .from(purchaseRequests)
      .where(eq(purchaseRequests.id, prId))
      .limit(1);

    if (!pr) {
      throw new Error('Purchase request not found');
    }

    if (pr.status !== 'approved') {
      throw new Error('Purchase order can only be created from approved purchase requests');
    }

    const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0);

    const [newPO] = await db
      .insert(purchaseOrders)
      .values({
        supplier_id: supplierId,
        pr_id: prId,
        items,
        total_amount: totalAmount.toString(),
        notes,
        status: 'pending',
        created_by: createdBy,
      })
      .returning({
        id: purchaseOrders.id,
        supplier_id: purchaseOrders.supplier_id,
        pr_id: purchaseOrders.pr_id,
        items: purchaseOrders.items,
        total_amount: purchaseOrders.total_amount,
        status: purchaseOrders.status,
        notes: purchaseOrders.notes,
        created_by: purchaseOrders.created_by,
        received_at: purchaseOrders.received_at,
        received_by: purchaseOrders.received_by,
        cancelled_by: purchaseOrders.cancelled_by,
        cancelled_at: purchaseOrders.cancelled_at,
        cancellation_reason: purchaseOrders.cancellation_reason,
        created_at: purchaseOrders.created_at,
        updated_at: purchaseOrders.updated_at,
      });

    logger.info(`Purchase order ${newPO.id} created by user ${createdBy} for PR ${prId}`);
    return newPO;
  } catch (e) {
    logger.error('Error creating purchase order', e);
    throw e;
  }
};

export const getAllPurchaseOrders = async (filters = {}) => {
  try {
    const conditions = [];

    if (filters.status) {
      conditions.push(eq(purchaseOrders.status, filters.status));
    }

    if (filters.supplier_id) {
      conditions.push(eq(purchaseOrders.supplier_id, filters.supplier_id));
    }

    if (filters.pr_id) {
      conditions.push(eq(purchaseOrders.pr_id, filters.pr_id));
    }

    const query = db
      .select({
        id: purchaseOrders.id,
        supplier_id: purchaseOrders.supplier_id,
        pr_id: purchaseOrders.pr_id,
        items: purchaseOrders.items,
        total_amount: purchaseOrders.total_amount,
        status: purchaseOrders.status,
        notes: purchaseOrders.notes,
        created_by: purchaseOrders.created_by,
        received_at: purchaseOrders.received_at,
        received_by: purchaseOrders.received_by,
        cancelled_by: purchaseOrders.cancelled_by,
        cancelled_at: purchaseOrders.cancelled_at,
        cancellation_reason: purchaseOrders.cancellation_reason,
        created_at: purchaseOrders.created_at,
        updated_at: purchaseOrders.updated_at,
      })
      .from(purchaseOrders);

    if (conditions.length > 0) {
      return await query.where(and(...conditions));
    }

    return await query;
  } catch (e) {
    logger.error('Error getting purchase orders', e);
    throw e;
  }
};

export const getPurchaseOrderById = async id => {
  try {
    const [po] = await db
      .select({
        id: purchaseOrders.id,
        supplier_id: purchaseOrders.supplier_id,
        pr_id: purchaseOrders.pr_id,
        items: purchaseOrders.items,
        total_amount: purchaseOrders.total_amount,
        status: purchaseOrders.status,
        notes: purchaseOrders.notes,
        created_by: purchaseOrders.created_by,
        received_at: purchaseOrders.received_at,
        received_by: purchaseOrders.received_by,
        cancelled_by: purchaseOrders.cancelled_by,
        cancelled_at: purchaseOrders.cancelled_at,
        cancellation_reason: purchaseOrders.cancellation_reason,
        created_at: purchaseOrders.created_at,
        updated_at: purchaseOrders.updated_at,
      })
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, id))
      .limit(1);

    return po;
  } catch (e) {
    logger.error('Error getting purchase order by id', e);
    throw e;
  }
};

export const updatePurchaseOrder = async (id, updates) => {
  try {
    const [existingPO] = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, id))
      .limit(1);

    if (!existingPO) {
      throw new Error('Purchase order not found');
    }

    if (existingPO.status !== 'pending') {
      throw new Error('Cannot update a purchase order that is not pending');
    }

    const updateData = { ...updates, updated_at: new Date() };

    // Recalculate total amount if items are updated
    if (updates.items) {
      const totalAmount = updates.items.reduce((sum, item) => sum + item.total_price, 0);
      updateData.total_amount = totalAmount.toString();
    }

    const [updatedPO] = await db
      .update(purchaseOrders)
      .set(updateData)
      .where(eq(purchaseOrders.id, id))
      .returning({
        id: purchaseOrders.id,
        supplier_id: purchaseOrders.supplier_id,
        pr_id: purchaseOrders.pr_id,
        items: purchaseOrders.items,
        total_amount: purchaseOrders.total_amount,
        status: purchaseOrders.status,
        notes: purchaseOrders.notes,
        created_by: purchaseOrders.created_by,
        received_at: purchaseOrders.received_at,
        received_by: purchaseOrders.received_by,
        cancelled_by: purchaseOrders.cancelled_by,
        cancelled_at: purchaseOrders.cancelled_at,
        cancellation_reason: purchaseOrders.cancellation_reason,
        created_at: purchaseOrders.created_at,
        updated_at: purchaseOrders.updated_at,
      });

    logger.info(`Purchase order ${id} updated successfully`);
    return updatedPO;
  } catch (e) {
    logger.error('Error updating purchase order', e);
    throw e;
  }
};

export const cancelPurchaseOrder = async (id, cancelledBy, cancellationReason) => {
  try {
    const [existingPO] = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, id))
      .limit(1);

    if (!existingPO) {
      throw new Error('Purchase order not found');
    }

    if (existingPO.status === 'cancelled') {
      throw new Error('Purchase order is already cancelled');
    }

    if (existingPO.status === 'received') {
      throw new Error('Cannot cancel a purchase order that has been received');
    }

    const [cancelledPO] = await db
      .update(purchaseOrders)
      .set({
        status: 'cancelled',
        cancelled_by: cancelledBy,
        cancelled_at: new Date(),
        cancellation_reason: cancellationReason,
        updated_at: new Date(),
      })
      .where(eq(purchaseOrders.id, id))
      .returning({
        id: purchaseOrders.id,
        supplier_id: purchaseOrders.supplier_id,
        pr_id: purchaseOrders.pr_id,
        items: purchaseOrders.items,
        total_amount: purchaseOrders.total_amount,
        status: purchaseOrders.status,
        notes: purchaseOrders.notes,
        created_by: purchaseOrders.created_by,
        received_at: purchaseOrders.received_at,
        received_by: purchaseOrders.received_by,
        cancelled_by: purchaseOrders.cancelled_by,
        cancelled_at: purchaseOrders.cancelled_at,
        cancellation_reason: purchaseOrders.cancellation_reason,
        created_at: purchaseOrders.created_at,
        updated_at: purchaseOrders.updated_at,
      });

    logger.info(`Purchase order ${id} cancelled by user ${cancelledBy}`);
    return cancelledPO;
  } catch (e) {
    logger.error('Error cancelling purchase order', e);
    throw e;
  }
};

export const markAsReceived = async (id, receivedBy, notes) => {
  try {
    const [existingPO] = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, id))
      .limit(1);

    if (!existingPO) {
      throw new Error('Purchase order not found');
    }

    if (existingPO.status === 'received') {
      throw new Error('Purchase order is already marked as received');
    }

    if (existingPO.status === 'cancelled') {
      throw new Error('Cannot mark a cancelled purchase order as received');
    }

    // Update inventory for each item in the PO
    const items = existingPO.items;
    for (const item of items) {
      // Update product stock
      await db
        .update(products)
        .set({
          stock: sql`${products.stock} + ${item.quantity}`,
          updated_at: new Date(),
        })
        .where(eq(products.id, item.product_id));

      // Update or create inventory record
      const [existingInventory] = await db
        .select()
        .from(inventory)
        .where(eq(inventory.product_id, item.product_id))
        .limit(1);

      if (existingInventory) {
        // Update existing inventory
        await db
          .update(inventory)
          .set({
            quantity: sql`${inventory.quantity} + ${item.quantity}`,
            updated_at: new Date(),
          })
          .where(eq(inventory.product_id, item.product_id));
      } else {
        // Create new inventory record
        await db.insert(inventory).values({
          product_id: item.product_id,
          quantity: item.quantity,
          min_threshold: 10,
        });
      }

      logger.info(`Inventory updated for product ${item.product_id}: +${item.quantity} units`);
    }

    const [receivedPO] = await db
      .update(purchaseOrders)
      .set({
        status: 'received',
        received_by: receivedBy,
        received_at: new Date(),
        notes: notes || existingPO.notes,
        updated_at: new Date(),
      })
      .where(eq(purchaseOrders.id, id))
      .returning({
        id: purchaseOrders.id,
        supplier_id: purchaseOrders.supplier_id,
        pr_id: purchaseOrders.pr_id,
        items: purchaseOrders.items,
        total_amount: purchaseOrders.total_amount,
        status: purchaseOrders.status,
        notes: purchaseOrders.notes,
        created_by: purchaseOrders.created_by,
        received_at: purchaseOrders.received_at,
        received_by: purchaseOrders.received_by,
        cancelled_by: purchaseOrders.cancelled_by,
        cancelled_at: purchaseOrders.cancelled_at,
        cancellation_reason: purchaseOrders.cancellation_reason,
        created_at: purchaseOrders.created_at,
        updated_at: purchaseOrders.updated_at,
      });

    logger.info(`Purchase order ${id} marked as received by user ${receivedBy}`);
    return receivedPO;
  } catch (e) {
    logger.error('Error marking purchase order as received', e);
    throw e;
  }
};
