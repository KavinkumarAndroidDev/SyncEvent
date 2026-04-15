export default function StepIndicator({ step }) {
    return (
        <div style={{ padding: '20px 0 4px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ background: 'var(--neutral-50)', borderRadius: 999, padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--neutral-400)' }}>
                <span style={{ padding: '4px 12px', borderRadius: 999, ...(step === 'tickets' ? { background: 'var(--primary)', color: 'white', fontWeight: 600 } : {}) }}>Tickets</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                <span style={{ padding: '4px 12px', borderRadius: 999, ...(step === 'payment' ? { background: 'var(--primary)', color: 'white', fontWeight: 600 } : {}) }}>Review & Pay</span>
            </div>
        </div>
    );
}