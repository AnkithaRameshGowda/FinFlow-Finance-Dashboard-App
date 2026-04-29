import React, { useMemo } from 'react';

export default function MonthYearPicker({ month, year, onMonthChange, onYearChange, yearRange = 5 }) {
  const months = useMemo(
    () => ['January','February','March','April','May','June','July','August','September','October','November','December'],
    []
  );

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    const start = now - (yearRange - 1);
    return Array.from({ length: yearRange + 2 }, (_, i) => start + i);
  }, [yearRange]);

  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      <select className="form-select" style={{ width: '140px' }} value={month} onChange={e => onMonthChange(Number(e.target.value))}>
        {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
      </select>
      <select className="form-select" style={{ width: '110px' }} value={year} onChange={e => onYearChange(Number(e.target.value))}>
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}

