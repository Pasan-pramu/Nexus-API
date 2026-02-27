import logger from '#config/logger.js';
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from '#services/category.service.js';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
} from '#validations/category.validation.js';
import { formatValidationError } from '#utils/format.js';

export const createNewCategory = async (req, res, next) => {
  try {
    const validationResult = createCategorySchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { name, description, isActive } = validationResult.data;

    const category = await createCategory({
      name,
      description,
      isActive,
    });

    logger.info(`Category created: ${category.name} by user ${req.user.email}`);
    res.status(201).json({
      message: 'Category created successfully',
      category,
    });
  } catch (e) {
    logger.error('Create category error', e);

    if (e.message === 'Category with this name already exists') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Category with this name already exists',
      });
    }

    next(e);
  }
};

export const fetchAllCategories = async (req, res, next) => {
  try {
    logger.info('Getting all categories...');

    const allCategories = await getAllCategories();

    res.json({
      message: 'Successfully retrieved all categories',
      categories: allCategories,
      count: allCategories.length,
    });
  } catch (e) {
    logger.error(e);
    next(e);
  }
};

export const fetchCategoryById = async (req, res, next) => {
  try {
    const validationResult = categoryIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    logger.info(`Getting category with id ${id}...`);

    const category = await getCategoryById(id);

    if (!category) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Category not found',
      });
    }

    res.json({
      message: 'Successfully retrieved category',
      category,
    });
  } catch (e) {
    logger.error(e);
    next(e);
  }
};

export const updateCategoryById = async (req, res, next) => {
  try {
    const paramValidation = categoryIdSchema.safeParse(req.params);

    if (!paramValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(paramValidation.error),
      });
    }

    const bodyValidation = updateCategorySchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(bodyValidation.error),
      });
    }

    const { id } = paramValidation.data;
    const updates = bodyValidation.data;

    logger.info(`Updating category with id ${id}...`);

    const updatedCategory = await updateCategory(id, updates);

    logger.info(`Category ${id} updated by user ${req.user.email}`);
    res.json({
      message: 'Category updated successfully',
      category: updatedCategory,
    });
  } catch (e) {
    logger.error(e);

    if (e.message === 'Category not found') {
      return res.status(404).json({
        error: 'Not found',
        message: 'Category not found',
      });
    }

    if (e.message === 'Category with this name already exists') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Category with this name already exists',
      });
    }

    next(e);
  }
};

export const deleteCategoryById = async (req, res, next) => {
  try {
    const validationResult = categoryIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    logger.info(`Deleting category with id ${id}...`);

    const deletedCategory = await deleteCategory(id);

    logger.info(`Category ${id} deleted by admin ${req.user.email}`);
    res.json({
      message: 'Category deleted successfully',
      category: deletedCategory,
    });
  } catch (e) {
    logger.error(e);

    if (e.message === 'Category not found') {
      return res.status(404).json({
        error: 'Not found',
        message: 'Category not found',
      });
    }

    next(e);
  }
};
