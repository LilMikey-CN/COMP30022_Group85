const { admin } = require('../config/firebase');
const { DEFAULT_CATEGORIES } = require('../constants/categories');

const FieldValue = admin.firestore.FieldValue;
const Timestamp = admin.firestore.Timestamp;

const CATEGORY_DOC_ID = 'options';

const getCategoryDocRef = (db, uid) =>
  db.collection('users').doc(uid).collection('categories').doc(CATEGORY_DOC_ID);

// Lazily create the users/{uid}/categories/options document with default entries.
const ensureCategoryOptionsDoc = async (db, uid) => {
  const docRef = getCategoryDocRef(db, uid);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(docRef);

    if (snapshot.exists) {
      return;
    }

    const timestamp = FieldValue.serverTimestamp();
    const now = Timestamp.now();
    const categories = DEFAULT_CATEGORIES.map((category) => ({
      ...category,
      created_at: now,
      updated_at: now
    }));

    transaction.set(docRef, {
      categories,
      created_at: timestamp,
      updated_at: timestamp
    });
  });
};

// Read the category options document, ensuring it exists first.
const readCategoriesDoc = async (db, uid) => {
  await ensureCategoryOptionsDoc(db, uid);
  const docRef = getCategoryDocRef(db, uid);
  const snapshot = await docRef.get();
  const data = snapshot.data() || {};
  const categories = Array.isArray(data.categories) ? data.categories : [];
  return {
    snapshot,
    categories
  };
};

const findCategoryById = (categories, categoryId) =>
  categories.find((category) => category.id === categoryId);

// Convert raw Firestore timestamps into plain JS Date objects for the API response.
const formatCategory = (category) => {
  if (!category) {
    return category;
  }

  const serializeDate = (value) => {
    if (!value) {
      return null;
    }
    if (typeof value.toDate === 'function') {
      return value.toDate();
    }
    return value;
  };

  return {
    ...category,
    created_at: serializeDate(category.created_at),
    updated_at: serializeDate(category.updated_at)
  };
};

module.exports = {
  CATEGORY_DOC_ID,
  getCategoryDocRef,
  ensureCategoryOptionsDoc,
  readCategoriesDoc,
  findCategoryById,
  formatCategory
};
