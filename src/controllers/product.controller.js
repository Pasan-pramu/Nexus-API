import logger from '#config/logger.js';
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from '#services/product.service.js';
import {
  createProductSchema,
  updateProductSchema,
  productIdSchema,
  productQuerySchema,
} from '#validations/product.validation.js';
import { formatValidationError } from '#utils/format.js';

export const createNewProduct = async (req, res, next) => {
  try {
    const validationResult = createProductSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { name, description, category, price, status, stock } =
      validationResult.data;

    const product = await createProduct({
      name,
      description,
      category,
      price,
      status,
      stock,
    });

    logger.info(`Product created: ${product.name} by user ${req.user.email}`);
    res.status(201).json({
      message: 'Product created successfully',
      product,
    });
  } catch (e) {
    logger.error('Create product error', e);
    next(e);
  }
};

export const fetchAllProducts = async (req, res, next) => {
  try {
    const validationResult = productQuerySchema.safeParse(req.query);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const filters = validationResult.data;

    logger.info('Getting all products...');

    const allProducts = await getAllProducts(filters);

    res.json({
      message: 'Successfully retrieved all products',
      products: allProducts,
      count: allProducts.length,
    });
  } catch (e) {
    logger.error(e);
    next(e);
  }
};

export const fetchProductById = async (req, res, next) => {
  try {
    const validationResult = productIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    logger.info(`Getting product with id ${id}...`);

    const product = await getProductById(id);

    if (!product) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Product not found',
      });
    }

    res.json({
      message: 'Successfully retrieved product',
      product,
    });
  } catch (e) {
    logger.error(e);
    next(e);
  }
};

export const updateProductById = async (req, res, next) => {
  try {
    const paramValidation = productIdSchema.safeParse(req.params);

    if (!paramValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(paramValidation.error),
      });
    }

    const bodyValidation = updateProductSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(bodyValidation.error),
      });
    }

    const { id } = paramValidation.data;
    const updates = bodyValidation.data;

    logger.info(`Updating product with id ${id}...`);

    const updatedProduct = await updateProduct(id, updates);

    logger.info(`Product ${id} updated by user ${req.user.email}`);
    res.json({
      message: 'Product updated successfully',
      product: updatedProduct,
    });
  } catch (e) {
    logger.error(e);

    if (e.message === 'Product not found') {
      return res.status(404).json({
        error: 'Not found',
        message: 'Product not found',
      });
    }

    next(e);
  }
};

export const deleteProductById = async (req, res, next) => {
  try {
    const validationResult = productIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    logger.info(`Deleting product with id ${id}...`);

    const deletedProduct = await deleteProduct(id);

    logger.info(`Product ${id} deleted by admin ${req.user.email}`);
    res.json({
      message: 'Product deleted successfully',
      product: deletedProduct,
    });
  } catch (e) {
    logger.error(e);

    if (e.message === 'Product not found') {
      return res.status(404).json({
        error: 'Not found',
        message: 'Product not found',
      });
    }

    next(e);
  }
};
