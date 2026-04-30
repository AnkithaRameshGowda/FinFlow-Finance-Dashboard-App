const express = require('express');
const Transaction = require('../models/Transaction');
const protect = require('../middleware/auth');
const router = express.Router();

router.use(protect);

function getMonthRange(year, month) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function isSameMonthYear(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

async function ensureRecurringForCurrentMonth(userId, month, year) {
  const now = new Date();
  const target = new Date(year, month, 1);
  if (!isSameMonthYear(now, target)) return;

  const { start, end } = getMonthRange(year, month);

  // "Templates" are recurring txns without a recurringParent
  const templates = await Transaction.find({
    user: userId,
    recurringMonthly: true,
    recurringParent: null,
  }).sort({ createdAt: 1 });

  if (!templates.length) return;

  const lastDay = new Date(year, month + 1, 0).getDate();

  for (const tpl of templates) {
    const exists = await Transaction.findOne({
  user: userId,
  recurringParent: tpl._id,
  date: { $gte: start, $lte: end },
});

    if (exists) continue;

    const day = Math.min(new Date(tpl.date).getDate(), lastDay);
    const date = new Date(year, month, day, 12, 0, 0, 0);

    await Transaction.create({
      user: userId,
      type: tpl.type,
      amount: tpl.amount,
      category: tpl.category,
      description: tpl.description,
      notes: tpl.notes,
      date,
      recurringMonthly: true,
      recurringParent: tpl._id,
    });
  }
}

// GET /api/transactions
router.get('/', async (req, res) => {
  try {
    const { type, category, startDate, endDate, search, month, year, page = 1, limit = 50 } = req.query;
    const query = { user: req.user._id };

    const m = month !== undefined ? Number(month) : undefined;
    const y = year !== undefined ? Number(year) : undefined;

    if (Number.isFinite(m) && Number.isFinite(y)) {
      await ensureRecurringForCurrentMonth(req.user._id, m, y);
    }

    if (type) query.type = type;
    if (category) query.category = category;
    if (search) query.description = { $regex: search, $options: 'i' };

    const hasMonthYear = Number.isFinite(m) && Number.isFinite(y);
    const hasStartEnd = Boolean(startDate || endDate);

    if (hasMonthYear || hasStartEnd) {
      query.date = {};

      if (hasMonthYear) {
        const { start, end } = getMonthRange(y, m);
        query.date.$gte = start;
        query.date.$lte = end;
      }

      if (startDate) {
        const s = new Date(startDate);
        query.date.$gte = query.date.$gte ? new Date(Math.max(query.date.$gte.getTime(), s.getTime())) : s;
      }
      if (endDate) {
        const e = new Date(endDate + 'T23:59:59.999Z');
        query.date.$lte = query.date.$lte ? new Date(Math.min(query.date.$lte.getTime(), e.getTime())) : e;
      }
    }

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ transactions, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/transactions
router.post('/', async (req, res) => {
  try {
    const { type, amount, category, description, date, notes, recurringMonthly } = req.body;
    if (!type || !amount || !category || !description) {
      return res.status(400).json({ message: 'type, amount, category, description are required' });
    }
    const transaction = await Transaction.create({
      user: req.user._id,
      type,
      amount,
      category,
      description,
      date: date || new Date(),
      notes,
      recurringMonthly: Boolean(recurringMonthly),
      recurringParent: null,
    });
    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/transactions/:id
router.put('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    const { type, amount, category, description, date, notes, recurringMonthly } = req.body;
    Object.assign(transaction, { type, amount, category, description, date, notes });
    if (recurringMonthly !== undefined) transaction.recurringMonthly = Boolean(recurringMonthly);
    // If a user marks this transaction as a recurring "template", ensure it becomes the parent
    if (transaction.recurringMonthly && !transaction.recurringParent) {
      transaction.recurringParent = null;
    }
    await transaction.save();
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/transactions/analytics/summary
router.get('/analytics/summary', async (req, res) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const m = month !== undefined ? Number(month) : now.getMonth();
    const y = year !== undefined ? Number(year) : now.getFullYear();
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0, 23, 59, 59, 999);

    await ensureRecurringForCurrentMonth(req.user._id, m, y);

    const transactions = await Transaction.find({ user: req.user._id, date: { $gte: start, $lte: end } });

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    // Category breakdown
    const categoryBreakdown = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
    });

    // Monthly trend (last 6 months)
    const trendData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(y, m - i, 1);
      const dEnd = new Date(y, m - i + 1, 0, 23, 59, 59, 999);
      const monthTxns = await Transaction.find({ user: req.user._id, date: { $gte: d, $lte: dEnd } });
      trendData.push({
        month: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
        income: monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      });
    }

    res.json({ totalIncome, totalExpense, balance: totalIncome - totalExpense, categoryBreakdown, trendData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
