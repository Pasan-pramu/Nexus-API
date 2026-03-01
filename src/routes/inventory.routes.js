import express from 'express';
import {
  fetchAllInventory,
  fetchInventoryById,
  fetchInventoryByProductId,
  fetchLowStockAlerts,
  performStockAdjustment,
  updateProductThreshold,
} from '#controllers/inventory.controller.js';
import { authenticate, requireAdmin } from '#middleware/auth.middleware.js';

const router = express.Router();

// Read-only routes for all authenticated users
router.get('/', authenticate, fetchAllInventory);

router.get('/alerts', authenticate, fetchLowStockAlerts);

router.get('/:id', authenticate, fetchInventoryById);

router.get('/product/:product_id', authenticate, fetchInventoryByProductId);

// Admin-only routes for stock adjustments
router.post('/adjust', authenticate, requireAdmin, performStockAdjustment);

router.put(
  '/product/:product_id/threshold',
  authenticate,
  requireAdmin,
  updateProductThreshold
);

export default router;
