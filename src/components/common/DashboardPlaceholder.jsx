export default function DashboardPlaceholder({ title }) {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <div style={{
        width: 56,
        height: 56,
        margin: '0 auto 16px',
        borderRadius: 14,
        border: '1px solid var(--neutral-100)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 800,
        color: 'var(--neutral-400)',
        letterSpacing: '0.12em'
      }}>SOON</div>
      <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{title}</h2>
      <p style={{ color: 'var(--neutral-400)', fontSize: 14 }}>This section is under development. Coming soon!</p>
    </div>
  );
}
