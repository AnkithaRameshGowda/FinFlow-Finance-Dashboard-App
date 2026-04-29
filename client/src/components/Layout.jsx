import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const HomeIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const TxnIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22V12M12 12L8 16m4-4l4 4M12 2v4M4.93 4.93l2.83 2.83M17.24 7.76l2.83-2.83M2 12h4m12 0h4M6.34 17.66l-2.83 2.83M19.07 19.07l-2.83-2.83"/></svg>;
const ChartIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const BudgetIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>;
const LogoutIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const SunIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>;
const MoonIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/></svg>;

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/login'); };
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>FinFlow</h1>
          <span>Personal Finance</span>
        </div>
        <nav>
          <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <HomeIcon /><span>Dashboard</span>
          </NavLink>
          <NavLink to="/transactions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <TxnIcon /><span>Transactions</span>
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <ChartIcon /><span>Analytics</span>
          </NavLink>
          <NavLink to="/budget" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <BudgetIcon /><span>Budget</span>
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className="theme-toggle-icon">{theme === 'dark' ? <SunIcon /> : <MoonIcon />}</span>
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <div className="user-info">
            <div className="user-avatar">{initials}</div>
            <div>
              <div className="user-name">{user?.name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogoutIcon /><span>Log out</span>
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
