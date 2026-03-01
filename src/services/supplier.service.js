import logger from '#config/logger.js';
import { db } from '#config/database.js';
import { suppliers } from '#models/supplier.model.js';
import { eq } from 'drizzle-orm';

export const createSupplier = async ({
  name,
  email,
  phone,
  address,
  status,
}) => {
  try {
    const existingSupplier = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.email, email))
      .limit(1);

    if (existingSupplier.length > 0) {
      throw new Error('Supplier with this email already exists');
    }

    const [newSupplier] = await db
      .insert(suppliers)
      .values({
        name,
        email,
        phone,
        address,
        status,
      })
      .returning({
        id: suppliers.id,
        name: suppliers.name,
        email: suppliers.email,
        phone: suppliers.phone,
        address: suppliers.address,
        status: suppliers.status,
        created_at: suppliers.created_at,
        updated_at: suppliers.updated_at,
      });

    logger.info(`Supplier ${newSupplier.name} created successfully`);
    return newSupplier;
  } catch (e) {
    logger.error('Error creating supplier', e);
    throw e;
  }
};

export const getAllSuppliers = async () => {
  try {
    return await db
      .select({
        id: suppliers.id,
        name: suppliers.name,
        email: suppliers.email,
        phone: suppliers.phone,
        address: suppliers.address,
        status: suppliers.status,
        created_at: suppliers.created_at,
        updated_at: suppliers.updated_at,
      })
      .from(suppliers);
  } catch (e) {
    logger.error('Error getting suppliers', e);
    throw e;
  }
};

export const getSupplierById = async id => {
  try {
    const [supplier] = await db
      .select({
        id: suppliers.id,
        name: suppliers.name,
        email: suppliers.email,
        phone: suppliers.phone,
        address: suppliers.address,
        status: suppliers.status,
        created_at: suppliers.created_at,
        updated_at: suppliers.updated_at,
      })
      .from(suppliers)
      .where(eq(suppliers.id, id))
      .limit(1);

    return supplier;
  } catch (e) {
    logger.error('Error getting supplier by id', e);
    throw e;
  }
};

export const updateSupplier = async (id, updates) => {
  try {
    const [existingSupplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id))
      .limit(1);

    if (!existingSupplier) {
      throw new Error('Supplier not found');
    }

    // Check for email uniqueness if email is being updated
    if (updates.email && updates.email !== existingSupplier.email) {
      const [duplicateSupplier] = await db
        .select()
        .from(suppliers)
        .where(eq(suppliers.email, updates.email))
        .limit(1);

      if (duplicateSupplier) {
        throw new Error('Supplier with this email already exists');
      }
    }

    const updateData = { ...updates, updated_at: new Date() };

    const [updatedSupplier] = await db
      .update(suppliers)
      .set(updateData)
      .where(eq(suppliers.id, id))
      .returning({
        id: suppliers.id,
        name: suppliers.name,
        email: suppliers.email,
        phone: suppliers.phone,
        address: suppliers.address,
        status: suppliers.status,
        created_at: suppliers.created_at,
        updated_at: suppliers.updated_at,
      });

    logger.info(`Supplier ${id} updated successfully`);
    return updatedSupplier;
  } catch (e) {
    logger.error('Error updating supplier', e);
    throw e;
  }
};

export const deleteSupplier = async id => {
  try {
    const [existingSupplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id))
      .limit(1);

    if (!existingSupplier) {
      throw new Error('Supplier not found');
    }

    await db.delete(suppliers).where(eq(suppliers.id, id));

    logger.info(`Supplier ${id} deleted successfully`);
    return { id: existingSupplier.id, name: existingSupplier.name };
  } catch (e) {
    logger.error('Error deleting supplier', e);
    throw e;
  }
};
