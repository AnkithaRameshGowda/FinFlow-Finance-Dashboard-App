export function downloadTransactionsCsv(transactions, { filename = 'transactions.csv' } = {}) {
  const headers = ['date', 'category', 'type', 'amount', 'note'];

  const escape = (v) => {
    const s = `${v ?? ''}`;
    if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
    return s;
  };

  const rows = transactions.map(t => ([
    t?.date ? new Date(t.date).toISOString().slice(0, 10) : '',
    t?.category || '',
    t?.type || '',
    typeof t?.amount === 'number' ? t.amount : Number(t?.amount || 0),
    t?.notes || '',
  ]));

  const csv = [headers, ...rows].map(r => r.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

