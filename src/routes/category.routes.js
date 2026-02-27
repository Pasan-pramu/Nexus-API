import express from 'express';
import {
  createNewCategory,
  fetchAllCategories,
  fetchCategoryById,
  updateCategoryById,
  deleteCategoryById,
} from '#controllers/category.controller.js';
import { authenticate, requireAdmin } from '#middleware/auth.middleware.js';

const router = express.Router();

router.post('/', authenticate, createNewCategory);

router.get('/', authenticate, fetchAllCategories);

router.get('/:id', authenticate, fetchCategoryById);

router.put('/:id', authenticate, updateCategoryById);

router.delete('/:id', authenticate, requireAdmin, deleteCategoryById);

export default router;
