import logger from '#config/logger.js';
import {
  createPurchaseOrder,
  getAllPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  cancelPurchaseOrder,
  markAsReceived,
} from '#services/purchaseOrder.service.js';
import {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  purchaseOrderIdSchema,
  purchaseOrderQuerySchema,
  markAsReceivedSchema,
  cancelPurchaseOrderSchema,
} from '#validations/purchaseOrder.validation.js';
import { formatValidationError } from '#utils/format.js';

export const createNewPurchaseOrder = async (req, res, next) => {
  try {
    const validationResult = createPurchaseOrderSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { supplier_id, pr_id, items, notes } = validationResult.data;

    const purchaseOrder = await createPurchaseOrder({
      supplierId: supplier_id,
      prId: pr_id,
      items,
      notes,
      createdBy: req.user.id,
    });

    logger.info(`Purchase order ${purchaseOrder.id} created by user ${req.user.email}`);
    res.status(201).json({
      message: 'Purchase order created successfully',
      purchase_order: purchaseOrder,
    });
  } catch (e) {
    logger.error('Create purchase order error', e);

    if (e.message === 'Purchase request not found') {
      return res.status(404).json({
        error: 'Not found',
        message: 'Purchase request not found',
      });
    }

    if (e.message === 'Purchase order can only be created from approved purchase requests') {
      return res.status(400).json({
        error: 'Bad request',
        message: e.message,
      });
    }

    next(e);
  }
};

export const fetchAllPurchaseOrders = async (req, res, next) => {
  try {
    const validationResult = purchaseOrderQuerySchema.safeParse(req.query);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const filters = validationResult.data;

    logger.info('Getting all purchase orders...');

    const allPOs = await getAllPurchaseOrders(filters);

    res.json({
      message: 'Successfully retrieved all purchase orders',
      purchase_orders: allPOs,
      count: allPOs.length,
    });
  } catch (e) {
    logger.error(e);
    next(e);
  }
};

export const fetchPurchaseOrderById = async (req, res, next) => {
  try {
    const validationResult = purchaseOrderIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    logger.info(`Getting purchase order with id ${id}...`);

    const po = await getPurchaseOrderById(id);

    if (!po) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Purchase order not found',
      });
    }

    res.json({
      message: 'Successfully retrieved purchase order',
      purchase_order: po,
    });
  } catch (e) {
    logger.error(e);
    next(e);
  }
};

export const updatePurchaseOrderById = async (req, res, next) => {
  try {
    const paramValidation = purchaseOrderIdSchema.safeParse(req.params);

    if (!paramValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(paramValidation.error),
      });
    }

    const bodyValidation = updatePurchaseOrderSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(bodyValidation.error),
      });
    }

    const { id } = paramValidation.data;
    const updates = bodyValidation.data;

    logger.info(`Updating purchase order with id ${id}...`);

    const updatedPO = await updatePurchaseOrder(id, updates);

    logger.info(`Purchase order ${id} updated by user ${req.user.email}`);
    res.json({
      message: 'Purchase order updated successfully',
      purchase_order: updatedPO,
    });
  } catch (e) {
    logger.error(e);

    if (e.message === 'Purchase order not found') {
      return res.status(404).json({
        error: 'Not found',
        message: 'Purchase order not found',
      });
    }

    if (e.message === 'Cannot update a purchase order that is not pending') {
      return res.status(400).json({
        error: 'Bad request',
        message: e.message,
      });
    }

    next(e);
  }
};

export const cancelPurchaseOrderById = async (req, res, next) => {
  try {
    const paramValidation = purchaseOrderIdSchema.safeParse(req.params);

    if (!paramValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(paramValidation.error),
      });
    }

    const bodyValidation = cancelPurchaseOrderSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(bodyValidation.error),
      });
    }

    const { id } = paramValidation.data;
    const { cancellation_reason } = bodyValidation.data;

    logger.info(`Cancelling purchase order with id ${id}...`);

    const cancelledPO = await cancelPurchaseOrder(id, req.user.id, cancellation_reason);

    logger.info(`Purchase order ${id} cancelled by admin ${req.user.email}`);
    res.json({
      message: 'Purchase order cancelled successfully',
      purchase_order: cancelledPO,
    });
  } catch (e) {
    logger.error(e);

    if (e.message === 'Purchase order not found') {
      return res.status(404).json({
        error: 'Not found',
        message: 'Purchase order not found',
      });
    }

    if (e.message === 'Purchase order is already cancelled' || e.message === 'Cannot cancel a purchase order that has been received') {
      return res.status(400).json({
        error: 'Bad request',
        message: e.message,
      });
    }

    next(e);
  }
};

export const markPurchaseOrderAsReceived = async (req, res, next) => {
  try {
    const paramValidation = purchaseOrderIdSchema.safeParse(req.params);

    if (!paramValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(paramValidation.error),
      });
    }

    const bodyValidation = markAsReceivedSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(bodyValidation.error),
      });
    }

    const { id } = paramValidation.data;
    const { notes } = bodyValidation.data;

    logger.info(`Marking purchase order ${id} as received...`);

    const receivedPO = await markAsReceived(id, req.user.id, notes);

    logger.info(`Purchase order ${id} marked as received by ${req.user.email}`);
    res.json({
      message: 'Purchase order marked as received successfully',
      purchase_order: receivedPO,
    });
  } catch (e) {
    logger.error(e);

    if (e.message === 'Purchase order not found') {
      return res.status(404).json({
        error: 'Not found',
        message: 'Purchase order not found',
      });
    }

    if (e.message === 'Purchase order is already marked as received' || e.message === 'Cannot mark a cancelled purchase order as received') {
      return res.status(400).json({
        error: 'Bad request',
        message: e.message,
      });
    }

    next(e);
  }
};
