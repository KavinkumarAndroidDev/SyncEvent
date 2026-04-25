const ICONS = {
  bell: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  send: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  calendar: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  chart: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  ticket: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>
    </svg>
  ),
};

export default function OrgEmptyState({ icon = 'bell', title = 'No data yet.', subtitle, action }) {
  return (
    <div style={{
      textAlign: 'center', padding: 60, color: 'var(--neutral-400)',
      background: 'var(--neutral-50)', borderRadius: 16,
    }}>
      <div style={{ marginBottom: 12, opacity: 0.4 }}>
        {ICONS[icon] || ICONS.bell}
      </div>
      <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, marginTop: 6 }}>{subtitle}</div>}
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}
