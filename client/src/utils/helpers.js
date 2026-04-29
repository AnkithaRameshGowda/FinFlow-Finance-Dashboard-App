export const formatCurrency = (amount, currency = '₹') => {
  return `${currency}${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const CATEGORY_ICONS = {
  'Salary': '💼', 'Freelance': '💻', 'Investment': '📈', 'Business': '🏢', 'Gift': '🎁', 'Other Income': '💰',
  'Food': '🍽️', 'Transport': '🚗', 'Entertainment': '🎬', 'Shopping': '🛍️',
  'Health': '🏥', 'Education': '📚', 'Bills & Utilities': '⚡', 'Rent': '🏠',
  'Travel': '✈️', 'Other Expense': '💸'
};

export const CATEGORY_COLORS = [
  '#7c6aff', '#22d3a0', '#ff5e7e', '#fbbf24', '#38bdf8', '#a78bfa',
  '#34d399', '#f87171', '#60a5fa', '#fb923c', '#a3e635', '#e879f9'
];

export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Business', 'Gift', 'Other Income'];
export const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Health', 'Education', 'Bills & Utilities', 'Rent', 'Travel', 'Other Expense'];
