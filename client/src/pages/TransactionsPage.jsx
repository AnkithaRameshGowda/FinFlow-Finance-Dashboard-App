import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { formatCurrency, formatDate, CATEGORY_ICONS, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import TransactionModal from '../components/TransactionModal';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import MonthYearPicker from '../components/MonthYearPicker';
import toast from 'react-hot-toast';
import { downloadTransactionsCsv } from '../utils/csv';

export default function TransactionsPage() {
  const { user } = useAuth();
  const currency = user?.currency || '₹';
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [filters, setFilters] = useState({ type: '', category: '', startDate: '', endDate: '', search: '' });

  const allCategories = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      params.month = month;
      params.year = year;
      if (filters.type) params.type = filters.type;
      if (filters.category) params.category = filters.category;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.search) params.search = filters.search;

      const res = await api.get('/transactions', { params });
      setTransactions(res.data.transactions);
      setTotal(res.data.total);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [filters, month, year]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      toast.success('Transaction deleted');
      fetchTransactions();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  const handleEdit = (t) => { setEditData(t); setShowModal(true); };

  const clearFilters = () => setFilters({ type: '', category: '', startDate: '', endDate: '', search: '' });

  const hasFilters = Object.values(filters).some(v => v !== '');

  return (
    <div>
      <div className="transactions-header">
        <div className="page-header" style={{margin:0}}>
          <h2>Transactions</h2>
          <p>{total} records found</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn btn-ghost"
            onClick={() => {
              if (!transactions.length) return toast.error('No transactions to export');
              downloadTransactionsCsv(transactions, { filename: `transactions_${year}-${String(month + 1).padStart(2, '0')}.csv` });
              toast.success('CSV exported');
            }}
          >
            ⭳ Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => { setEditData(null); setShowModal(true); }}>+ Add Transaction</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{marginBottom:'20px',padding:'16px 20px'}}>
        <div className="filters-bar">
          <MonthYearPicker month={month} year={year} onMonthChange={setMonth} onYearChange={setYear} />
          <input
            className="form-input search-input"
            placeholder="🔍 Search transactions..."
            value={filters.search}
            onChange={e => setFilters(f => ({...f, search: e.target.value}))}
            style={{maxWidth:'260px'}}
          />
          <select className="form-select" style={{width:'130px'}} value={filters.type} onChange={e => setFilters(f => ({...f, type: e.target.value, category: ''}))}>
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select className="form-select" style={{width:'170px'}} value={filters.category} onChange={e => setFilters(f => ({...f, category: e.target.value}))}>
            <option value="">All Categories</option>
            {(filters.type === 'income' ? INCOME_CATEGORIES : filters.type === 'expense' ? EXPENSE_CATEGORIES : allCategories).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
            <input className="form-input" type="date" style={{width:'150px'}} value={filters.startDate} onChange={e => setFilters(f => ({...f, startDate: e.target.value}))} />
            <span style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>to</span>
            <input className="form-input" type="date" style={{width:'150px'}} value={filters.endDate} onChange={e => setFilters(f => ({...f, endDate: e.target.value}))} />
          </div>
          {hasFilters && <button className="btn btn-ghost btn-sm" onClick={clearFilters}>✕ Clear</button>}
        </div>
      </div>

      {loading ? (
        <Loader label="Loading transactions..." />
      ) : transactions.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="💸"
            title="No transactions found"
            description={hasFilters ? 'Try adjusting your filters' : 'Add your first transaction to get started'}
            actionLabel={hasFilters ? 'Clear filters' : 'Add transaction'}
            onAction={() => (hasFilters ? clearFilters() : setShowModal(true))}
          />
        </div>
      ) : (
        <div className="card">
          <div className="txn-list">
            {transactions.map(t => (
              <div key={t._id} className="txn-item">
                <div className={`txn-icon ${t.type}`}>{CATEGORY_ICONS[t.category] || '💰'}</div>
                <div className="txn-info">
                  <div className="txn-desc">{t.description}</div>
                  <div className="txn-meta">
                    <span className={`badge badge-${t.type}`}>{t.category}</span>
                    <span style={{marginLeft:'8px'}}>{formatDate(t.date)}</span>
                    {t.notes && <span style={{marginLeft:'8px',fontStyle:'italic'}}>· {t.notes}</span>}
                    {t.recurringMonthly && <span style={{marginLeft:'8px',color:'var(--accent-light)'}}>· Recurring</span>}
                  </div>
                </div>
                <div className={`txn-amount ${t.type}`}>{t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}</div>
                <div className="txn-actions">
                  <button className="icon-btn" title="Edit" onClick={() => handleEdit(t)}>✏️</button>
                  <button className="icon-btn delete" title="Delete" onClick={() => handleDelete(t._id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <TransactionModal
          editData={editData}
          onClose={() => { setShowModal(false); setEditData(null); }}
          onSave={() => { fetchTransactions(); setShowModal(false); setEditData(null); }}
        />
      )}
    </div>
  );
}
