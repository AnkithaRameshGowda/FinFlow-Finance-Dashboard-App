const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: Number, required: true },  // 0-11
  year: { type: Number, required: true },
  totalBudget: { type: Number, required: true, min: 0 },
  categoryBudgets: [{
    category: { type: String },
    limit: { type: Number, min: 0 }
  }]
}, { timestamps: true });

budgetSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
