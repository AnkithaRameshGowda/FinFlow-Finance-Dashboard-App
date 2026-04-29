const express = require('express');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const protect = require('../middleware/auth');
const router = express.Router();

router.use(protect);

// GET /api/budgets?month=&year=
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const month = req.query.month !== undefined ? Number(req.query.month) : now.getMonth();
    const year = req.query.year !== undefined ? Number(req.query.year) : now.getFullYear();

    let budget = await Budget.findOne({ user: req.user._id, month, year });

    // Calculate actual spending this month
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    const expenses = await Transaction.find({ user: req.user._id, type: 'expense', date: { $gte: start, $lte: end } });
    const totalSpent = expenses.reduce((s, t) => s + t.amount, 0);

    const categorySpent = {};
    expenses.forEach(t => { categorySpent[t.category] = (categorySpent[t.category] || 0) + t.amount; });

    res.json({ budget, totalSpent, categorySpent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/budgets (create or update)
router.post('/', async (req, res) => {
  try {
    const { month, year, totalBudget, categoryBudgets } = req.body;
    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id, month, year },
      { totalBudget, categoryBudgets },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(budget);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
