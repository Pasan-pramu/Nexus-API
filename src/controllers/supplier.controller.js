import logger from '#config/logger.js';
import {
  createSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} from '#services/supplier.service.js';
import {
  createSupplierSchema,
  updateSupplierSchema,
  supplierIdSchema,
} from '#validations/supplier.validation.js';
import { formatValidationError } from '#utils/format.js';

export const createNewSupplier = async (req, res, next) => {
  try {
    const validationResult = createSupplierSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { name, email, phone, address, status } = validationResult.data;

    const supplier = await createSupplier({
      name,
      email,
      phone,
      address,
      status,
    });

    logger.info(`Supplier created: ${supplier.name} by user ${req.user.email}`);
    res.status(201).json({
      message: 'Supplier created successfully',
      supplier,
    });
  } catch (e) {
    logger.error('Create supplier error', e);

    if (e.message === 'Supplier with this email already exists') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Supplier with this email already exists',
      });
    }

    next(e);
  }
};

export const fetchAllSuppliers = async (req, res, next) => {
  try {
    logger.info('Getting all suppliers...');

    const allSuppliers = await getAllSuppliers();

    res.json({
      message: 'Successfully retrieved all suppliers',
      suppliers: allSuppliers,
      count: allSuppliers.length,
    });
  } catch (e) {
    logger.error(e);
    next(e);
  }
};

export const fetchSupplierById = async (req, res, next) => {
  try {
    const validationResult = supplierIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    logger.info(`Getting supplier with id ${id}...`);

    const supplier = await getSupplierById(id);

    if (!supplier) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Supplier not found',
      });
    }

    res.json({
      message: 'Successfully retrieved supplier',
      supplier,
    });
  } catch (e) {
    logger.error(e);
    next(e);
  }
};

export const updateSupplierById = async (req, res, next) => {
  try {
    const paramValidation = supplierIdSchema.safeParse(req.params);

    if (!paramValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(paramValidation.error),
      });
    }

    const bodyValidation = updateSupplierSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(bodyValidation.error),
      });
    }

    const { id } = paramValidation.data;
    const updates = bodyValidation.data;

    logger.info(`Updating supplier with id ${id}...`);

    const updatedSupplier = await updateSupplier(id, updates);

    logger.info(`Supplier ${id} updated by user ${req.user.email}`);
    res.json({
      message: 'Supplier updated successfully',
      supplier: updatedSupplier,
    });
  } catch (e) {
    logger.error(e);

    if (e.message === 'Supplier not found') {
      return res.status(404).json({
        error: 'Not found',
        message: 'Supplier not found',
      });
    }

    if (e.message === 'Supplier with this email already exists') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Supplier with this email already exists',
      });
    }

    next(e);
  }
};

export const deleteSupplierById = async (req, res, next) => {
  try {
    const validationResult = supplierIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    logger.info(`Deleting supplier with id ${id}...`);

    const deletedSupplier = await deleteSupplier(id);

    logger.info(`Supplier ${id} deleted by admin ${req.user.email}`);
    res.json({
      message: 'Supplier deleted successfully',
      supplier: deletedSupplier,
    });
  } catch (e) {
    logger.error(e);

    if (e.message === 'Supplier not found') {
      return res.status(404).json({
        error: 'Not found',
        message: 'Supplier not found',
      });
    }

    next(e);
  }
};
