import { jest } from '@jest/globals';

// Mock modules before importing the service
const mockDb = {
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};

const mockSuppliers = {
  id: 'id',
  name: 'name',
  email: 'email',
  phone: 'phone',
  address: 'address',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at',
};

jest.unstable_mockModule('#config/database.js', () => ({
  db: mockDb,
}));

jest.unstable_mockModule('#config/logger.js', () => ({
  default: mockLogger,
}));

jest.unstable_mockModule('#models/supplier.model.js', () => ({
  suppliers: mockSuppliers,
}));

// Import after mocking
const { createSupplier, getSupplierById, updateSupplier, deleteSupplier } =
  await import('#services/supplier.service.js');

describe('Supplier Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSupplier', () => {
    it('should successfully create a new supplier with valid data', async () => {
      const supplierData = {
        name: 'Test Supplier',
        email: 'test@supplier.com',
        phone: '+1234567890',
        address: '123 Test St',
        status: 'active',
      };

      const mockCreatedSupplier = {
        id: 1,
        ...supplierData,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock: check for existing supplier (should return empty array)
      const mockSelectFrom = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      });

      // Mock: insert new supplier
      const mockInsertReturning = jest
        .fn()
        .mockResolvedValue([mockCreatedSupplier]);
      const mockInsertValues = jest.fn().mockReturnValue({
        returning: mockInsertReturning,
      });

      mockDb.select.mockReturnValue({
        from: mockSelectFrom,
      });
      mockDb.insert.mockReturnValue({
        values: mockInsertValues,
      });

      const result = await createSupplier(supplierData);

      expect(result).toEqual(mockCreatedSupplier);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Supplier ${mockCreatedSupplier.name} created successfully`
      );
    });

    it('should throw an error when attempting to create a supplier with a duplicate email', async () => {
      const supplierData = {
        name: 'Duplicate Supplier',
        email: 'duplicate@supplier.com',
        phone: '+1234567890',
        address: '456 Duplicate Ave',
        status: 'active',
      };

      const existingSupplier = {
        id: 1,
        name: 'Existing Supplier',
        email: 'duplicate@supplier.com',
        phone: '+9876543210',
        address: '789 Existing Rd',
        status: 'active',
      };

      // Mock: check for existing supplier (should return existing supplier)
      const mockSelectFrom = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([existingSupplier]),
        }),
      });

      mockDb.select.mockReturnValue({
        from: mockSelectFrom,
      });

      await expect(createSupplier(supplierData)).rejects.toThrow(
        'Supplier with this email already exists'
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error creating supplier',
        expect.any(Error)
      );
      expect(mockDb.insert).not.toHaveBeenCalled();
    });
  });

  describe('getSupplierById', () => {
    it('should return the correct supplier when a valid ID is provided', async () => {
      const supplierId = 1;
      const mockSupplier = {
        id: supplierId,
        name: 'Test Supplier',
        email: 'test@supplier.com',
        phone: '+1234567890',
        address: '123 Test St',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock: select supplier by ID
      const mockSelectFrom = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockSupplier]),
        }),
      });

      mockDb.select.mockReturnValue({
        from: mockSelectFrom,
      });

      const result = await getSupplierById(supplierId);

      expect(result).toEqual(mockSupplier);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should return undefined when supplier is not found', async () => {
      const supplierId = 999;

      // Mock: select supplier by ID (returns empty array)
      const mockSelectFrom = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      });

      mockDb.select.mockReturnValue({
        from: mockSelectFrom,
      });

      const result = await getSupplierById(supplierId);

      expect(result).toBeUndefined();
      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe('updateSupplier', () => {
    it("should successfully update an existing supplier's details", async () => {
      const supplierId = 1;
      const existingSupplier = {
        id: supplierId,
        name: 'Old Name',
        email: 'old@supplier.com',
        phone: '+1111111111',
        address: '111 Old St',
        status: 'active',
      };

      const updates = {
        name: 'Updated Name',
        phone: '+2222222222',
      };

      const updatedSupplier = {
        ...existingSupplier,
        ...updates,
        updated_at: expect.any(Date),
      };

      // Mock: check existing supplier
      const mockSelectExisting = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([existingSupplier]),
        }),
      });

      mockDb.select.mockReturnValue({
        from: mockSelectExisting,
      });

      // Mock: update supplier
      const mockUpdateSet = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([updatedSupplier]),
        }),
      });

      mockDb.update.mockReturnValue({
        set: mockUpdateSet,
      });

      const result = await updateSupplier(supplierId, updates);

      expect(result).toEqual(updatedSupplier);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Supplier ${supplierId} updated successfully`
      );
    });

    it('should throw an error when supplier is not found', async () => {
      const supplierId = 999;
      const updates = {
        name: 'Updated Name',
      };

      // Mock: check existing supplier (not found)
      const mockSelectExisting = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      });

      mockDb.select.mockReturnValue({
        from: mockSelectExisting,
      });

      await expect(updateSupplier(supplierId, updates)).rejects.toThrow(
        'Supplier not found'
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error updating supplier',
        expect.any(Error)
      );
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it('should throw an error when updating email to a duplicate', async () => {
      const supplierId = 1;
      const existingSupplier = {
        id: supplierId,
        name: 'Supplier One',
        email: 'supplier1@test.com',
        phone: '+1111111111',
        address: '111 Test St',
        status: 'active',
      };

      const duplicateSupplier = {
        id: 2,
        name: 'Supplier Two',
        email: 'supplier2@test.com',
        phone: '+2222222222',
        address: '222 Test Ave',
        status: 'active',
      };

      const updates = {
        email: 'supplier2@test.com',
      };

      let callCount = 0;
      const mockSelectFrom = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
              // First call: return existing supplier
              return Promise.resolve([existingSupplier]);
            } else {
              // Second call: return duplicate email supplier
              return Promise.resolve([duplicateSupplier]);
            }
          }),
        }),
      });

      mockDb.select.mockReturnValue({
        from: mockSelectFrom,
      });

      await expect(updateSupplier(supplierId, updates)).rejects.toThrow(
        'Supplier with this email already exists'
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error updating supplier',
        expect.any(Error)
      );
      expect(mockDb.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteSupplier', () => {
    it('should successfully remove a supplier from the database', async () => {
      const supplierId = 1;
      const existingSupplier = {
        id: supplierId,
        name: 'Test Supplier',
        email: 'test@supplier.com',
        phone: '+1234567890',
        address: '123 Test St',
        status: 'active',
      };

      // Mock: check existing supplier
      const mockSelectFrom = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([existingSupplier]),
        }),
      });

      mockDb.select.mockReturnValue({
        from: mockSelectFrom,
      });

      // Mock: delete supplier
      const mockDeleteWhere = jest.fn().mockResolvedValue(undefined);
      mockDb.delete.mockReturnValue({
        where: mockDeleteWhere,
      });

      const result = await deleteSupplier(supplierId);

      expect(result).toEqual({
        id: existingSupplier.id,
        name: existingSupplier.name,
      });
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Supplier ${supplierId} deleted successfully`
      );
    });

    it('should throw an error when supplier is not found', async () => {
      const supplierId = 999;

      // Mock: check existing supplier (not found)
      const mockSelectFrom = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      });

      mockDb.select.mockReturnValue({
        from: mockSelectFrom,
      });

      await expect(deleteSupplier(supplierId)).rejects.toThrow(
        'Supplier not found'
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error deleting supplier',
        expect.any(Error)
      );
      expect(mockDb.delete).not.toHaveBeenCalled();
    });
  });
});
