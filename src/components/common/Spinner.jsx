export default function Spinner({ label = 'Loading...' }) {
  return (
    <div style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          border: '3px solid var(--neutral-100)',
          borderTopColor: 'var(--neutral-900)',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <div style={{ color: 'var(--neutral-400)', fontSize: 14 }}>{label}</div>
    </div>
  );
}
