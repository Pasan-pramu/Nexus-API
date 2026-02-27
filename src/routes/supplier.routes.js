import express from 'express';
import {
  createNewSupplier,
  fetchAllSuppliers,
  fetchSupplierById,
  updateSupplierById,
  deleteSupplierById,
} from '#controllers/supplier.controller.js';
import { authenticate, requireAdmin } from '#middleware/auth.middleware.js';

const router = express.Router();

router.post('/', authenticate, createNewSupplier);

router.get('/', authenticate, fetchAllSuppliers);

router.get('/:id', authenticate, fetchSupplierById);

router.put('/:id', authenticate, updateSupplierById);

router.delete('/:id', authenticate, requireAdmin, deleteSupplierById);

export default router;
