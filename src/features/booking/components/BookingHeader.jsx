export default function BookingHeader({ event, onBack }) {
    const fmt = (dt) => dt ? new Date(dt).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'TBA';

    return (
        <div style={{ borderBottom: '1px solid var(--neutral-100)', padding: '12px 0' }}>
            <div className="detail-container">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--neutral-400)', fontSize: 14, marginBottom: 2 }}>
                    <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--neutral-400)', cursor: 'pointer', fontSize: 14, padding: 0 }}>Back</button>
                    <span>/</span>
                    <span style={{ color: 'var(--neutral-900)', fontWeight: 500 }}>{event.title}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--neutral-400)' }}>{fmt(event.startTime)}</div>
            </div>
        </div>
    );
}
