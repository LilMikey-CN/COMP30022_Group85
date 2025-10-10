const { requireNumber } = require('../../utils/careTaskValidation');
const {
  db,
  getCareTaskRef,
  getTaskExecutionsCollection,
  getBudgetTransfersCollection,
  calculateNetSpendFromExecutions
} = require('./shared');

const registerBudgetRoutes = (router) => {
  router.post('/transfer-budget', async (req, res) => {
    try {
      const { fromTaskId, toTaskId, amount } = req.body || {};

      if (!fromTaskId || !toTaskId) {
        return res.status(400).json({ error: 'fromTaskId and toTaskId are required' });
      }

      if (fromTaskId === toTaskId) {
        return res.status(400).json({ error: 'fromTaskId and toTaskId must be different' });
      }

      let transferAmount;
      try {
        transferAmount = requireNumber(amount, 'amount', { min: 0 });
      } catch (error) {
        const status = error.status || 400;
        return res.status(status).json({ error: error.message });
      }

      if (transferAmount <= 0) {
        return res.status(400).json({ error: 'amount must be greater than 0' });
      }

      const fromTaskRef = getCareTaskRef(req.user.uid, fromTaskId);
      const toTaskRef = getCareTaskRef(req.user.uid, toTaskId);
      const transferRef = getBudgetTransfersCollection(req.user.uid).doc();

      const transferResult = await db.runTransaction(async (transaction) => {
        const [fromTaskDoc, toTaskDoc] = await Promise.all([
          transaction.get(fromTaskRef),
          transaction.get(toTaskRef)
        ]);

        if (!fromTaskDoc.exists) {
          const error = new Error('Source care task not found');
          error.status = 404;
          throw error;
        }

        if (!toTaskDoc.exists) {
          const error = new Error('Destination care task not found');
          error.status = 404;
          throw error;
        }

        const fromTaskData = fromTaskDoc.data() || {};
        const toTaskData = toTaskDoc.data() || {};

        const executionsSnapshot = await transaction.get(
          getTaskExecutionsCollection(req.user.uid, fromTaskId)
        );
        const executionDocs = executionsSnapshot?.docs ?? executionsSnapshot ?? [];
        const netSpend = calculateNetSpendFromExecutions(executionDocs);

        const rawSourceBudget = Number(fromTaskData.yearly_budget ?? 0);
        const sourceBudget = Number.isFinite(rawSourceBudget) ? rawSourceBudget : 0;

        const availableBudget = sourceBudget - netSpend;
        const EPSILON = 0.000001;
        if (availableBudget + EPSILON < transferAmount) {
          const error = new Error('Insufficient available budget to transfer');
          error.status = 400;
          throw error;
        }

        const rawDestinationBudget = Number(toTaskData.yearly_budget ?? 0);
        const destinationBudget = Number.isFinite(rawDestinationBudget) ? rawDestinationBudget : 0;

        const now = new Date();
        const updatedSourceBudget = sourceBudget - transferAmount;
        const updatedDestinationBudget = destinationBudget + transferAmount;

        transaction.update(fromTaskRef, {
          yearly_budget: updatedSourceBudget,
          updated_at: now
        });

        transaction.update(toTaskRef, {
          yearly_budget: updatedDestinationBudget,
          updated_at: now
        });

        transaction.set(transferRef, {
          from_task_id: fromTaskId,
          to_task_id: toTaskId,
          amount: transferAmount,
          performed_by_uid: req.user.uid,
          created_at: now,
          source_snapshot: {
            yearly_budget_before: sourceBudget,
            net_spend_to_date: netSpend,
            available_before_transfer: Math.max(availableBudget, 0)
          }
        });

        return {
          transferId: transferRef.id,
          updatedSourceBudget,
          updatedDestinationBudget,
          netSpend
        };
      });

      res.status(201).json({
        message: 'Budget transferred successfully',
        transfer_id: transferResult.transferId,
        data: {
          fromTaskId,
          toTaskId,
          amount: transferAmount,
          net_spend_before_transfer: transferResult.netSpend,
          source_budget_after_transfer: transferResult.updatedSourceBudget,
          destination_budget_after_transfer: transferResult.updatedDestinationBudget
        }
      });
    } catch (error) {
      console.error('Error transferring care task budget:', error);
      const status = error.status || 500;
      res.status(status).json({
        error: status === 500 ? 'Failed to transfer budget' : error.message
      });
    }
  });
};

module.exports = {
  registerBudgetRoutes
};
