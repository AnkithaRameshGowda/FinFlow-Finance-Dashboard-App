import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function TransactionModal({ onClose, onSave, editData }) {
  const [form, setForm] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    recurringMonthly: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setForm({
        type: editData.type,
        amount: editData.amount,
        category: editData.category,
        description: editData.description,
        date: new Date(editData.date).toISOString().split('T')[0],
        notes: editData.notes || '',
        recurringMonthly: Boolean(editData.recurringMonthly)
      });
    }
  }, [editData]);

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({
      ...f,
      [name]: value,
      ...(name === 'type' ? { category: '' } : {})
    }));
  };

  const handleCheck = (e) => {
    const { name, checked } = e.target;
    setForm(f => ({ ...f, [name]: checked }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.category) { setError('Please select a category'); return; }
    if (!form.amount || Number(form.amount) <= 0) { setError('Enter a valid amount'); return; }
    setLoading(true);
    try {
      if (editData) {
        await api.put(`/transactions/${editData._id}`, form);
        toast.success('Transaction updated');
      } else {
        await api.post('/transactions', form);
        toast.success('Transaction added');
      }
      onSave();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save transaction';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{editData ? 'Edit Transaction' : 'Add Transaction'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="type-toggle">
          <button type="button" className={`type-btn expense ${form.type === 'expense' ? 'active' : ''}`} onClick={() => setForm(f => ({...f, type:'expense', category:''}))}>↓ Expense</button>
          <button type="button" className={`type-btn income ${form.type === 'income' ? 'active' : ''}`} onClick={() => setForm(f => ({...f, type:'income', category:''}))}>↑ Income</button>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input className="form-input" name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="form-input" name="date" type="date" value={form.date} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" name="category" value={form.category} onChange={handleChange} required>
              <option value="">Select category...</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input className="form-input" name="description" placeholder="What was this for?" value={form.description} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <textarea className="form-input" name="notes" placeholder="Any additional details..." value={form.notes} onChange={handleChange} rows={2} />
          </div>

          <div className="form-group" style={{ marginTop: 4 }}>
            <label className="form-label" style={{ marginBottom: 10 }}>Recurring</label>
            <label className="check-row">
              <input type="checkbox" name="recurringMonthly" checked={form.recurringMonthly} onChange={handleCheck} />
              <span>Mark as recurring (monthly)</span>
            </label>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : editData ? 'Update' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
