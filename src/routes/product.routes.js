import express from 'express';
import {
  createNewProduct,
  fetchAllProducts,
  fetchProductById,
  updateProductById,
  deleteProductById,
} from '#controllers/product.controller.js';
import { authenticate, requireAdmin } from '#middleware/auth.middleware.js';

const router = express.Router();

router.post('/', authenticate, createNewProduct);

router.get('/', authenticate, fetchAllProducts);

router.get('/:id', authenticate, fetchProductById);

router.put('/:id', authenticate, updateProductById);

router.delete('/:id', authenticate, requireAdmin, deleteProductById);

export default router;
