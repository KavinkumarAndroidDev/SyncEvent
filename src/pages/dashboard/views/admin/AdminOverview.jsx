export default function AdminOverview() {
  const stats = [
    { label: 'Total Users', value: '—', code: 'US', color: '#3b82f6' },
    { label: 'Total Events', value: '—', code: 'EV', color: '#8b5cf6' },
    { label: 'Pending Approvals', value: '10', code: 'PA', color: '#f59e0b' },
    { label: 'Total Revenue', value: '₹—', code: 'RV', color: '#10b981' },
  ];

  return (
    <div style={{ padding: '40px' }}>
      <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Admin Overview</h1>
      <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginBottom: 32 }}>Welcome back! Here's what's happening on SyncEvent.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20, marginBottom: 40 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid var(--neutral-100)', borderRadius: 16, padding: 24 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `${s.color}14`,
              color: s.color,
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.08em'
            }}>{s.code}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--neutral-400)', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', border: '1px solid var(--neutral-100)', borderRadius: 16, padding: 32, textAlign: 'center' }}>
        <div style={{
          width: 56,
          height: 56,
          margin: '0 auto 12px',
          borderRadius: 14,
          border: '1px solid var(--neutral-100)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 800,
          color: 'var(--neutral-400)',
          letterSpacing: '0.12em'
        }}>INFO</div>
        <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>More features coming soon</h3>
        <p style={{ color: 'var(--neutral-400)', fontSize: 14 }}>Use the sidebar to navigate to specific management sections.</p>
      </div>
    </div>
  );
}
