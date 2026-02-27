import logger from '#config/logger.js';
import {
  createPurchaseRequest,
  getAllPurchaseRequests,
  getPurchaseRequestById,
  updatePurchaseRequest,
  deletePurchaseRequest,
  approvePurchaseRequest,
  rejectPurchaseRequest,
} from '#services/purchaseRequest.service.js';
import {
  createPurchaseRequestSchema,
  updatePurchaseRequestSchema,
  purchaseRequestIdSchema,
  purchaseRequestQuerySchema,
  approvePurchaseRequestSchema,
  rejectPurchaseRequestSchema,
} from '#validations/purchaseRequest.validation.js';
import { formatValidationError } from '#utils/format.js';

export const createNewPurchaseRequest = async (req, res, next) => {
  try {
    const validationResult = createPurchaseRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { items, notes } = validationResult.data;

    const purchaseRequest = await createPurchaseRequest({
      requesterId: req.user.id,
      items,
      notes,
    });

    logger.info(`Purchase request ${purchaseRequest.id} created by user ${req.user.email}`);
    res.status(201).json({
      message: 'Purchase request created successfully',
      purchase_request: purchaseRequest,
    });
  } catch (e) {
    logger.error('Create purchase request error', e);
    next(e);
  }
};

export const fetchAllPurchaseRequests = async (req, res, next) => {
  try {
    const validationResult = purchaseRequestQuerySchema.safeParse(req.query);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const filters = validationResult.data;

    logger.info('Getting all purchase requests...');

    const allPRs = await getAllPurchaseRequests(filters);

    res.json({
      message: 'Successfully retrieved all purchase requests',
      purchase_requests: allPRs,
      count: allPRs.length,
    });
  } catch (e) {
    logger.error(e);
    next(e);
  }
};

export const fetchPurchaseRequestById = async (req, res, next) => {
  try {
    const validationResult = purchaseRequestIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    logger.info(`Getting purchase request with id ${id}...`);

    const pr = await getPurchaseRequestById(id);

    if (!pr) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Purchase request not found',
      });
    }

    res.json({
      message: 'Successfully retrieved purchase request',
      purchase_request: pr,
    });
  } catch (e) {
    logger.error(e);
    next(e);
  }
};

export const updatePurchaseRequestById = async (req, res, next) => {
  try {
    const paramValidation = purchaseRequestIdSchema.safeParse(req.params);

    if (!paramValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(paramValidation.error),
      });
    }

    const bodyValidation = updatePurchaseRequestSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(bodyValidation.error),
      });
    }

    const { id } = paramValidation.data;
    const updates = bodyValidation.data;

    logger.info(`Updating purchase request with id ${id}...`);

    const updatedPR = await updatePurchaseRequest(id, updates);

    logger.info(`Purchase request ${id} updated by user ${req.user.email}`);
    res.json({
      message: 'Purchase request updated successfully',
      purchase_request: updatedPR,
    });
  } catch (e) {
    logger.error(e);

    if (e.message === 'Purchase request not found') {
      return res.status(404).json({
        error: 'Not found',
        message: 'Purchase request not found',
      });
    }

    if (e.message === 'Cannot update a purchase request that is not pending') {
      return res.status(400).json({
        error: 'Bad request',
        message: e.message,
      });
    }

    next(e);
  }
};

export const deletePurchaseRequestById = async (req, res, next) => {
  try {
    const validationResult = purchaseRequestIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    logger.info(`Deleting purchase request with id ${id}...`);

    const deletedPR = await deletePurchaseRequest(id);

    logger.info(`Purchase request ${id} deleted by user ${req.user.email}`);
    res.json({
      message: 'Purchase request deleted successfully',
      purchase_request: deletedPR,
    });
  } catch (e) {
    logger.error(e);

    if (e.message === 'Purchase request not found') {
      return res.status(404).json({
        error: 'Not found',
        message: 'Purchase request not found',
      });
    }

    if (e.message === 'Cannot delete a purchase request that is not pending') {
      return res.status(400).json({
        error: 'Bad request',
        message: e.message,
      });
    }

    next(e);
  }
};

export const approvePurchaseRequestById = async (req, res, next) => {
  try {
    const paramValidation = purchaseRequestIdSchema.safeParse(req.params);

    if (!paramValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(paramValidation.error),
      });
    }

    const bodyValidation = approvePurchaseRequestSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(bodyValidation.error),
      });
    }

    const { id } = paramValidation.data;
    const { notes } = bodyValidation.data;

    logger.info(`Approving purchase request with id ${id}...`);

    const approvedPR = await approvePurchaseRequest(id, req.user.id, notes);

    logger.info(`Purchase request ${id} approved by ${req.user.email}`);
    res.json({
      message: 'Purchase request approved successfully',
      purchase_request: approvedPR,
    });
  } catch (e) {
    logger.error(e);

    if (e.message === 'Purchase request not found') {
      return res.status(404).json({
        error: 'Not found',
        message: 'Purchase request not found',
      });
    }

    if (e.message === 'Only pending purchase requests can be approved') {
      return res.status(400).json({
        error: 'Bad request',
        message: e.message,
      });
    }

    next(e);
  }
};

export const rejectPurchaseRequestById = async (req, res, next) => {
  try {
    const paramValidation = purchaseRequestIdSchema.safeParse(req.params);

    if (!paramValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(paramValidation.error),
      });
    }

    const bodyValidation = rejectPurchaseRequestSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(bodyValidation.error),
      });
    }

    const { id } = paramValidation.data;
    const { rejection_reason } = bodyValidation.data;

    logger.info(`Rejecting purchase request with id ${id}...`);

    const rejectedPR = await rejectPurchaseRequest(id, req.user.id, rejection_reason);

    logger.info(`Purchase request ${id} rejected by ${req.user.email}`);
    res.json({
      message: 'Purchase request rejected successfully',
      purchase_request: rejectedPR,
    });
  } catch (e) {
    logger.error(e);

    if (e.message === 'Purchase request not found') {
      return res.status(404).json({
        error: 'Not found',
        message: 'Purchase request not found',
      });
    }

    if (e.message === 'Only pending purchase requests can be rejected') {
      return res.status(400).json({
        error: 'Bad request',
        message: e.message,
      });
    }

    next(e);
  }
};
