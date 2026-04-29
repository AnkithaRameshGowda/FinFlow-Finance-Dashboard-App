import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { formatCurrency, EXPENSE_CATEGORIES } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import MonthYearPicker from '../components/MonthYearPicker';
import toast from 'react-hot-toast';

export default function BudgetPage() {
  const { user } = useAuth();
  const currency = user?.currency || '₹';
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [totalBudget, setTotalBudget] = useState('');
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [msg, setMsg] = useState('');
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const fetchBudget = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/budgets?month=${month}&year=${year}`);
      setBudgetData(res.data);
      if (res.data.budget) {
        setTotalBudget(res.data.budget.totalBudget);
        const catObj = {};
        res.data.budget.categoryBudgets?.forEach(cb => { catObj[cb.category] = cb.limit; });
        setCategoryBudgets(catObj);
      } else {
        setTotalBudget('');
        setCategoryBudgets({});
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBudget(); }, [month, year]);

  const handleSave = async () => {
    if (!totalBudget || Number(totalBudget) <= 0) { setMsg('Please enter a valid budget amount'); return; }
    setSaving(true); setMsg('');
    try {
      const categoryBudgetsArr = Object.entries(categoryBudgets)
        .filter(([, v]) => v && Number(v) > 0)
        .map(([category, limit]) => ({ category, limit: Number(limit) }));

      await api.post('/budgets', { month, year, totalBudget: Number(totalBudget), categoryBudgets: categoryBudgetsArr });
      setMsg('Budget saved successfully!');
      toast.success('Budget saved');
      fetchBudget();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to save budget');
      toast.error(err.response?.data?.message || 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  const totalSpent = budgetData?.totalSpent || 0;
  const budget = budgetData?.budget;
  const percent = budget?.totalBudget > 0 ? (totalSpent / budget.totalBudget) * 100 : 0;
  const exceeded = budget && totalSpent > budget.totalBudget;

  const getBarClass = (p) => p >= 100 ? 'over' : p >= 80 ? 'warn' : '';

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'28px',flexWrap:'wrap',gap:'12px'}}>
        <div className="page-header" style={{margin:0}}>
          <h2>Budget Planner</h2>
          <p>Set and track your monthly spending limits</p>
        </div>
        <MonthYearPicker month={month} year={year} onMonthChange={setMonth} onYearChange={setYear} />
      </div>

      {loading ? (
        <Loader label="Loading budget..." />
      ) : (
        <div className="budget-grid">
          {/* Left: Set Budget */}
          <div>
            <div className="card">
              <div className="chart-title">Set Monthly Budget</div>
              {msg && <div className={msg.includes('success') ? 'success-msg' : 'error-msg'}>{msg}</div>}
              <div className="form-group">
                <label className="form-label">Total Monthly Budget ({currency})</label>
                <input className="form-input" type="number" min="0" placeholder="e.g. 30000" value={totalBudget} onChange={e => setTotalBudget(e.target.value)} />
              </div>
              <div style={{marginBottom:'16px'}}>
                <div className="form-label" style={{marginBottom:'12px'}}>Category Limits (optional)</div>
                {EXPENSE_CATEGORIES.map(cat => (
                  <div key={cat} style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'10px'}}>
                    <span style={{flex:'1',fontSize:'0.85rem',color:'var(--text-secondary)'}}>{cat}</span>
                    <input
                      className="form-input"
                      type="number" min="0" placeholder="Limit"
                      style={{width:'130px'}}
                      value={categoryBudgets[cat] || ''}
                      onChange={e => setCategoryBudgets(p => ({...p, [cat]: e.target.value}))}
                    />
                  </div>
                ))}
              </div>
              <button className="btn btn-primary btn-block" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : '💾 Save Budget'}
              </button>
            </div>
          </div>

          {/* Right: Progress */}
          <div>
            {budget ? (
              <div className="card">
                <div className="chart-title">Budget Overview — {months[month]} {year}</div>

                {exceeded && (
                  <div className="budget-warning budget-exceeded">
                    🚨 Budget exceeded by {formatCurrency(totalSpent - budget.totalBudget, currency)}!
                  </div>
                )}
                {!exceeded && percent >= 80 && (
                  <div className="budget-warning">
                    ⚠️ You've used {percent.toFixed(0)}% of your budget. Slow down!
                  </div>
                )}

                {/* Summary */}
                <div className="budget-summary">
                  <div className="budget-stat">
                    <div className="budget-stat-amount" style={{color:'var(--accent-light)'}}>{formatCurrency(budget.totalBudget, currency)}</div>
                    <div className="budget-stat-label">Total Budget</div>
                  </div>
                  <div className="budget-stat">
                    <div className="budget-stat-amount" style={{color: exceeded ? 'var(--red)' : 'var(--text-primary)'}}>{formatCurrency(totalSpent, currency)}</div>
                    <div className="budget-stat-label">Spent</div>
                  </div>
                  <div className="budget-stat">
                    <div className="budget-stat-amount" style={{color: exceeded ? 'var(--red)' : 'var(--green)'}}>{formatCurrency(Math.max(budget.totalBudget - totalSpent, 0), currency)}</div>
                    <div className="budget-stat-label">Remaining</div>
                  </div>
                </div>

                {/* Overall bar */}
                <div className="budget-bar-wrap">
                  <div className="budget-bar-header">
                    <span>Overall Spending</span><span>{Math.min(percent,100).toFixed(0)}%</span>
                  </div>
                  <div className="budget-bar-track">
                    <div className={`budget-bar-fill ${getBarClass(percent)}`} style={{width:`${Math.min(percent,100)}%`}}></div>
                  </div>
                </div>

                {/* Category bars */}
                {budget.categoryBudgets?.length > 0 && (
                  <div style={{marginTop:'20px'}}>
                    <div style={{fontSize:'0.82rem',fontWeight:'600',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'14px'}}>By Category</div>
                    {budget.categoryBudgets.map(cb => {
                      const spent = budgetData.categorySpent[cb.category] || 0;
                      const cp = cb.limit > 0 ? (spent / cb.limit) * 100 : 0;
                      return (
                        <div key={cb.category} className="budget-bar-wrap">
                          <div className="budget-bar-header">
                            <span>{cb.category}</span>
                            <span>{formatCurrency(spent, currency)} / {formatCurrency(cb.limit, currency)}</span>
                          </div>
                          <div className="budget-bar-track">
                            <div className={`budget-bar-fill ${getBarClass(cp)}`} style={{width:`${Math.min(cp,100)}%`}}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="card">
                <EmptyState
                  icon="💰"
                  title={`No budget set for ${months[month]} ${year}`}
                  description="Set a budget on the left to start tracking."
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
