const express = require('express');
const { db } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(verifyToken);

const getOwnedCareItem = async (careItemId, uid) => {
  const careItemRef = db.collection('care_items').doc(careItemId);
  const doc = await careItemRef.get();

  if (!doc.exists) {
    const error = new Error('Care item not found');
    error.status = 404;
    throw error;
  }

  const data = doc.data();
  if (data.created_by !== uid) {
    const error = new Error('Forbidden: Care item does not belong to you');
    error.status = 403;
    throw error;
  }

  return { doc, data, ref: careItemRef };
};

// CREATE - Add new care item
router.post('/', async (req, res) => {
  try {
    const {
      name,
      estimated_unit_cost,
      quantity_per_purchase = 1,
      quantity_unit,
      start_date,
      end_date,
      category_id
    } = req.body;

    // Verify category exists and belongs to user if category_id is provided
    if (category_id) {
      const categoryDoc = await db.collection('categories').doc(category_id).get();
      if (!categoryDoc.exists) {
        return res.status(404).json({ error: 'Category not found' });
      }

      // Verify category belongs to user
      if (categoryDoc.data().created_by !== req.user.uid) {
        return res.status(403).json({ error: 'Forbidden: Category does not belong to you' });
      }
    }

    const careItemData = {
      name: name || '',
      estimated_unit_cost: estimated_unit_cost !== undefined ? parseFloat(estimated_unit_cost) : 0,
      quantity_per_purchase: quantity_per_purchase !== undefined ? parseInt(quantity_per_purchase) : 1,
      quantity_unit: quantity_unit || '',
      start_date: start_date ? new Date(start_date) : new Date(),
      end_date: end_date ? new Date(end_date) : null,
      is_active: true,
      category_id: category_id || null,
      created_by: req.user.uid,
      deactivated_at: null,
      created_at: new Date(),
      updated_at: new Date()
    };

    const docRef = await db.collection('care_items').add(careItemData);

    res.status(201).json({
      message: 'Care item created successfully',
      id: docRef.id,
      data: { id: docRef.id, ...careItemData }
    });
  } catch (error) {
    console.error('Error creating care item:', error);
    res.status(500).json({ error: 'Failed to create care item' });
  }
});

// READ - Get all care items with optional filtering
router.get('/', async (req, res) => {
  try {
    const { category_id, is_active = 'true', limit = 50, offset = 0 } = req.query;

    const snapshot = await db.collection('care_items')
      .where('created_by', '==', req.user.uid)
      .get();

    let careItems = [];

    snapshot.forEach(doc => {
      careItems.push({
        id: doc.id,
        ...doc.data(),
        start_date: doc.data().start_date?.toDate(),
        end_date: doc.data().end_date?.toDate(),
        created_at: doc.data().created_at?.toDate(),
        updated_at: doc.data().updated_at?.toDate(),
        deactivated_at: doc.data().deactivated_at?.toDate()
      });
    });

    if (is_active !== 'all') {
      const activeFilter = is_active === 'true';
      careItems = careItems.filter(item => item.is_active === activeFilter);
    }

    if (category_id) {
      careItems = careItems.filter(item => item.category_id === category_id);
    }

    careItems.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (dateA !== dateB) {
        return dateB - dateA;
      }
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

    const start = parseInt(offset);
    const end = start + parseInt(limit);
    const paginatedItems = careItems.slice(start, end);

    res.json({
      care_items: paginatedItems,
      count: paginatedItems.length,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching care items:', error);
    res.status(500).json({ error: 'Failed to fetch care items' });
  }
});

// READ - Get specific care item by ID
router.get('/:id', async (req, res) => {
  try {
    const { doc, data } = await getOwnedCareItem(req.params.id, req.user.uid);
    res.json({
      id: doc.id,
      ...data,
      start_date: data.start_date?.toDate(),
      end_date: data.end_date?.toDate(),
      created_at: data.created_at?.toDate(),
      updated_at: data.updated_at?.toDate(),
      deactivated_at: data.deactivated_at?.toDate()
    });
  } catch (error) {
    console.error('Error fetching care item:', error);
    const status = error.status || 500;
    res.status(status).json({
      error: status === 500 ? 'Failed to fetch care item' : error.message
    });
  }
});

// UPDATE - Update care item
router.put('/:id', async (req, res) => {
  try {
    const { ref: careItemRef } = await getOwnedCareItem(req.params.id, req.user.uid);

    const {
      name,
      estimated_unit_cost,
      quantity_per_purchase,
      quantity_unit,
      start_date,
      end_date,
      category_id,
      is_active
    } = req.body;

    // If category_id is being updated, verify it exists and belongs to user
    if (category_id !== undefined && category_id !== null) {
      const categoryDoc = await db.collection('categories').doc(category_id).get();
      if (!categoryDoc.exists) {
        return res.status(404).json({ error: 'Category not found' });
      }

      // Verify category belongs to user
      if (categoryDoc.data().created_by !== req.user.uid) {
        return res.status(403).json({ error: 'Forbidden: Category does not belong to you' });
      }
    }

    const updateData = {
      updated_at: new Date()
    };

    // Update all provided fields
    if (name !== undefined) updateData.name = name;
    if (estimated_unit_cost !== undefined) updateData.estimated_unit_cost = parseFloat(estimated_unit_cost);
    if (quantity_per_purchase !== undefined) updateData.quantity_per_purchase = parseInt(quantity_per_purchase);
    if (quantity_unit !== undefined) updateData.quantity_unit = quantity_unit;
    if (start_date !== undefined) updateData.start_date = new Date(start_date);
    if (end_date !== undefined) updateData.end_date = end_date ? new Date(end_date) : null;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (is_active !== undefined) updateData.is_active = is_active;

    await careItemRef.update(updateData);

    // Get updated document
    const updatedDoc = await careItemRef.get();
    const data = updatedDoc.data();

    res.json({
      message: 'Care item updated successfully',
      data: {
        id: updatedDoc.id,
        ...data,
        start_date: data.start_date?.toDate(),
        end_date: data.end_date?.toDate(),
        created_at: data.created_at?.toDate(),
        updated_at: data.updated_at?.toDate(),
        deactivated_at: data.deactivated_at?.toDate()
      }
    });
  } catch (error) {
    console.error('Error updating care item:', error);
    const status = error.status || 500;
    res.status(status).json({
      error: status === 500 ? 'Failed to update care item' : error.message
    });
  }
});

// SOFT DELETE - Deactivate care item
router.delete('/:id', async (req, res) => {
  try {
    const { ref: careItemRef } = await getOwnedCareItem(req.params.id, req.user.uid);

    const updateData = {
      is_active: false,
      deactivated_at: new Date(),
      updated_at: new Date()
    };

    await careItemRef.update(updateData);

    res.json({
      message: 'Care item deactivated successfully',
      id: req.params.id
    });
  } catch (error) {
    console.error('Error deactivating care item:', error);
    const status = error.status || 500;
    res.status(status).json({
      error: status === 500 ? 'Failed to deactivate care item' : error.message
    });
  }
});

// REACTIVATE - Reactivate a soft-deleted care item
router.patch('/:id/reactivate', async (req, res) => {
  try {
    const { ref: careItemRef } = await getOwnedCareItem(req.params.id, req.user.uid);

    const updateData = {
      is_active: true,
      deactivated_at: null,
      updated_at: new Date()
    };

    await careItemRef.update(updateData);

    res.json({
      message: 'Care item reactivated successfully',
      id: req.params.id
    });
  } catch (error) {
    console.error('Error reactivating care item:', error);
    const status = error.status || 500;
    res.status(status).json({
      error: status === 500 ? 'Failed to reactivate care item' : error.message
    });
  }
});

module.exports = router;
