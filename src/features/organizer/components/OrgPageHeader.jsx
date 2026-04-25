export default function OrgPageHeader({ title, subtitle, actions }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
      <div>
        <h2 className="view-title">{title}</h2>
        {subtitle && (
          <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>{subtitle}</p>
        )}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>{actions}</div>}
    </div>
  );
}
