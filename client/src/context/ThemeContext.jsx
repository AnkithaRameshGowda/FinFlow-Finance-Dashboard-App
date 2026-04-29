import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'finflow_theme';

function applyThemeToDom(theme) {
  const root = document.documentElement;
  if (theme === 'light') root.classList.add('theme-light');
  else root.classList.remove('theme-light');
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    applyThemeToDom(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo(() => {
    const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));
    return { theme, setTheme, toggleTheme };
  }, [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

