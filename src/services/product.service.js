import logger from '#config/logger.js';
import { db } from '#config/database.js';
import { products } from '#models/product.model.js';
import { eq, and, or, ilike } from 'drizzle-orm';

export const createProduct = async ({
  name,
  description,
  category,
  price,
  status,
  stock,
}) => {
  try {
    const [newProduct] = await db
      .insert(products)
      .values({
        name,
        description,
        category,
        price: price.toString(),
        status,
        stock,
      })
      .returning({
        id: products.id,
        name: products.name,
        description: products.description,
        category: products.category,
        price: products.price,
        status: products.status,
        stock: products.stock,
        created_at: products.created_at,
        updated_at: products.updated_at,
      });

    logger.info(`Product ${newProduct.name} created successfully`);
    return newProduct;
  } catch (e) {
    logger.error('Error creating product', e);
    throw e;
  }
};

export const getAllProducts = async (filters = {}) => {
  try {
    const conditions = [];

    if (filters.category) {
      conditions.push(eq(products.category, filters.category));
    }

    if (filters.status) {
      conditions.push(eq(products.status, filters.status));
    }

    if (filters.search) {
      conditions.push(
        or(
          ilike(products.name, `%${filters.search}%`),
          ilike(products.description, `%${filters.search}%`)
        )
      );
    }

    const query = db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        category: products.category,
        price: products.price,
        status: products.status,
        stock: products.stock,
        created_at: products.created_at,
        updated_at: products.updated_at,
      })
      .from(products);

    if (conditions.length > 0) {
      return await query.where(and(...conditions));
    }

    return await query;
  } catch (e) {
    logger.error('Error getting products', e);
    throw e;
  }
};

export const getProductById = async id => {
  try {
    const [product] = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        category: products.category,
        price: products.price,
        status: products.status,
        stock: products.stock,
        created_at: products.created_at,
        updated_at: products.updated_at,
      })
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    return product;
  } catch (e) {
    logger.error('Error getting product by id', e);
    throw e;
  }
};

export const updateProduct = async (id, updates) => {
  try {
    const [existingProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!existingProduct) {
      throw new Error('Product not found');
    }

    const updateData = { ...updates, updated_at: new Date() };

    // Convert price to string if it exists
    if (updates.price !== undefined) {
      updateData.price = updates.price.toString();
    }

    const [updatedProduct] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning({
        id: products.id,
        name: products.name,
        description: products.description,
        category: products.category,
        price: products.price,
        status: products.status,
        stock: products.stock,
        created_at: products.created_at,
        updated_at: products.updated_at,
      });

    logger.info(`Product ${id} updated successfully`);
    return updatedProduct;
  } catch (e) {
    logger.error('Error updating product', e);
    throw e;
  }
};

export const deleteProduct = async id => {
  try {
    const [existingProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!existingProduct) {
      throw new Error('Product not found');
    }

    await db.delete(products).where(eq(products.id, id));

    logger.info(`Product ${id} deleted successfully`);
    return { id: existingProduct.id, name: existingProduct.name };
  } catch (e) {
    logger.error('Error deleting product', e);
    throw e;
  }
};
