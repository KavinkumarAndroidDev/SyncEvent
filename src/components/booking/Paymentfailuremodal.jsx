export default function PaymentFailureModal({ reason, onRetry, onCancel }) {
    if (!reason) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 400, width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                </div>
                <h4 style={{ fontFamily: 'DM Sans', fontWeight: 700, marginBottom: 8 }}>Payment Failed</h4>
                <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginBottom: 24 }}>{reason}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button onClick={onRetry} style={{ padding: '13px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 999, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                        Retry Payment
                    </button>
                    <button onClick={onCancel} style={{ padding: '13px', background: 'white', color: 'var(--neutral-900)', border: '1px solid var(--neutral-100)', borderRadius: 999, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                        Cancel Booking
                    </button>
                </div>
            </div>
        </div>
    );
}