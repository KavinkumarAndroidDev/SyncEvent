export default function OrganizerOverview() {
  const stats = [
    { label: 'My Events', value: '—', code: 'EV', color: '#8b5cf6' },
    { label: 'Total Registrations', value: '—', code: 'RG', color: '#3b82f6' },
    { label: 'Total Revenue', value: '₹—', code: 'RV', color: '#10b981' },
    { label: 'Upcoming Events', value: '—', code: 'UP', color: '#f59e0b' },
  ];

  return (
    <div style={{ padding: '40px' }}>
      <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Organizer Dashboard</h1>
      <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginBottom: 32 }}>Manage your events and track performance.</p>

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
        }}>NEXT</div>
        <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Ready to create your first event?</h3>
        <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginBottom: 20 }}>Use the sidebar to create events, manage tickets, and view registrations.</p>
        <a href="/organizer/create-event" style={{
          display: 'inline-block', background: 'var(--primary)', color: 'white',
          padding: '10px 24px', borderRadius: 20, textDecoration: 'none',
          fontSize: 14, fontWeight: 600
        }}>Create Event →</a>
      </div>
    </div>
  );
}
