import logger from '#config/logger.js';
import { db } from '#config/database.js';
import { purchaseRequests } from '#models/purchaseRequest.model.js';
import { eq, and } from 'drizzle-orm';

export const createPurchaseRequest = async ({ requesterId, items, notes }) => {
  try {
    const totalCost = items.reduce((sum, item) => sum + item.total_price, 0);

    const [newPR] = await db
      .insert(purchaseRequests)
      .values({
        requester_id: requesterId,
        items,
        total_cost: totalCost.toString(),
        notes,
        status: 'pending',
      })
      .returning({
        id: purchaseRequests.id,
        requester_id: purchaseRequests.requester_id,
        items: purchaseRequests.items,
        total_cost: purchaseRequests.total_cost,
        status: purchaseRequests.status,
        notes: purchaseRequests.notes,
        approved_by: purchaseRequests.approved_by,
        approved_at: purchaseRequests.approved_at,
        rejection_reason: purchaseRequests.rejection_reason,
        created_at: purchaseRequests.created_at,
        updated_at: purchaseRequests.updated_at,
      });

    logger.info(`Purchase request ${newPR.id} created by user ${requesterId}`);
    return newPR;
  } catch (e) {
    logger.error('Error creating purchase request', e);
    throw e;
  }
};

export const getAllPurchaseRequests = async (filters = {}) => {
  try {
    const conditions = [];

    if (filters.status) {
      conditions.push(eq(purchaseRequests.status, filters.status));
    }

    if (filters.requester_id) {
      conditions.push(eq(purchaseRequests.requester_id, filters.requester_id));
    }

    const query = db
      .select({
        id: purchaseRequests.id,
        requester_id: purchaseRequests.requester_id,
        items: purchaseRequests.items,
        total_cost: purchaseRequests.total_cost,
        status: purchaseRequests.status,
        notes: purchaseRequests.notes,
        approved_by: purchaseRequests.approved_by,
        approved_at: purchaseRequests.approved_at,
        rejection_reason: purchaseRequests.rejection_reason,
        created_at: purchaseRequests.created_at,
        updated_at: purchaseRequests.updated_at,
      })
      .from(purchaseRequests);

    if (conditions.length > 0) {
      return await query.where(and(...conditions));
    }

    return await query;
  } catch (e) {
    logger.error('Error getting purchase requests', e);
    throw e;
  }
};

export const getPurchaseRequestById = async id => {
  try {
    const [pr] = await db
      .select({
        id: purchaseRequests.id,
        requester_id: purchaseRequests.requester_id,
        items: purchaseRequests.items,
        total_cost: purchaseRequests.total_cost,
        status: purchaseRequests.status,
        notes: purchaseRequests.notes,
        approved_by: purchaseRequests.approved_by,
        approved_at: purchaseRequests.approved_at,
        rejection_reason: purchaseRequests.rejection_reason,
        created_at: purchaseRequests.created_at,
        updated_at: purchaseRequests.updated_at,
      })
      .from(purchaseRequests)
      .where(eq(purchaseRequests.id, id))
      .limit(1);

    return pr;
  } catch (e) {
    logger.error('Error getting purchase request by id', e);
    throw e;
  }
};

export const updatePurchaseRequest = async (id, updates) => {
  try {
    const [existingPR] = await db
      .select()
      .from(purchaseRequests)
      .where(eq(purchaseRequests.id, id))
      .limit(1);

    if (!existingPR) {
      throw new Error('Purchase request not found');
    }

    if (existingPR.status !== 'pending') {
      throw new Error('Cannot update a purchase request that is not pending');
    }

    const updateData = { ...updates, updated_at: new Date() };

    // Recalculate total cost if items are updated
    if (updates.items) {
      const totalCost = updates.items.reduce((sum, item) => sum + item.total_price, 0);
      updateData.total_cost = totalCost.toString();
    }

    const [updatedPR] = await db
      .update(purchaseRequests)
      .set(updateData)
      .where(eq(purchaseRequests.id, id))
      .returning({
        id: purchaseRequests.id,
        requester_id: purchaseRequests.requester_id,
        items: purchaseRequests.items,
        total_cost: purchaseRequests.total_cost,
        status: purchaseRequests.status,
        notes: purchaseRequests.notes,
        approved_by: purchaseRequests.approved_by,
        approved_at: purchaseRequests.approved_at,
        rejection_reason: purchaseRequests.rejection_reason,
        created_at: purchaseRequests.created_at,
        updated_at: purchaseRequests.updated_at,
      });

    logger.info(`Purchase request ${id} updated successfully`);
    return updatedPR;
  } catch (e) {
    logger.error('Error updating purchase request', e);
    throw e;
  }
};

export const deletePurchaseRequest = async id => {
  try {
    const [existingPR] = await db
      .select()
      .from(purchaseRequests)
      .where(eq(purchaseRequests.id, id))
      .limit(1);

    if (!existingPR) {
      throw new Error('Purchase request not found');
    }

    if (existingPR.status !== 'pending') {
      throw new Error('Cannot delete a purchase request that is not pending');
    }

    await db.delete(purchaseRequests).where(eq(purchaseRequests.id, id));

    logger.info(`Purchase request ${id} deleted successfully`);
    return { id: existingPR.id };
  } catch (e) {
    logger.error('Error deleting purchase request', e);
    throw e;
  }
};

export const approvePurchaseRequest = async (id, approverId, notes) => {
  try {
    const [existingPR] = await db
      .select()
      .from(purchaseRequests)
      .where(eq(purchaseRequests.id, id))
      .limit(1);

    if (!existingPR) {
      throw new Error('Purchase request not found');
    }

    if (existingPR.status !== 'pending') {
      throw new Error('Only pending purchase requests can be approved');
    }

    const [approvedPR] = await db
      .update(purchaseRequests)
      .set({
        status: 'approved',
        approved_by: approverId,
        approved_at: new Date(),
        notes: notes || existingPR.notes,
        updated_at: new Date(),
      })
      .where(eq(purchaseRequests.id, id))
      .returning({
        id: purchaseRequests.id,
        requester_id: purchaseRequests.requester_id,
        items: purchaseRequests.items,
        total_cost: purchaseRequests.total_cost,
        status: purchaseRequests.status,
        notes: purchaseRequests.notes,
        approved_by: purchaseRequests.approved_by,
        approved_at: purchaseRequests.approved_at,
        rejection_reason: purchaseRequests.rejection_reason,
        created_at: purchaseRequests.created_at,
        updated_at: purchaseRequests.updated_at,
      });

    logger.info(`Purchase request ${id} approved by user ${approverId}`);
    return approvedPR;
  } catch (e) {
    logger.error('Error approving purchase request', e);
    throw e;
  }
};

export const rejectPurchaseRequest = async (id, approverId, rejectionReason) => {
  try {
    const [existingPR] = await db
      .select()
      .from(purchaseRequests)
      .where(eq(purchaseRequests.id, id))
      .limit(1);

    if (!existingPR) {
      throw new Error('Purchase request not found');
    }

    if (existingPR.status !== 'pending') {
      throw new Error('Only pending purchase requests can be rejected');
    }

    const [rejectedPR] = await db
      .update(purchaseRequests)
      .set({
        status: 'rejected',
        approved_by: approverId,
        approved_at: new Date(),
        rejection_reason: rejectionReason,
        updated_at: new Date(),
      })
      .where(eq(purchaseRequests.id, id))
      .returning({
        id: purchaseRequests.id,
        requester_id: purchaseRequests.requester_id,
        items: purchaseRequests.items,
        total_cost: purchaseRequests.total_cost,
        status: purchaseRequests.status,
        notes: purchaseRequests.notes,
        approved_by: purchaseRequests.approved_by,
        approved_at: purchaseRequests.approved_at,
        rejection_reason: purchaseRequests.rejection_reason,
        created_at: purchaseRequests.created_at,
        updated_at: purchaseRequests.updated_at,
      });

    logger.info(`Purchase request ${id} rejected by user ${approverId}`);
    return rejectedPR;
  } catch (e) {
    logger.error('Error rejecting purchase request', e);
    throw e;
  }
};
