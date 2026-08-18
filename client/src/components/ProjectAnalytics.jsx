import React from "react";

function BreakdownChart({ title, items, colorClass }) {
  const total = items.reduce((sum, item) => sum + item.count, 0) || 1;

  return (
    <div className="analytics-card">
      <h4>{title}</h4>
      {items.length === 0 ? (
        <p className="analytics-empty">No tasks yet.</p>
      ) : (
        <ul className="analytics-list">
          {items.map((item) => (
            <li key={item.label}>
              <div className="analytics-label-row">
                <span>{item.label}</span>
                <strong>{item.count}</strong>
              </div>
              <div className="analytics-bar-track">
                <div className={`analytics-bar ${colorClass}`} style={{ width: `${(item.count / total) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ProjectAnalytics({ analytics }) {
  if (!analytics) return <p>Loading analytics…</p>;

  return (
    <div className="project-analytics">
      <div className="analytics-summary">
        <span className="analytics-total">{analytics.totalTasks}</span>
        <span>total tasks</span>
      </div>
      <div className="analytics-grid">
        <BreakdownChart title="By status" items={analytics.byStatus} colorClass="status" />
        <BreakdownChart title="By type" items={analytics.byType} colorClass="type" />
        <BreakdownChart title="By priority" items={analytics.byPriority} colorClass="priority" />
      </div>
    </div>
  );
}
