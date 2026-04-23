import { formatMoney } from '../../../utils/formatters';

export default function StickyBar({ total, count, loading, onProceed }) {
    return (
        <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', background: 'var(--neutral-900)', color: 'white', padding: '14px 0', zIndex: 1000 }}>
            <div className="detail-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{formatMoney(total)}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{count} Ticket{count > 1 ? 's' : ''}</div>
                </div>
                <button onClick={onProceed} disabled={loading} style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 999, padding: '11px 24px', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {loading ? 'Loading...' : 'Review and pay'}
                    {!loading && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>}
                </button>
            </div>
        </div>
    );
}
