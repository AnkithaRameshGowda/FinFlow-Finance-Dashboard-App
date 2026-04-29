const mongoose = require('mongoose');

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Business', 'Gift', 'Other Income'];
const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Health', 'Education', 'Bills & Utilities', 'Rent', 'Travel', 'Other Expense'];

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  amount: { type: Number, required: true, min: 0.01 },
  category: { type: String, required: true },
  description: { type: String, required: true, trim: true },
  date: { type: Date, required: true, default: Date.now },
  notes: { type: String, trim: true, default: '' },
  recurringMonthly: { type: Boolean, default: false },
  recurringParent: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
module.exports.INCOME_CATEGORIES = INCOME_CATEGORIES;
module.exports.EXPENSE_CATEGORIES = EXPENSE_CATEGORIES;
