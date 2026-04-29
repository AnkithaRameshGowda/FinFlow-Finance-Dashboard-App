import React, { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar
} from 'recharts';
import api from '../utils/api';
import { formatCurrency, CATEGORY_COLORS } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import MonthYearPicker from '../components/MonthYearPicker';
import toast from 'react-hot-toast';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const currency = user?.currency || '₹';
  const [summary, setSummary] = useState(null);
  const [prevSummary, setPrevSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setLoading(true);
    const d = new Date(year, month, 1);
    d.setMonth(d.getMonth() - 1);
    const pm = d.getMonth();
    const py = d.getFullYear();

    Promise.all([
      api.get(`/transactions/analytics/summary?month=${month}&year=${year}`),
      api.get(`/transactions/analytics/summary?month=${pm}&year=${py}`)
    ])
      .then(([cur, prev]) => { setSummary(cur.data); setPrevSummary(prev.data); })
      .catch((e) => { console.error(e); toast.error('Failed to load analytics'); })
      .finally(() => setLoading(false));
  }, [month, year]);

  const pieData = summary ? Object.entries(summary.categoryBreakdown).map(([name, value]) => ({ name, value })) : [];
  const savingsRate = summary?.totalIncome > 0 ? (((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100).toFixed(1) : 0;

  const pctChange = (current, prev) => {
    const c = Number(current || 0);
    const p = Number(prev || 0);
    if (p === 0) return null;
    return ((c - p) / p) * 100;
  };
  const fmtPct = (v) => (v === null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`);
  const expenseMoM = pctChange(summary?.totalExpense, prevSummary?.totalExpense);
  const incomeMoM = pctChange(summary?.totalIncome, prevSummary?.totalIncome);
  const savingsMoM = pctChange(summary?.balance, prevSummary?.balance);

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'28px',flexWrap:'wrap',gap:'12px'}}>
        <div className="page-header" style={{margin:0}}>
          <h2>Analytics</h2>
          <p>Visual breakdown of your finances</p>
        </div>
        <MonthYearPicker month={month} year={year} onMonthChange={setMonth} onYearChange={setYear} />
      </div>

      {/* Quick Stats */}
      <div className="stat-cards" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
        <div className="card stat-card income">
          <div className="stat-label">Income</div>
          <div className="stat-amount" style={{fontSize:'1.4rem'}}>{formatCurrency(summary?.totalIncome || 0, currency)}</div>
          <div className="stat-sub">{fmtPct(incomeMoM)} vs last month</div>
        </div>
        <div className="card stat-card expense">
          <div className="stat-label">Expenses</div>
          <div className="stat-amount" style={{fontSize:'1.4rem'}}>{formatCurrency(summary?.totalExpense || 0, currency)}</div>
          <div className="stat-sub">{fmtPct(expenseMoM)} vs last month</div>
        </div>
        <div className="card stat-card balance">
          <div className="stat-label">Saved</div>
          <div className="stat-amount" style={{fontSize:'1.4rem'}}>{formatCurrency(summary?.balance || 0, currency)}</div>
          <div className="stat-sub">{fmtPct(savingsMoM)} vs last month</div>
        </div>
        <div className="card">
          <div style={{height:'2px',background:'var(--blue)',marginBottom:'12px',marginTop:'-24px',marginLeft:'-24px',marginRight:'-24px',borderRadius:'4px 4px 0 0'}}></div>
          <div className="stat-label">Savings Rate</div>
          <div className="stat-amount" style={{fontSize:'1.4rem',color:'var(--blue)'}}>{savingsRate}%</div>
        </div>
      </div>

      {loading ? (
        <Loader label="Loading analytics..." />
      ) : (
        <div className="analytics-grid">
          {/* Pie Chart */}
          <div className="card">
            <div className="chart-title">Expense Breakdown</div>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={120} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v, currency)} contentStyle={{background:'#111118',border:'1px solid #1e1e2e',borderRadius:'8px',color:'#f0f0ff'}} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:'0.78rem'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon="📊"
                title="No expense data for this period"
                description="Add expense transactions to see breakdowns."
              />
            )}
          </div>

          {/* Bar Chart */}
          <div className="card">
            <div className="chart-title">Category-wise Spending</div>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pieData} layout="vertical" margin={{left:20}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" horizontal={false} />
                  <XAxis type="number" tick={{fill:'#8888aa',fontSize:11}} tickFormatter={v => `${currency}${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{fill:'#8888aa',fontSize:11}} width={110} />
                  <Tooltip formatter={(v) => formatCurrency(v, currency)} contentStyle={{background:'#111118',border:'1px solid #1e1e2e',borderRadius:'8px',color:'#f0f0ff'}} />
                  <Bar dataKey="value" radius={[0,6,6,0]}>
                    {pieData.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon="📊"
                title="No data for this period"
                description="Try a different month/year or add transactions."
              />
            )}
          </div>

          {/* Line Chart - 6 months */}
          <div className="card" style={{gridColumn:'1/-1'}}>
            <div className="chart-title">Income vs Expense — 6 Month Trend</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={summary?.trendData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis dataKey="month" tick={{fill:'#8888aa',fontSize:12}} />
                <YAxis tick={{fill:'#8888aa',fontSize:12}} tickFormatter={v => `${currency}${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatCurrency(v, currency)} contentStyle={{background:'#111118',border:'1px solid #1e1e2e',borderRadius:'8px',color:'#f0f0ff'}} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:'0.82rem'}} />
                <Line type="monotone" dataKey="income" name="Income" stroke="#22d3a0" strokeWidth={2.5} dot={{fill:'#22d3a0',r:5,strokeWidth:0}} activeDot={{r:7}} />
                <Line type="monotone" dataKey="expense" name="Expense" stroke="#ff5e7e" strokeWidth={2.5} dot={{fill:'#ff5e7e',r:5,strokeWidth:0}} activeDot={{r:7}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
