const express = require('express');
const crypto = require('crypto');
const { db, auth, admin } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');
const {
  ensureCategoryOptionsDoc,
  readCategoriesDoc,
  findCategoryById,
  formatCategory,
  getCategoryDocRef
} = require('../utils/categories');
const { DEFAULT_CATEGORY_COLOR } = require('../constants/categories');
const { ensureUserDocumentInitialized } = require('../utils/userProfile');

const router = express.Router();
const FieldValue = admin.firestore.FieldValue;
const Timestamp = admin.firestore.Timestamp;

const slugify = (value) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)+/g, '');

const generateCategoryId = (name) => {
  const base = slugify(name);
  const suffix = crypto.randomUUID().split('-')[0];
  const trimmed = base.replace(/-+/g, '-').replace(/(^-|-$)/g, '');
  return trimmed ? `${trimmed}-${suffix}` : suffix;
};

const validateColorCode = (value) => {
  if (!value) return false;
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
};

router.use(verifyToken);

// Make sure the user document and category options exist before handling requests.
router.use(async (req, res, next) => {
  try {
    await ensureUserDocumentInitialized(db, auth, req.user.uid, req.user);
    await ensureCategoryOptionsDoc(db, req.user.uid);
    next();
  } catch (error) {
    console.error('Failed to initialize user categories:', error);
    res.status(500).json({ error: 'Failed to initialize category data' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { categories } = await readCategoriesDoc(db, req.user.uid);
    res.json({
      categories: categories.map(formatCategory)
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, color_code, description = '' } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'name is required' });
    }

    if (color_code && !validateColorCode(color_code)) {
      return res.status(400).json({ error: 'color_code must be a valid hex color (e.g. #FFFFFF)' });
    }

    const categoryDocRef = getCategoryDocRef(db, req.user.uid);

    const result = await db.runTransaction(async (transaction) => {
      // Snapshot the existing array and detect duplicate names inside the transaction for consistency.
      const doc = await transaction.get(categoryDocRef);
      const existingCategories = doc.exists && Array.isArray(doc.data().categories)
        ? doc.data().categories
        : [];

      const normalizedName = name.trim().toLowerCase();
      const hasDuplicateName = existingCategories.some(
        (category) => (category.name || '').trim().toLowerCase() === normalizedName
      );

      if (hasDuplicateName) {
        const error = new Error('Category name already exists');
        error.status = 409;
        throw error;
      }

      const generatedId = generateCategoryId(name);
      const now = Timestamp.now();
      const newCategory = {
        id: generatedId,
        name: name.trim(),
        description: description || '',
        color_code: color_code || DEFAULT_CATEGORY_COLOR,
        created_at: now,
        updated_at: now
      };

      const updatedCategories = [...existingCategories, newCategory];

      transaction.set(
        categoryDocRef,
        {
          categories: updatedCategories,
          updated_at: FieldValue.serverTimestamp()
        },
        { merge: true }
      );

      return newCategory;
    });

    res.status(201).json({
      message: 'Category created successfully',
      data: formatCategory(result)
    });
  } catch (error) {
    console.error('Error creating category:', error);
    const status = error.status || 500;
    res.status(status).json({ error: status === 500 ? 'Failed to create category' : error.message });
  }
});

router.patch('/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, color_code, description } = req.body;

    if (color_code !== undefined && color_code !== null && !validateColorCode(color_code)) {
      return res.status(400).json({ error: 'color_code must be a valid hex color (e.g. #FFFFFF)' });
    }

    const categoryDocRef = getCategoryDocRef(db, req.user.uid);

    const updatedCategory = await db.runTransaction(async (transaction) => {
      // Wrap updates in a transaction so duplicate checks and writes stay atomic.
      const doc = await transaction.get(categoryDocRef);
      const existingCategories = doc.exists && Array.isArray(doc.data().categories)
        ? doc.data().categories
        : [];

      const currentCategory = findCategoryById(existingCategories, categoryId);

      if (!currentCategory) {
        const error = new Error('Category not found');
        error.status = 404;
        throw error;
      }

      if (name !== undefined) {
        if (typeof name !== 'string' || name.trim() === '') {
          const error = new Error('name must be a non-empty string');
          error.status = 400;
          throw error;
        }

        const normalizedName = name.trim().toLowerCase();
        const duplicateName = existingCategories.some(
          (category) =>
            category.id !== categoryId &&
            (category.name || '').trim().toLowerCase() === normalizedName
        );

        if (duplicateName) {
          const error = new Error('Category name already exists');
          error.status = 409;
          throw error;
        }
      }

      const now = Timestamp.now();
      const replacement = {
        ...currentCategory,
        name: name !== undefined ? name.trim() : currentCategory.name,
        description: description !== undefined ? description : currentCategory.description,
        color_code: color_code !== undefined ? color_code : currentCategory.color_code,
        updated_at: now
      };

      const updatedCategories = existingCategories.map((category) =>
        category.id === categoryId ? replacement : category
      );

      transaction.set(
        categoryDocRef,
        {
          categories: updatedCategories,
          updated_at: FieldValue.serverTimestamp()
        },
        { merge: true }
      );

      return replacement;
    });

    res.json({
      message: 'Category updated successfully',
      data: formatCategory(updatedCategory)
    });
  } catch (error) {
    console.error('Error updating category:', error);
    const status = error.status || 500;
    res.status(status).json({ error: status === 500 ? 'Failed to update category' : error.message });
  }
});

router.delete('/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const userRef = db.collection('users').doc(req.user.uid);
    const tasksCollection = userRef.collection('care_tasks');

    const taskSnapshot = await tasksCollection
      .where('category_id', '==', categoryId)
      .limit(1)
      .get();

    if (!taskSnapshot.empty) {
      return res.status(400).json({
        error: 'Cannot delete category while tasks are assigned to it'
      });
    }

    const categoryDocRef = getCategoryDocRef(db, req.user.uid);

    const wasDeleted = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(categoryDocRef);
      const existingCategories = doc.exists && Array.isArray(doc.data().categories)
        ? doc.data().categories
        : [];

      const hasCategory = existingCategories.some((category) => category.id === categoryId);

      if (!hasCategory) {
        const error = new Error('Category not found');
        error.status = 404;
        throw error;
      }

      const updatedCategories = existingCategories.filter(
        (category) => category.id !== categoryId
      );

      transaction.set(
        categoryDocRef,
        {
          categories: updatedCategories,
          updated_at: FieldValue.serverTimestamp()
        },
        { merge: true }
      );

      return true;
    });

    if (wasDeleted) {
      return res.json({
        message: 'Category deleted successfully',
        id: categoryId
      });
    }

    res.status(404).json({ error: 'Category not found' });
  } catch (error) {
    console.error('Error deleting category:', error);
    const status = error.status || 500;
    res.status(status).json({ error: status === 500 ? 'Failed to delete category' : error.message });
  }
});

module.exports = router;
