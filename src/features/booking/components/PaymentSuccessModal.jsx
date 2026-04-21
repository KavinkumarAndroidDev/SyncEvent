export default function PaymentSuccessModal({ bookingId, onGoHome }) {
    if (!bookingId) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 400, width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                </div>
                <h4 style={{ fontFamily: 'DM Sans', fontWeight: 700, marginBottom: 8 }}>Payment Successful!</h4>
                <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginBottom: 24 }}>Your booking has been confirmed.</p>
                <button onClick={onGoHome} style={{ width: '100%', padding: '13px', background: 'var(--neutral-900)', color: 'white', border: 'none', borderRadius: 999, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                    Go to Home
                </button>
                <p style={{ color: 'var(--neutral-400)', fontSize: 11, margin: '12px 0 0' }}>Ref: <span style={{ fontFamily: 'monospace' }}>#{bookingId}</span></p>
            </div>
        </div>
    );
}
