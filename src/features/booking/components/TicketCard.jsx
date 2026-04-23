export default function TicketCard({ ticket, qty, onAdd, onIncrease, onDecrease }) {
    const now = new Date();
    const saleStart = ticket.saleStartTime ? new Date(ticket.saleStartTime) : null;
    const saleEnd = ticket.saleEndTime ? new Date(ticket.saleEndTime) : null;

    const saleNotStarted = saleStart && now < saleStart;
    const saleEnded = saleEnd && now > saleEnd;
    const visibleAvailable = Math.max(0, Number(ticket.availableQuantity || 0) - Number(qty || 0));
    const soldOut = Number(ticket.availableQuantity || 0) === 0;

    // Card is fully disabled — no interaction allowed at all
    const isDisabled = saleNotStarted || saleEnded || soldOut;

    const formatDate = (d) =>
        d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    return (
        <div style={{
            border: `1px solid ${qty && !isDisabled ? 'var(--primary)' : 'var(--neutral-100)'}`,
            borderRadius: 12,
            padding: '18px 20px',
            background: isDisabled ? '#f9fafb' : qty ? 'rgba(23,185,120,0.03)' : 'white',
            transition: 'all 0.2s',
            opacity: isDisabled ? 0.65 : 1,
            cursor: isDisabled ? 'not-allowed' : 'default',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                    <div style={{
                        fontFamily: 'DM Sans',
                        fontWeight: 700,
                        fontSize: 16,
                        marginBottom: 2,
                        color: isDisabled ? 'var(--neutral-400)' : 'var(--neutral-900)'
                    }}>
                        {ticket.name}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: isDisabled ? 'var(--neutral-400)' : 'var(--primary)' }}>
                        ₹{ticket.price}
                    </div>
                    {!isDisabled && ticket.availableQuantity > 0 && (
                        <div style={{ fontSize: 12, color: 'var(--neutral-400)', marginTop: 2 }}>
                            {visibleAvailable} left
                        </div>
                    )}

                    {/* Sale period info */}
                    {saleEnded && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                            <span style={{ fontSize: 12, color: 'var(--neutral-400)' }}>
                                Sales ended {saleEnd ? formatDate(saleEnd) : ''}
                            </span>
                        </div>
                    )}
                    {saleNotStarted && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                            </svg>
                            <span style={{ fontSize: 12, color: 'var(--neutral-400)' }}>
                                Sales start {saleStart ? formatDate(saleStart) : ''}
                            </span>
                        </div>
                    )}
                </div>

                {/* Right side action — always locked when disabled */}
                <div style={{ marginLeft: 16, flexShrink: 0 }}>
                    {saleEnded ? (
                        <span style={{
                            background: '#f3f4f6',
                            color: '#9ca3af',
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '6px 14px',
                            borderRadius: 999,
                            display: 'inline-block',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            userSelect: 'none',
                        }}>
                            Sales Ended
                        </span>
                    ) : saleNotStarted ? (
                        <span style={{
                            background: '#fef3c7',
                            color: '#92400e',
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '6px 14px',
                            borderRadius: 999,
                            display: 'inline-block',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            userSelect: 'none',
                        }}>
                            Coming Soon
                        </span>
                    ) : soldOut ? (
                        <span style={{
                            background: '#fef2f2',
                            color: '#dc2626',
                            fontSize: 12,
                            fontWeight: 700,
                            padding: '6px 14px',
                            borderRadius: 999,
                            userSelect: 'none',
                        }}>
                            SOLD OUT
                        </span>
                    ) : qty ? (
                        /* Stepper — only rendered when ticket is NOT disabled */
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--neutral-100)', borderRadius: 999, padding: '4px 8px' }}>
                            <button
                                onClick={onDecrease}
                                style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'var(--neutral-50)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            </button>
                            <span style={{ fontWeight: 700, minWidth: 18, textAlign: 'center' }}>{qty}</span>
                            <button
                                onClick={onIncrease}
                                style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'var(--neutral-50)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            </button>
                        </div>
                    ) : (
                        /* Add button — only rendered when ticket is NOT disabled */
                        <button
                            onClick={onAdd}
                            style={{ border: '1px solid var(--primary)', color: 'var(--primary)', background: 'white', borderRadius: 999, padding: '8px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
                        >
                            Add
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
