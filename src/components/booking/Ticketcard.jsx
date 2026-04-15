export default function TicketCard({ ticket, qty, onAdd, onIncrease, onDecrease }) {
    const soldOut = ticket.availableQuantity === 0;

    return (
        <div style={{ border: `1px solid ${qty ? 'var(--primary)' : 'var(--neutral-100)'}`, borderRadius: 12, padding: '18px 20px', background: qty ? 'rgba(23,185,120,0.03)' : 'white', transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{ticket.name}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>₹{ticket.price}</div>
                    {ticket.availableQuantity > 0 && (
                        <div style={{ fontSize: 12, color: 'var(--neutral-400)', marginTop: 2 }}>{ticket.availableQuantity} left</div>
                    )}
                </div>
                <div>
                    {soldOut ? (
                        <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 999 }}>SOLD OUT</span>
                    ) : qty ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--neutral-100)', borderRadius: 999, padding: '4px 8px' }}>
                            <button onClick={onDecrease} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'var(--neutral-50)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            </button>
                            <span style={{ fontWeight: 700, minWidth: 18, textAlign: 'center' }}>{qty}</span>
                            <button onClick={onIncrease} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'var(--neutral-50)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            </button>
                        </div>
                    ) : (
                        <button onClick={onAdd} style={{ border: '1px solid var(--primary)', color: 'var(--primary)', background: 'white', borderRadius: 999, padding: '8px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>Add</button>
                    )}
                </div>
            </div>
        </div>
    );
}