const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { ensureUserDocumentInitialized } = require('../utils/userProfile');
const {
  db,
  auth,
  generateTaskExecution,
  startOfDay,
  startOfYear,
  endOfYear,
  addDays,
  toDate,
  getCareTasksCollection,
  getTaskExecutionsCollection
} = require('./careTasks/shared');
const { registerTaskRoutes } = require('./careTasks/taskRoutes');
const { registerExecutionRoutes } = require('./careTasks/executionRoutes');
const { registerBudgetRoutes } = require('./careTasks/budgetRoutes');

const router = express.Router();

router.use(verifyToken);

router.use(async (req, res, next) => {
  try {
    await ensureUserDocumentInitialized(db, auth, req.user.uid, req.user);
    next();
  } catch (error) {
    console.error('Failed to initialize user document:', error);
    res.status(500).json({ error: 'Failed to initialize user data' });
  }
});

registerTaskRoutes(router);
registerExecutionRoutes(router);
registerBudgetRoutes(router);

module.exports = router;
module.exports._internal = {
  generateTaskExecution,
  startOfDay,
  startOfYear,
  endOfYear,
  addDays,
  toDate,
  getCareTasksCollection,
  getTaskExecutionsCollection
};
