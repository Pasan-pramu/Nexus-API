import logger from '#config/logger.js';
import { db } from '#config/database.js';
import { categories } from '#models/category.model.js';
import { eq } from 'drizzle-orm';

export const createCategory = async ({ name, description, isActive }) => {
  try {
    const existingCategory = await db
      .select()
      .from(categories)
      .where(eq(categories.name, name))
      .limit(1);

    if (existingCategory.length > 0) {
      throw new Error('Category with this name already exists');
    }

    const [newCategory] = await db
      .insert(categories)
      .values({
        name,
        description,
        is_active: isActive,
      })
      .returning({
        id: categories.id,
        name: categories.name,
        description: categories.description,
        isActive: categories.is_active,
        created_at: categories.created_at,
        updated_at: categories.updated_at,
      });

    logger.info(`Category ${newCategory.name} created successfully`);
    return newCategory;
  } catch (e) {
    logger.error('Error creating category', e);
    throw e;
  }
};

export const getAllCategories = async () => {
  try {
    return await db
      .select({
        id: categories.id,
        name: categories.name,
        description: categories.description,
        isActive: categories.is_active,
        created_at: categories.created_at,
        updated_at: categories.updated_at,
      })
      .from(categories);
  } catch (e) {
    logger.error('Error getting categories', e);
    throw e;
  }
};

export const getCategoryById = async id => {
  try {
    const [category] = await db
      .select({
        id: categories.id,
        name: categories.name,
        description: categories.description,
        isActive: categories.is_active,
        created_at: categories.created_at,
        updated_at: categories.updated_at,
      })
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    return category;
  } catch (e) {
    logger.error('Error getting category by id', e);
    throw e;
  }
};

export const updateCategory = async (id, updates) => {
  try {
    const [existingCategory] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (!existingCategory) {
      throw new Error('Category not found');
    }

    // Check for name uniqueness if name is being updated
    if (updates.name && updates.name !== existingCategory.name) {
      const [duplicateCategory] = await db
        .select()
        .from(categories)
        .where(eq(categories.name, updates.name))
        .limit(1);

      if (duplicateCategory) {
        throw new Error('Category with this name already exists');
      }
    }

    const updateData = { ...updates, updated_at: new Date() };

    // Map isActive to is_active
    if (updates.isActive !== undefined) {
      updateData.is_active = updates.isActive;
      delete updateData.isActive;
    }

    const [updatedCategory] = await db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning({
        id: categories.id,
        name: categories.name,
        description: categories.description,
        isActive: categories.is_active,
        created_at: categories.created_at,
        updated_at: categories.updated_at,
      });

    logger.info(`Category ${id} updated successfully`);
    return updatedCategory;
  } catch (e) {
    logger.error('Error updating category', e);
    throw e;
  }
};

export const deleteCategory = async id => {
  try {
    const [existingCategory] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (!existingCategory) {
      throw new Error('Category not found');
    }

    await db.delete(categories).where(eq(categories.id, id));

    logger.info(`Category ${id} deleted successfully`);
    return { id: existingCategory.id, name: existingCategory.name };
  } catch (e) {
    logger.error('Error deleting category', e);
    throw e;
  }
};
