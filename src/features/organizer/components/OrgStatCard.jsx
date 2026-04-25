export default function OrgStatCard({ label, value, sub, color = 'var(--primary)', style = {} }) {
  return (
    <div
      className="admin-stat-card"
      style={{ borderTop: `4px solid ${color}`, ...style }}
    >
      <div className="admin-stat-label">{label}</div>
      <div className="admin-stat-value" style={{ color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}
