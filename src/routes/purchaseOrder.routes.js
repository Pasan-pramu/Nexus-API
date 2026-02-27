import express from 'express';
import {
  createNewPurchaseOrder,
  fetchAllPurchaseOrders,
  fetchPurchaseOrderById,
  updatePurchaseOrderById,
  cancelPurchaseOrderById,
  markPurchaseOrderAsReceived,
} from '#controllers/purchaseOrder.controller.js';
import { authenticate, requireAdmin } from '#middleware/auth.middleware.js';

const router = express.Router();

router.post('/', authenticate, createNewPurchaseOrder);

router.get('/', authenticate, fetchAllPurchaseOrders);

router.get('/:id', authenticate, fetchPurchaseOrderById);

router.put('/:id', authenticate, updatePurchaseOrderById);

router.post('/:id/cancel', authenticate, requireAdmin, cancelPurchaseOrderById);

router.post('/:id/receive', authenticate, markPurchaseOrderAsReceived);

export default router;
