import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import api from '../utils/api';
import { formatCurrency, CATEGORY_COLORS, CATEGORY_ICONS } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import TransactionModal from '../components/TransactionModal';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import MonthYearPicker from '../components/MonthYearPicker';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [prevSummary, setPrevSummary] = useState(null);
  const [recentTxns, setRecentTxns] = useState([]);
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const prevPeriod = (() => {
    const d = new Date(year, month, 1);
    d.setMonth(d.getMonth() - 1);
    return { month: d.getMonth(), year: d.getFullYear() };
  })();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, prevSumRes, txnRes, budRes] = await Promise.all([
        api.get(`/transactions/analytics/summary?month=${month}&year=${year}`),
        api.get(`/transactions/analytics/summary?month=${prevPeriod.month}&year=${prevPeriod.year}`),
        api.get('/transactions', { params: { limit: 5, month, year } }),
        api.get(`/budgets?month=${month}&year=${year}`)
      ]);
      setSummary(sumRes.data);
      setPrevSummary(prevSumRes.data);
      setRecentTxns(txnRes.data.transactions);
      setBudget(budRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [month, year]);

  const pieData = summary ? Object.entries(summary.categoryBreakdown).map(([name, value]) => ({ name, value })) : [];
  const currency = user?.currency || '₹';

  const budgetPercent = budget?.budget?.totalBudget > 0 ? Math.min((budget.totalSpent / budget.budget.totalBudget) * 100, 100) : 0;
  const budgetExceeded = budget?.budget && budget.totalSpent > budget.budget.totalBudget;

  if (loading) return <Loader label="Loading dashboard..." />;

  const pctChange = (current, prev) => {
    const c = Number(current || 0);
    const p = Number(prev || 0);
    if (p === 0) return null;
    return ((c - p) / p) * 100;
  };
  const expenseMoM = pctChange(summary?.totalExpense, prevSummary?.totalExpense);
  const incomeMoM = pctChange(summary?.totalIncome, prevSummary?.totalIncome);
  const savingsMoM = pctChange(summary?.balance, prevSummary?.balance);
  const fmtPct = (v) => (v === null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`);

  return (
    <div>
      <div className="page-header" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div>
          <h2>Good {now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋</h2>
          <p>{now.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <MonthYearPicker month={month} year={year} onMonthChange={setMonth} onYearChange={setYear} />
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Transaction</button>
        </div>
      </div>

      {/* Budget Warning */}
      {budget?.budget && (
        <div className={`budget-warning ${budgetExceeded ? 'budget-exceeded' : ''}`}>
          <span style={{fontSize:'1.2rem'}}>{budgetExceeded ? '🚨' : budgetPercent >= 80 ? '⚠️' : '📊'}</span>
          {budgetExceeded
            ? `Budget exceeded! You've spent ${formatCurrency(budget.totalSpent, currency)} of your ${formatCurrency(budget.budget.totalBudget, currency)} budget.`
            : budgetPercent >= 80
            ? `Heads up! You've used ${budgetPercent.toFixed(0)}% of your ${now.toLocaleString('default', {month:'long'})} budget.`
            : `${now.toLocaleString('default', {month:'long'})} budget: ${formatCurrency(budget.totalSpent, currency)} of ${formatCurrency(budget.budget.totalBudget, currency)} used (${budgetPercent.toFixed(0)}%)`
          }
        </div>
      )}

      {/* Stat Cards */}
      <div className="stat-cards">
        <div className="card stat-card income">
          <div className="stat-icon">↑</div>
          <div className="stat-label">Total Income</div>
          <div className="stat-amount">{formatCurrency(summary?.totalIncome || 0, currency)}</div>
          <div className="stat-sub">{fmtPct(incomeMoM)} vs last month</div>
        </div>
        <div className="card stat-card expense">
          <div className="stat-icon">↓</div>
          <div className="stat-label">Total Expenses</div>
          <div className="stat-amount">{formatCurrency(summary?.totalExpense || 0, currency)}</div>
          <div className="stat-sub">{fmtPct(expenseMoM)} vs last month</div>
        </div>
        <div className="card stat-card balance">
          <div className="stat-icon">◎</div>
          <div className="stat-label">Net Balance</div>
          <div className="stat-amount">{formatCurrency(summary?.balance || 0, currency)}</div>
          <div className="stat-sub">
            {(summary?.balance || 0) >= 0 ? 'Savings trend ' : 'Trend '}
            {fmtPct(savingsMoM)} vs last month
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="card">
          <div className="chart-title">Spending by Category</div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v, currency)} contentStyle={{background:'#111118',border:'1px solid #1e1e2e',borderRadius:'8px',color:'#f0f0ff'}} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:'0.78rem'}} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon="📊"
              title="No expense data yet"
              description="Add an expense transaction to see category insights."
              actionLabel="Add transaction"
              onAction={() => setShowModal(true)}
            />
          )}
        </div>

        <div className="card">
          <div className="chart-title">6-Month Trend</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={summary?.trendData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis dataKey="month" tick={{fill:'#8888aa',fontSize:11}} />
              <YAxis tick={{fill:'#8888aa',fontSize:11}} tickFormatter={v => `${currency}${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatCurrency(v, currency)} contentStyle={{background:'#111118',border:'1px solid #1e1e2e',borderRadius:'8px',color:'#f0f0ff'}} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:'0.78rem'}} />
              <Line type="monotone" dataKey="income" stroke="#22d3a0" strokeWidth={2} dot={{fill:'#22d3a0',strokeWidth:0,r:4}} activeDot={{r:6}} />
              <Line type="monotone" dataKey="expense" stroke="#ff5e7e" strokeWidth={2} dot={{fill:'#ff5e7e',strokeWidth:0,r:4}} activeDot={{r:6}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
          <div className="chart-title" style={{margin:0}}>Recent Transactions</div>
          <a href="/transactions" style={{fontSize:'0.82rem',color:'var(--accent-light)',textDecoration:'none'}}>View all →</a>
        </div>
        {recentTxns.length === 0 ? (
          <EmptyState
            icon="💸"
            title="No transactions yet"
            description="Add your first transaction to get started."
            actionLabel="Add transaction"
            onAction={() => setShowModal(true)}
          />
        ) : (
          <div className="txn-list">
            {recentTxns.map(t => (
              <div key={t._id} className="txn-item">
                <div className={`txn-icon ${t.type}`}>{CATEGORY_ICONS[t.category] || '💰'}</div>
                <div className="txn-info">
                  <div className="txn-desc">{t.description}</div>
                  <div className="txn-meta">{t.category} · {new Date(t.date).toLocaleDateString('en-IN', {day:'2-digit',month:'short'})}</div>
                </div>
                <div className={`txn-amount ${t.type}`}>{t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && <TransactionModal onClose={() => setShowModal(false)} onSave={() => { fetchData(); setShowModal(false); }} />}
    </div>
  );
}
