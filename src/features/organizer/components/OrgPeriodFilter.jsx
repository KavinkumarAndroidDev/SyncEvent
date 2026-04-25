const PERIOD_LABELS = { '7D': '7 Days', '1M': '30 Days', '1Y': '1 Year', 'ALL': 'All Time' };

export { PERIOD_LABELS };

export default function OrgPeriodFilter({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
      {Object.entries(PERIOD_LABELS).map(([key, label]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          style={{
            padding: '8px 18px', borderRadius: 20, border: 'none', fontSize: 13,
            fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
            background: value === key ? 'var(--primary)' : 'var(--neutral-100)',
            color: value === key ? 'white' : 'var(--neutral-600)',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
