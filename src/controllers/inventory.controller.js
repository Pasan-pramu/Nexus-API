import logger from '#config/logger.js';
import {
  getAllInventory,
  getInventoryById,
  getInventoryByProductId,
  getLowStockAlerts,
  adjustStock,
  updateMinThreshold,
} from '#services/inventory.service.js';
import {
  inventoryIdSchema,
  inventoryQuerySchema,
  stockAdjustmentSchema,
  updateThresholdSchema,
} from '#validations/inventory.validation.js';
import { formatValidationError } from '#utils/format.js';

export const fetchAllInventory = async (req, res, next) => {
  try {
    const validationResult = inventoryQuerySchema.safeParse(req.query);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const filters = validationResult.data;

    logger.info('Getting all inventory...');

    const allInventory = await getAllInventory(filters);

    res.json({
      message: 'Successfully retrieved inventory',
      inventory: allInventory,
      count: allInventory.length,
    });
  } catch (e) {
    logger.error(e);
    next(e);
  }
};

export const fetchInventoryById = async (req, res, next) => {
  try {
    const validationResult = inventoryIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    logger.info(`Getting inventory with id ${id}...`);

    const inventoryItem = await getInventoryById(id);

    if (!inventoryItem) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Inventory item not found',
      });
    }

    res.json({
      message: 'Successfully retrieved inventory item',
      inventory: inventoryItem,
    });
  } catch (e) {
    logger.error(e);
    next(e);
  }
};

export const fetchInventoryByProductId = async (req, res, next) => {
  try {
    const productId = parseInt(req.params.product_id, 10);

    if (isNaN(productId)) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid product ID',
      });
    }

    logger.info(`Getting inventory for product ${productId}...`);

    const inventoryItem = await getInventoryByProductId(productId);

    if (!inventoryItem) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Inventory item not found for this product',
      });
    }

    res.json({
      message: 'Successfully retrieved inventory item',
      inventory: inventoryItem,
    });
  } catch (e) {
    logger.error(e);
    next(e);
  }
};

export const fetchLowStockAlerts = async (req, res, next) => {
  try {
    logger.info('Getting low stock alerts...');

    const alerts = await getLowStockAlerts();

    res.json({
      message: 'Successfully retrieved low stock alerts',
      alerts,
      count: alerts.length,
    });
  } catch (e) {
    logger.error(e);
    next(e);
  }
};

export const performStockAdjustment = async (req, res, next) => {
  try {
    const validationResult = stockAdjustmentSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { product_id, quantity, reason } = validationResult.data;

    logger.info(`Adjusting stock for product ${product_id} by ${quantity}...`);

    const adjustedInventory = await adjustStock({
      productId: product_id,
      quantity,
      reason,
      adjustedBy: req.user.id,
    });

    logger.info(`Stock adjusted for product ${product_id} by admin ${req.user.email}`);
    res.json({
      message: 'Stock adjusted successfully',
      inventory: adjustedInventory,
    });
  } catch (e) {
    logger.error(e);

    if (e.message === 'Adjustment would result in negative stock quantity') {
      return res.status(400).json({
        error: 'Bad request',
        message: e.message,
      });
    }

    next(e);
  }
};

export const updateProductThreshold = async (req, res, next) => {
  try {
    const productId = parseInt(req.params.product_id, 10);

    if (isNaN(productId)) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid product ID',
      });
    }

    const validationResult = updateThresholdSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { min_threshold } = validationResult.data;

    logger.info(`Updating minimum threshold for product ${productId} to ${min_threshold}...`);

    const updatedInventory = await updateMinThreshold(productId, min_threshold);

    logger.info(`Threshold updated for product ${productId} by admin ${req.user.email}`);
    res.json({
      message: 'Minimum threshold updated successfully',
      inventory: updatedInventory,
    });
  } catch (e) {
    logger.error(e);
    next(e);
  }
};
