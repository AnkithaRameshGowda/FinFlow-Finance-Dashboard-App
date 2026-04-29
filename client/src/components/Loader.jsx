import React, { useEffect, useState } from 'react';

export default function Loader({ label = 'Loading...', delayMs = 250 }) {
  const [show, setShow] = useState(delayMs === 0);

  useEffect(() => {
    if (delayMs === 0) return;
    const t = setTimeout(() => setShow(true), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);

  if (!show) return null;

  return (
    <div className="loading" role="status" aria-live="polite">
      <div className="spinner" />
      {label}
    </div>
  );
}

