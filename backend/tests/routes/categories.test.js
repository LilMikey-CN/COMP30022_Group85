const request = require('supertest');
const express = require('express');
const categoriesRouter = require('../../routes/categories');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/categories', categoriesRouter);

describe('Categories API', () => {
  describe('POST /api/categories', () => {
    it('should create a new category successfully', async () => {
      const newCategory = {
        name: 'Electronics',
        description: 'Electronic devices and accessories',
        color_code: '#3B82F6',
        display_order: 5
      };

      const mockSnapshot = {
        empty: true,
        docs: []
      };

      mockCollection.where.mockReturnThis();
      mockCollection.get.mockResolvedValue(mockSnapshot);
      mockCollection.add.mockResolvedValue({ id: 'cat-123' });

      const response = await request(app)
        .post('/api/categories')
        .send(newCategory)
        .expect(201);

      expect(response.body.message).toBe('Category created successfully');
      expect(response.body.id).toBe('cat-123');
      expect(response.body.data.name).toBe('Electronics');
      expect(response.body.data.description).toBe('Electronic devices and accessories');
      expect(response.body.data.color_code).toBe('#3B82F6');
      expect(response.body.data.display_order).toBe(5);
      expect(response.body.data.is_active).toBe(true);
      expect(response.body.data.created_by).toBe('test-uid');
    });

    it('should create category with default values when optional fields are missing', async () => {
      const newCategory = {
        name: 'Transport'
      };

      const mockSnapshot = {
        empty: true,
        docs: []
      };

      mockCollection.where.mockReturnThis();
      mockCollection.get.mockResolvedValue(mockSnapshot);
      mockCollection.add.mockResolvedValue({ id: 'cat-124' });

      const response = await request(app)
        .post('/api/categories')
        .send(newCategory)
        .expect(201);

      expect(response.body.message).toBe('Category created successfully');
      expect(response.body.data.name).toBe('Transport');
      expect(response.body.data.description).toBe('');
      expect(response.body.data.color_code).toBe('#6B7280');
      expect(response.body.data.display_order).toBe(0);
    });

    it('should return 400 when category name is missing', async () => {
      const newCategory = {
        description: 'Test description'
      };

      const response = await request(app)
        .post('/api/categories')
        .send(newCategory)
        .expect(400);

      expect(response.body.error).toBe('Category name is required and must be a non-empty string');
    });

    it('should return 400 when category name is empty string', async () => {
      const newCategory = {
        name: '   '
      };

      const response = await request(app)
        .post('/api/categories')
        .send(newCategory)
        .expect(400);

      expect(response.body.error).toBe('Category name is required and must be a non-empty string');
    });

    it('should return 400 when duplicate category name exists for the same user', async () => {
      const newCategory = {
        name: 'Food'
      };

      const mockSnapshot = {
        empty: false,
        docs: [{ id: 'existing-cat-id' }]
      };

      mockCollection.where.mockReturnThis();
      mockCollection.get.mockResolvedValue(mockSnapshot);

      const response = await request(app)
        .post('/api/categories')
        .send(newCategory)
        .expect(400);

      expect(response.body.error).toBe('A category with this name already exists');
    });

    it('should handle database errors', async () => {
      const newCategory = {
        name: 'Test Category'
      };

      mockCollection.where.mockReturnThis();
      mockCollection.get.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/categories')
        .send(newCategory)
        .expect(500);

      expect(response.body.error).toBe('Failed to create category');
    });
  });

  describe('GET /api/categories', () => {
    it('should get all active categories', async () => {
      const mockSnapshot = {
        forEach: jest.fn((callback) => {
          callback({
            id: 'cat-1',
            data: () => ({
              name: 'Clothing',
              description: 'Clothing items',
              color_code: '#8B5CF6',
              display_order: 0,
              is_active: true,
              created_at: { toDate: () => new Date('2023-01-01') },
              updated_at: { toDate: () => new Date('2023-01-01') }
            })
          });
          callback({
            id: 'cat-2',
            data: () => ({
              name: 'Food',
              description: 'Food items',
              color_code: '#F59E0B',
              display_order: 1,
              is_active: true,
              created_at: { toDate: () => new Date('2023-01-01') },
              updated_at: { toDate: () => new Date('2023-01-01') }
            })
          });
        })
      };

      mockCollection.where.mockReturnThis();
      mockCollection.orderBy.mockReturnThis();
      mockCollection.get.mockResolvedValue(mockSnapshot);

      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      expect(response.body.categories).toHaveLength(2);
      expect(response.body.categories[0].name).toBe('Clothing');
      expect(response.body.categories[1].name).toBe('Food');
    });

    it('should initialize default categories when database is empty', async () => {
      const emptySnapshot = {
        forEach: jest.fn()
      };

      mockCollection.where.mockReturnThis();
      mockCollection.orderBy.mockReturnThis();
      mockCollection.get.mockResolvedValue(emptySnapshot);
      mockCollection.add.mockResolvedValueOnce({ id: 'cat-1' })
        .mockResolvedValueOnce({ id: 'cat-2' })
        .mockResolvedValueOnce({ id: 'cat-3' })
        .mockResolvedValueOnce({ id: 'cat-4' });

      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      expect(response.body.categories).toHaveLength(4);
      expect(response.body.categories[0].name).toBe('Clothing');
      expect(response.body.categories[1].name).toBe('Hygiene');
      expect(response.body.categories[2].name).toBe('Food');
      expect(response.body.categories[3].name).toBe('Medical');
      expect(mockCollection.add).toHaveBeenCalledTimes(4);
    });

    it('should get all categories including inactive when is_active=all', async () => {
      const mockSnapshot = {
        forEach: jest.fn((callback) => {
          callback({
            id: 'cat-1',
            data: () => ({
              name: 'Active Category',
              is_active: true,
              created_at: { toDate: () => new Date('2023-01-01') },
              updated_at: { toDate: () => new Date('2023-01-01') }
            })
          });
          callback({
            id: 'cat-2',
            data: () => ({
              name: 'Inactive Category',
              is_active: false,
              created_at: { toDate: () => new Date('2023-01-01') },
              updated_at: { toDate: () => new Date('2023-01-01') }
            })
          });
        })
      };

      mockCollection.where.mockReturnThis();
      mockCollection.orderBy.mockReturnThis();
      mockCollection.get.mockResolvedValue(mockSnapshot);

      const response = await request(app)
        .get('/api/categories?is_active=all')
        .expect(200);

      expect(response.body.categories).toHaveLength(2);
    });

    it('should handle database errors', async () => {
      mockCollection.where.mockReturnThis();
      mockCollection.orderBy.mockReturnThis();
      mockCollection.get.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/categories')
        .expect(500);

      expect(response.body.error).toBe('Failed to fetch categories');
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('should update category successfully', async () => {
      const mockCategoryDoc = {
        exists: true,
        id: 'cat-123',
        data: () => ({
          name: 'Old Name',
          description: 'Old description',
          color_code: '#000000',
          display_order: 0,
          is_active: true,
          created_by: 'test-uid',
          created_at: { toDate: () => new Date('2023-01-01') },
          updated_at: { toDate: () => new Date('2023-01-01') }
        })
      };

      const updatedMockCategoryDoc = {
        exists: true,
        id: 'cat-123',
        data: () => ({
          name: 'Updated Name',
          description: 'Updated description',
          color_code: '#FF0000',
          display_order: 5,
          is_active: true,
          created_by: 'test-uid',
          created_at: { toDate: () => new Date('2023-01-01') },
          updated_at: { toDate: () => new Date('2023-01-02') }
        })
      };

      const mockSnapshot = {
        empty: true,
        docs: []
      };

      mockDoc.get.mockResolvedValueOnce(mockCategoryDoc).mockResolvedValueOnce(updatedMockCategoryDoc);
      mockDoc.update.mockResolvedValue();
      mockCollection.where.mockReturnThis();
      mockCollection.get.mockResolvedValue(mockSnapshot);

      const updateData = {
        name: 'Updated Name',
        description: 'Updated description',
        color_code: '#FF0000',
        display_order: 5
      };

      const response = await request(app)
        .put('/api/categories/cat-123')
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Category updated successfully');
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.description).toBe('Updated description');
      expect(response.body.data.color_code).toBe('#FF0000');
      expect(response.body.data.display_order).toBe(5);
    });

    it('should update partial fields only', async () => {
      const mockCategoryDoc = {
        exists: true,
        id: 'cat-123',
        data: () => ({
          name: 'Category Name',
          description: 'Old description',
          color_code: '#000000',
          display_order: 0,
          is_active: true,
          created_by: 'test-uid',
          created_at: { toDate: () => new Date('2023-01-01') },
          updated_at: { toDate: () => new Date('2023-01-01') }
        })
      };

      const updatedMockCategoryDoc = {
        exists: true,
        id: 'cat-123',
        data: () => ({
          name: 'Category Name',
          description: 'New description',
          color_code: '#000000',
          display_order: 0,
          is_active: true,
          created_by: 'test-uid',
          created_at: { toDate: () => new Date('2023-01-01') },
          updated_at: { toDate: () => new Date('2023-01-02') }
        })
      };

      mockDoc.get.mockResolvedValueOnce(mockCategoryDoc).mockResolvedValueOnce(updatedMockCategoryDoc);
      mockDoc.update.mockResolvedValue();

      const updateData = {
        description: 'New description'
      };

      const response = await request(app)
        .put('/api/categories/cat-123')
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Category updated successfully');
      expect(response.body.data.description).toBe('New description');
    });

    it('should return 404 when category not found', async () => {
      const mockCategoryDoc = {
        exists: false
      };

      mockDoc.get.mockResolvedValue(mockCategoryDoc);

      const updateData = {
        name: 'Updated Name'
      };

      const response = await request(app)
        .put('/api/categories/nonexistent-id')
        .send(updateData)
        .expect(404);

      expect(response.body.error).toBe('Category not found');
    });

    it('should return 400 when updating to duplicate category name', async () => {
      const mockCategoryDoc = {
        exists: true,
        id: 'cat-123',
        data: () => ({
          name: 'Old Name',
          is_active: true,
          created_by: 'test-uid'
        })
      };

      const mockSnapshot = {
        empty: false,
        docs: [{ id: 'different-cat-id' }]
      };

      mockDoc.get.mockResolvedValue(mockCategoryDoc);
      mockCollection.where.mockReturnThis();
      mockCollection.get.mockResolvedValue(mockSnapshot);

      const updateData = {
        name: 'Existing Category'
      };

      const response = await request(app)
        .put('/api/categories/cat-123')
        .send(updateData)
        .expect(400);

      expect(response.body.error).toBe('A category with this name already exists');
    });

    it('should allow updating to same name (same category)', async () => {
      const mockCategoryDoc = {
        exists: true,
        id: 'cat-123',
        data: () => ({
          name: 'Same Name',
          description: 'Old description',
          is_active: true,
          created_by: 'test-uid',
          created_at: { toDate: () => new Date('2023-01-01') },
          updated_at: { toDate: () => new Date('2023-01-01') }
        })
      };

      const updatedMockCategoryDoc = {
        exists: true,
        id: 'cat-123',
        data: () => ({
          name: 'Same Name',
          description: 'New description',
          is_active: true,
          created_by: 'test-uid',
          created_at: { toDate: () => new Date('2023-01-01') },
          updated_at: { toDate: () => new Date('2023-01-02') }
        })
      };

      const mockSnapshot = {
        empty: false,
        docs: [{ id: 'cat-123' }]
      };

      mockDoc.get.mockResolvedValueOnce(mockCategoryDoc).mockResolvedValueOnce(updatedMockCategoryDoc);
      mockDoc.update.mockResolvedValue();
      mockCollection.where.mockReturnThis();
      mockCollection.get.mockResolvedValue(mockSnapshot);

      const updateData = {
        name: 'Same Name',
        description: 'New description'
      };

      const response = await request(app)
        .put('/api/categories/cat-123')
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Category updated successfully');
      expect(response.body.data.description).toBe('New description');
    });

    it('should update is_active field', async () => {
      const mockCategoryDoc = {
        exists: true,
        id: 'cat-123',
        data: () => ({
          name: 'Category',
          is_active: true,
          created_by: 'test-uid',
          created_at: { toDate: () => new Date('2023-01-01') },
          updated_at: { toDate: () => new Date('2023-01-01') }
        })
      };

      const updatedMockCategoryDoc = {
        exists: true,
        id: 'cat-123',
        data: () => ({
          name: 'Category',
          is_active: false,
          created_by: 'test-uid',
          created_at: { toDate: () => new Date('2023-01-01') },
          updated_at: { toDate: () => new Date('2023-01-02') }
        })
      };

      mockDoc.get.mockResolvedValueOnce(mockCategoryDoc).mockResolvedValueOnce(updatedMockCategoryDoc);
      mockDoc.update.mockResolvedValue();

      const updateData = {
        is_active: false
      };

      const response = await request(app)
        .put('/api/categories/cat-123')
        .send(updateData)
        .expect(200);

      expect(response.body.data.is_active).toBe(false);
    });

    it('should return 403 when trying to update another user\'s category', async () => {
      const mockCategoryDoc = {
        exists: true,
        data: () => ({
          name: 'Category',
          created_by: 'different-user-uid',
          is_active: true
        })
      };

      mockDoc.get.mockResolvedValue(mockCategoryDoc);

      const updateData = {
        name: 'Updated Name'
      };

      const response = await request(app)
        .put('/api/categories/cat-123')
        .send(updateData)
        .expect(403);

      expect(response.body.error).toBe('Forbidden: You can only update your own categories');
    });

    it('should handle database errors', async () => {
      mockDoc.get.mockRejectedValue(new Error('Database error'));

      const updateData = {
        name: 'Updated Name'
      };

      const response = await request(app)
        .put('/api/categories/cat-123')
        .send(updateData)
        .expect(500);

      expect(response.body.error).toBe('Failed to update category');
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should soft delete category successfully', async () => {
      const mockCategoryDoc = {
        exists: true,
        id: 'cat-123',
        data: () => ({
          name: 'Category to Delete',
          is_active: true,
          created_by: 'test-uid'
        })
      };

      mockDoc.get.mockResolvedValue(mockCategoryDoc);
      mockDoc.update.mockResolvedValue();

      const response = await request(app)
        .delete('/api/categories/cat-123')
        .expect(200);

      expect(response.body.message).toBe('Category deactivated successfully');
      expect(response.body.id).toBe('cat-123');
      expect(mockDoc.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: false
        })
      );
    });

    it('should return 403 when trying to delete another user\'s category', async () => {
      const mockCategoryDoc = {
        exists: true,
        data: () => ({
          name: 'Category',
          created_by: 'different-user-uid',
          is_active: true
        })
      };

      mockDoc.get.mockResolvedValue(mockCategoryDoc);

      const response = await request(app)
        .delete('/api/categories/cat-123')
        .expect(403);

      expect(response.body.error).toBe('Forbidden: You can only delete your own categories');
    });

    it('should return 404 when category not found', async () => {
      const mockCategoryDoc = {
        exists: false
      };

      mockDoc.get.mockResolvedValue(mockCategoryDoc);

      const response = await request(app)
        .delete('/api/categories/nonexistent-id')
        .expect(404);

      expect(response.body.error).toBe('Category not found');
    });

    it('should handle database errors', async () => {
      mockDoc.get.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/api/categories/cat-123')
        .expect(500);

      expect(response.body.error).toBe('Failed to deactivate category');
    });
  });
});
