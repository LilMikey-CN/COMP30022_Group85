const request = require('supertest');
const express = require('express');
const careItemsRouter = require('../../routes/careItems');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/care-items', careItemsRouter);

describe('Care Items API', () => {
  describe('POST /api/care-items', () => {
    it('should create a new care item successfully with all fields', async () => {
      const newCareItem = {
        name: 'Winter Jacket',
        estimated_unit_cost: 89.99,
        quantity_per_purchase: 1,
        quantity_unit: 'piece',
        start_date: '2023-01-01',
        end_date: '2023-12-31',
        category_id: 'cat-123'
      };

      const mockCategoryDoc = {
        exists: true,
        data: () => ({
          name: 'Clothing',
          created_by: 'test-uid'
        })
      };

      mockDoc.get.mockResolvedValue(mockCategoryDoc);
      mockCollection.add.mockResolvedValue({ id: 'item-123' });

      const response = await request(app)
        .post('/api/care-items')
        .send(newCareItem)
        .expect(201);

      expect(response.body.message).toBe('Care item created successfully');
      expect(response.body.id).toBe('item-123');
      expect(response.body.data.name).toBe('Winter Jacket');
      expect(response.body.data.estimated_unit_cost).toBe(89.99);
      expect(response.body.data.quantity_per_purchase).toBe(1);
      expect(response.body.data.quantity_unit).toBe('piece');
      expect(response.body.data.category_id).toBe('cat-123');
      expect(response.body.data.is_active).toBe(true);
      expect(response.body.data.created_by).toBe('test-uid');
    });

    it('should create care item with default values when optional fields are missing', async () => {
      const newCareItem = {};

      mockCollection.add.mockResolvedValue({ id: 'item-124' });

      const response = await request(app)
        .post('/api/care-items')
        .send(newCareItem)
        .expect(201);

      expect(response.body.message).toBe('Care item created successfully');
      expect(response.body.data.name).toBe('');
      expect(response.body.data.estimated_unit_cost).toBe(0);
      expect(response.body.data.quantity_per_purchase).toBe(1);
      expect(response.body.data.quantity_unit).toBe('');
      expect(response.body.data.category_id).toBeNull();
      expect(response.body.data.end_date).toBeNull();
    });

    it('should create care item with partial fields', async () => {
      const newCareItem = {
        name: 'Toothpaste',
        quantity_unit: 'tube'
      };

      mockCollection.add.mockResolvedValue({ id: 'item-125' });

      const response = await request(app)
        .post('/api/care-items')
        .send(newCareItem)
        .expect(201);

      expect(response.body.message).toBe('Care item created successfully');
      expect(response.body.data.name).toBe('Toothpaste');
      expect(response.body.data.quantity_unit).toBe('tube');
      expect(response.body.data.estimated_unit_cost).toBe(0);
    });

    it('should return 404 when category does not exist', async () => {
      const newCareItem = {
        name: 'Test Item',
        category_id: 'nonexistent-cat'
      };

      const mockCategoryDoc = {
        exists: false
      };

      mockDoc.get.mockResolvedValue(mockCategoryDoc);

      const response = await request(app)
        .post('/api/care-items')
        .send(newCareItem)
        .expect(404);

      expect(response.body.error).toBe('Category not found');
    });

    it('should return 403 when category belongs to another user', async () => {
      const newCareItem = {
        name: 'Test Item',
        category_id: 'cat-other-user'
      };

      const mockCategoryDoc = {
        exists: true,
        data: () => ({
          name: 'Clothing',
          created_by: 'different-user-uid'
        })
      };

      mockDoc.get.mockResolvedValue(mockCategoryDoc);

      const response = await request(app)
        .post('/api/care-items')
        .send(newCareItem)
        .expect(403);

      expect(response.body.error).toBe('Forbidden: Category does not belong to you');
    });

    it('should handle database errors', async () => {
      const newCareItem = {
        name: 'Test Item'
      };

      mockCollection.add.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/care-items')
        .send(newCareItem)
        .expect(500);

      expect(response.body.error).toBe('Failed to create care item');
    });
  });

  describe('GET /api/care-items', () => {
    it('should get all care items with default pagination', async () => {
      const mockSnapshot = {
        forEach: jest.fn((callback) => {
          callback({
            id: 'item-1',
            data: () => ({
              name: 'Item 1',
              estimated_unit_cost: 10.0,
              quantity_per_purchase: 1,
              quantity_unit: 'piece',
              start_date: { toDate: () => new Date('2023-01-01') },
              end_date: null,
              is_active: true,
              category_id: 'cat-1',
              created_by: 'test-uid',
              created_at: { toDate: () => new Date('2023-01-01') },
              updated_at: { toDate: () => new Date('2023-01-01') },
              deactivated_at: null
            })
          });
          callback({
            id: 'item-2',
            data: () => ({
              name: 'Item 2',
              estimated_unit_cost: 20.0,
              quantity_per_purchase: 2,
              quantity_unit: 'pack',
              start_date: { toDate: () => new Date('2023-01-02') },
              end_date: { toDate: () => new Date('2023-12-31') },
              is_active: true,
              category_id: 'cat-2',
              created_by: 'test-uid',
              created_at: { toDate: () => new Date('2023-01-02') },
              updated_at: { toDate: () => new Date('2023-01-02') },
              deactivated_at: null
            })
          });
        })
      };

      mockCollection.where.mockReturnThis();
      mockCollection.orderBy.mockReturnThis();
      mockCollection.limit.mockReturnThis();
      mockCollection.offset.mockReturnThis();
      mockCollection.get.mockResolvedValue(mockSnapshot);

      const response = await request(app)
        .get('/api/care-items')
        .expect(200);

      expect(response.body.care_items).toHaveLength(2);
      expect(response.body.care_items[0].name).toBe('Item 2');
      expect(response.body.care_items[1].name).toBe('Item 1');
      expect(response.body.count).toBe(2);
      expect(response.body.pagination.limit).toBe(50);
      expect(response.body.pagination.offset).toBe(0);
    });

    it('should filter care items by category', async () => {
      const mockSnapshot = {
        forEach: jest.fn((callback) => {
          callback({
            id: 'item-1',
            data: () => ({
              name: 'Clothing Item',
              category_id: 'cat-clothing',
              is_active: true,
              start_date: { toDate: () => new Date('2023-01-01') },
              created_at: { toDate: () => new Date('2023-01-01') },
              updated_at: { toDate: () => new Date('2023-01-01') }
            })
          });
        })
      };

      mockCollection.where.mockReturnThis();
      mockCollection.orderBy.mockReturnThis();
      mockCollection.limit.mockReturnThis();
      mockCollection.offset.mockReturnThis();
      mockCollection.get.mockResolvedValue(mockSnapshot);

      const response = await request(app)
        .get('/api/care-items?category_id=cat-clothing')
        .expect(200);

      expect(response.body.care_items).toHaveLength(1);
      expect(response.body.care_items[0].category_id).toBe('cat-clothing');
    });

    it('should get all items including inactive when is_active=all', async () => {
      const mockSnapshot = {
        forEach: jest.fn((callback) => {
          callback({
            id: 'item-1',
            data: () => ({
              name: 'Active Item',
              is_active: true,
              start_date: { toDate: () => new Date('2023-01-01') },
              created_at: { toDate: () => new Date('2023-01-01') },
              updated_at: { toDate: () => new Date('2023-01-01') }
            })
          });
          callback({
            id: 'item-2',
            data: () => ({
              name: 'Inactive Item',
              is_active: false,
              start_date: { toDate: () => new Date('2023-01-01') },
              created_at: { toDate: () => new Date('2023-01-01') },
              updated_at: { toDate: () => new Date('2023-01-01') },
              deactivated_at: { toDate: () => new Date('2023-06-01') }
            })
          });
        })
      };

      mockCollection.where.mockReturnThis();
      mockCollection.orderBy.mockReturnThis();
      mockCollection.limit.mockReturnThis();
      mockCollection.offset.mockReturnThis();
      mockCollection.get.mockResolvedValue(mockSnapshot);

      const response = await request(app)
        .get('/api/care-items?is_active=all')
        .expect(200);

      expect(response.body.care_items).toHaveLength(2);
    });

    it('should support custom pagination', async () => {
      const mockSnapshot = {
        forEach: jest.fn()
      };

      mockCollection.where.mockReturnThis();
      mockCollection.orderBy.mockReturnThis();
      mockCollection.limit.mockReturnThis();
      mockCollection.offset.mockReturnThis();
      mockCollection.get.mockResolvedValue(mockSnapshot);

      const response = await request(app)
        .get('/api/care-items?limit=10&offset=20')
        .expect(200);

      expect(response.body.pagination.limit).toBe(10);
      expect(response.body.pagination.offset).toBe(20);
    });

    it('should handle database errors', async () => {
      mockCollection.where.mockReturnThis();
      mockCollection.orderBy.mockReturnThis();
      mockCollection.limit.mockReturnThis();
      mockCollection.offset.mockReturnThis();
      mockCollection.get.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/care-items')
        .expect(500);

      expect(response.body.error).toBe('Failed to fetch care items');
    });
  });

  describe('GET /api/care-items/:id', () => {
    it('should get a specific care item by id', async () => {
      const mockCareItemDoc = {
        exists: true,
        id: 'item-123',
        data: () => ({
          name: 'Specific Item',
          estimated_unit_cost: 15.5,
          quantity_per_purchase: 3,
          quantity_unit: 'bottle',
          start_date: { toDate: () => new Date('2023-01-01') },
          end_date: { toDate: () => new Date('2023-12-31') },
          is_active: true,
          category_id: 'cat-1',
          created_by: 'test-uid',
          created_at: { toDate: () => new Date('2023-01-01') },
          updated_at: { toDate: () => new Date('2023-01-01') },
          deactivated_at: null
        })
      };

      mockDoc.get.mockResolvedValue(mockCareItemDoc);

      const response = await request(app)
        .get('/api/care-items/item-123')
        .expect(200);

      expect(response.body.id).toBe('item-123');
      expect(response.body.name).toBe('Specific Item');
      expect(response.body.estimated_unit_cost).toBe(15.5);
      expect(response.body.quantity_per_purchase).toBe(3);
      expect(response.body.quantity_unit).toBe('bottle');
    });

    it('should return 404 when care item not found', async () => {
      const mockCareItemDoc = {
        exists: false
      };

      mockDoc.get.mockResolvedValue(mockCareItemDoc);

      const response = await request(app)
        .get('/api/care-items/nonexistent-id')
        .expect(404);

      expect(response.body.error).toBe('Care item not found');
    });

    it('should return 403 when care item belongs to another user', async () => {
      const mockCareItemDoc = {
        exists: true,
        id: 'item-foreign',
        data: () => ({ created_by: 'someone-else' })
      };

      mockDoc.get.mockResolvedValue(mockCareItemDoc);

      const response = await request(app)
        .get('/api/care-items/item-foreign')
        .expect(403);

      expect(response.body.error).toBe('Forbidden: Care item does not belong to you');
    });

    it('should handle database errors', async () => {
      mockDoc.get.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/care-items/item-123')
        .expect(500);

      expect(response.body.error).toBe('Failed to fetch care item');
    });
  });

  describe('PUT /api/care-items/:id', () => {
    it('should update all fields of care item', async () => {
      const mockCareItemDoc = {
        exists: true,
        id: 'item-123',
        data: () => ({
          name: 'Old Name',
          estimated_unit_cost: 10.0,
          quantity_per_purchase: 1,
          quantity_unit: 'piece',
          start_date: { toDate: () => new Date('2023-01-01') },
          end_date: null,
          is_active: true,
          category_id: 'cat-1',
          created_by: 'test-uid',
          created_at: { toDate: () => new Date('2023-01-01') },
          updated_at: { toDate: () => new Date('2023-01-01') }
        })
      };

      const updatedMockCareItemDoc = {
        exists: true,
        id: 'item-123',
        data: () => ({
          name: 'Updated Name',
          estimated_unit_cost: 25.99,
          quantity_per_purchase: 5,
          quantity_unit: 'pack',
          start_date: { toDate: () => new Date('2023-02-01') },
          end_date: { toDate: () => new Date('2023-12-31') },
          is_active: true,
          category_id: 'cat-2',
          created_by: 'test-uid',
          created_at: { toDate: () => new Date('2023-01-01') },
          updated_at: { toDate: () => new Date('2023-02-01') }
        })
      };

      const mockCategoryDoc = {
        exists: true,
        data: () => ({
          name: 'Category',
          created_by: 'test-uid'
        })
      };

      mockDoc.get.mockResolvedValueOnce(mockCareItemDoc)
        .mockResolvedValueOnce(mockCategoryDoc)
        .mockResolvedValueOnce(updatedMockCareItemDoc);
      mockDoc.update.mockResolvedValue();

      const updateData = {
        name: 'Updated Name',
        estimated_unit_cost: 25.99,
        quantity_per_purchase: 5,
        quantity_unit: 'pack',
        start_date: '2023-02-01',
        end_date: '2023-12-31',
        category_id: 'cat-2'
      };

      const response = await request(app)
        .put('/api/care-items/item-123')
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Care item updated successfully');
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.estimated_unit_cost).toBe(25.99);
      expect(response.body.data.quantity_per_purchase).toBe(5);
      expect(response.body.data.quantity_unit).toBe('pack');
      expect(response.body.data.category_id).toBe('cat-2');
    });

    it('should update partial fields only', async () => {
      const mockCareItemDoc = {
        exists: true,
        id: 'item-123',
        data: () => ({
          name: 'Item Name',
          estimated_unit_cost: 10.0,
          quantity_unit: 'piece',
          is_active: true,
          created_by: 'test-uid',
          created_at: { toDate: () => new Date('2023-01-01') },
          updated_at: { toDate: () => new Date('2023-01-01') }
        })
      };

      const updatedMockCareItemDoc = {
        exists: true,
        id: 'item-123',
        data: () => ({
          name: 'Updated Item Name',
          estimated_unit_cost: 10.0,
          quantity_unit: 'piece',
          is_active: true,
          created_by: 'test-uid',
          created_at: { toDate: () => new Date('2023-01-01') },
          updated_at: { toDate: () => new Date('2023-02-01') }
        })
      };

      mockDoc.get.mockResolvedValueOnce(mockCareItemDoc).mockResolvedValueOnce(updatedMockCareItemDoc);
      mockDoc.update.mockResolvedValue();

      const updateData = {
        name: 'Updated Item Name'
      };

      const response = await request(app)
        .put('/api/care-items/item-123')
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Care item updated successfully');
      expect(response.body.data.name).toBe('Updated Item Name');
    });

    it('should return 403 when updating care item belonging to another user', async () => {
      const mockCareItemDoc = {
        exists: true,
        id: 'item-foreign',
        data: () => ({
          name: 'Foreign Item',
          created_by: 'someone-else'
        })
      };

      mockDoc.get.mockResolvedValueOnce(mockCareItemDoc);

      const response = await request(app)
        .put('/api/care-items/item-foreign')
        .send({ name: 'Attempted Update' })
        .expect(403);

      expect(response.body.error).toBe('Forbidden: Care item does not belong to you');
    });

    it('should update is_active field', async () => {
      const mockCareItemDoc = {
        exists: true,
        id: 'item-123',
        data: () => ({
          name: 'Item',
          is_active: true,
          created_by: 'test-uid',
          created_at: { toDate: () => new Date('2023-01-01') },
          updated_at: { toDate: () => new Date('2023-01-01') }
        })
      };

      const updatedMockCareItemDoc = {
        exists: true,
        id: 'item-123',
        data: () => ({
          name: 'Item',
          is_active: false,
          created_by: 'test-uid',
          created_at: { toDate: () => new Date('2023-01-01') },
          updated_at: { toDate: () => new Date('2023-02-01') }
        })
      };

      mockDoc.get.mockResolvedValueOnce(mockCareItemDoc).mockResolvedValueOnce(updatedMockCareItemDoc);
      mockDoc.update.mockResolvedValue();

      const updateData = {
        is_active: false
      };

      const response = await request(app)
        .put('/api/care-items/item-123')
        .send(updateData)
        .expect(200);

      expect(response.body.data.is_active).toBe(false);
    });

    it('should return 404 when care item not found', async () => {
      const mockCareItemDoc = {
        exists: false
      };

      mockDoc.get.mockResolvedValue(mockCareItemDoc);

      const updateData = {
        name: 'Updated Name'
      };

      const response = await request(app)
        .put('/api/care-items/nonexistent-id')
        .send(updateData)
        .expect(404);

      expect(response.body.error).toBe('Care item not found');
    });

    it('should return 404 when updated category does not exist', async () => {
      const mockCareItemDoc = {
        exists: true,
        data: () => ({
          name: 'Item',
          category_id: 'cat-1',
          created_by: 'test-uid'
        })
      };

      const mockCategoryDoc = {
        exists: false
      };

      mockDoc.get.mockResolvedValueOnce(mockCareItemDoc).mockResolvedValueOnce(mockCategoryDoc);

      const updateData = {
        category_id: 'nonexistent-cat'
      };

      const response = await request(app)
        .put('/api/care-items/item-123')
        .send(updateData)
        .expect(404);

      expect(response.body.error).toBe('Category not found');
    });

    it('should return 403 when updated category belongs to another user', async () => {
      const mockCareItemDoc = {
        exists: true,
        data: () => ({
          name: 'Item',
          category_id: 'cat-1',
          created_by: 'test-uid'
        })
      };

      const mockCategoryDoc = {
        exists: true,
        data: () => ({
          name: 'Clothing',
          created_by: 'different-user-uid'
        })
      };

      mockDoc.get.mockResolvedValueOnce(mockCareItemDoc).mockResolvedValueOnce(mockCategoryDoc);

      const updateData = {
        category_id: 'cat-other-user'
      };

      const response = await request(app)
        .put('/api/care-items/item-123')
        .send(updateData)
        .expect(403);

      expect(response.body.error).toBe('Forbidden: Category does not belong to you');
    });

    it('should handle database errors', async () => {
      mockDoc.get.mockRejectedValue(new Error('Database error'));

      const updateData = {
        name: 'Updated Name'
      };

      const response = await request(app)
        .put('/api/care-items/item-123')
        .send(updateData)
        .expect(500);

      expect(response.body.error).toBe('Failed to update care item');
    });
  });

  describe('DELETE /api/care-items/:id', () => {
    it('should soft delete care item successfully', async () => {
      const mockCareItemDoc = {
        exists: true,
        id: 'item-123',
        data: () => ({
          name: 'Item to Delete',
          is_active: true,
          created_by: 'test-uid'
        })
      };

      mockDoc.get.mockResolvedValue(mockCareItemDoc);
      mockDoc.update.mockResolvedValue();

      const response = await request(app)
        .delete('/api/care-items/item-123')
        .expect(200);

      expect(response.body.message).toBe('Care item deactivated successfully');
      expect(response.body.id).toBe('item-123');
      expect(mockDoc.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: false
        })
      );
    });

    it('should return 403 when deactivating care item belonging to another user', async () => {
      const mockCareItemDoc = {
        exists: true,
        id: 'item-foreign',
        data: () => ({
          name: 'Foreign Item',
          is_active: true,
          created_by: 'someone-else'
        })
      };

      mockDoc.get.mockResolvedValue(mockCareItemDoc);

      const response = await request(app)
        .delete('/api/care-items/item-foreign')
        .expect(403);

      expect(response.body.error).toBe('Forbidden: Care item does not belong to you');
    });

    it('should return 404 when care item not found', async () => {
      const mockCareItemDoc = {
        exists: false
      };

      mockDoc.get.mockResolvedValue(mockCareItemDoc);

      const response = await request(app)
        .delete('/api/care-items/nonexistent-id')
        .expect(404);

      expect(response.body.error).toBe('Care item not found');
    });

    it('should handle database errors', async () => {
      mockDoc.get.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/api/care-items/item-123')
        .expect(500);

      expect(response.body.error).toBe('Failed to deactivate care item');
    });
  });

  describe('PATCH /api/care-items/:id/reactivate', () => {
    it('should reactivate a deactivated care item', async () => {
      const mockCareItemDoc = {
        exists: true,
        id: 'item-123',
        data: () => ({
          name: 'Deactivated Item',
          is_active: false,
          deactivated_at: new Date('2023-06-01'),
          created_by: 'test-uid'
        })
      };

      mockDoc.get.mockResolvedValue(mockCareItemDoc);
      mockDoc.update.mockResolvedValue();

      const response = await request(app)
        .patch('/api/care-items/item-123/reactivate')
        .expect(200);

      expect(response.body.message).toBe('Care item reactivated successfully');
      expect(response.body.id).toBe('item-123');
      expect(mockDoc.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: true,
          deactivated_at: null
        })
      );
    });

    it('should return 403 when reactivating care item belonging to another user', async () => {
      const mockCareItemDoc = {
        exists: true,
        id: 'item-foreign',
        data: () => ({
          name: 'Foreign Item',
          is_active: false,
          created_by: 'someone-else'
        })
      };

      mockDoc.get.mockResolvedValue(mockCareItemDoc);

      const response = await request(app)
        .patch('/api/care-items/item-foreign/reactivate')
        .expect(403);

      expect(response.body.error).toBe('Forbidden: Care item does not belong to you');
    });

    it('should return 404 when care item not found', async () => {
      const mockCareItemDoc = {
        exists: false
      };

      mockDoc.get.mockResolvedValue(mockCareItemDoc);

      const response = await request(app)
        .patch('/api/care-items/nonexistent-id/reactivate')
        .expect(404);

      expect(response.body.error).toBe('Care item not found');
    });

    it('should handle database errors', async () => {
      mockDoc.get.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .patch('/api/care-items/item-123/reactivate')
        .expect(500);

      expect(response.body.error).toBe('Failed to reactivate care item');
    });
  });
});
