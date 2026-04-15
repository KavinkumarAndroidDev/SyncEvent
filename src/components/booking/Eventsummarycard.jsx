export default function EventSummaryCard({ event }) {
    const fmt = (dt) => dt ? new Date(dt).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'TBA';

    return (
        <div style={{ border: '1px solid var(--neutral-100)', borderRadius: 12, padding: 16, display: 'flex', gap: 14, marginBottom: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <img
                src={`https://placehold.co/100x100/111827/ffffff?text=${encodeURIComponent(event.title?.[0] || 'E')}`}
                style={{ width: 90, height: 90, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                alt=""
            />
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{event.title}</div>
                {event.category && <div style={{ fontSize: 13, color: 'var(--neutral-400)', marginBottom: 4 }}>{event.category.name}</div>}
                <div style={{ fontSize: 13, color: 'var(--neutral-400)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    {fmt(event.startTime)}
                </div>
            </div>
        </div>
    );
}