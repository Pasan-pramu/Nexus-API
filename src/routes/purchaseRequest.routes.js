import express from 'express';
import {
  createNewPurchaseRequest,
  fetchAllPurchaseRequests,
  fetchPurchaseRequestById,
  updatePurchaseRequestById,
  deletePurchaseRequestById,
  approvePurchaseRequestById,
  rejectPurchaseRequestById,
} from '#controllers/purchaseRequest.controller.js';
import { authenticate, requireAdminOrManager } from '#middleware/auth.middleware.js';

const router = express.Router();

router.post('/', authenticate, createNewPurchaseRequest);

router.get('/', authenticate, fetchAllPurchaseRequests);

router.get('/:id', authenticate, fetchPurchaseRequestById);

router.put('/:id', authenticate, updatePurchaseRequestById);

router.delete('/:id', authenticate, deletePurchaseRequestById);

router.post('/:id/approve', authenticate, requireAdminOrManager, approvePurchaseRequestById);

router.post('/:id/reject', authenticate, requireAdminOrManager, rejectPurchaseRequestById);

export default router;
