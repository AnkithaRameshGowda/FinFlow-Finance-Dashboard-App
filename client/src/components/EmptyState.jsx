import React from 'react';

export default function EmptyState({
  icon = '✨',
  title = 'Nothing here yet',
  description = 'Once you add data, it’ll show up here.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" aria-hidden="true">{icon}</div>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {actionLabel && onAction ? (
        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={onAction}>{actionLabel}</button>
        </div>
      ) : null}
    </div>
  );
}

