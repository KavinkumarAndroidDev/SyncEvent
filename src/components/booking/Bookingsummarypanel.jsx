export default function BookingSummaryPanel({ tickets, cart, preview, discountCode, setDiscountCode, onApplyDiscount, onPayNow, previewLoading, bookingLoading, previewError, disableDiscount }) {
    const subtotal = preview?.items?.reduce((s, i) => s + i.lineTotal, 0) ?? tickets.filter(t => cart[t.id]).reduce((s, t) => s + t.price * cart[t.id], 0);
    const discount = preview?.discountAmount || 0;
    const total = preview?.totalAmount ?? subtotal;

    return (
        <div style={{ border: '1px solid var(--neutral-100)', borderRadius: 14, padding: 22 }}>
            <h5 style={{ fontFamily: 'DM Sans', fontWeight: 700, marginBottom: 18 }}>Booking Summary</h5>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {tickets.filter(t => cart[t.id]).map(ticket => (
                    <div key={ticket.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                        <span style={{ color: 'var(--neutral-600)' }}>{ticket.name} × {cart[ticket.id]}</span>
                        <span style={{ fontWeight: 500 }}>₹{ticket.price * cart[ticket.id]}</span>
                    </div>
                ))}
            </div>

            <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Discount Code</label>
                <div style={{ display: 'flex', gap: 8 }}>
                    <input
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        disabled={disableDiscount}
                        placeholder="Enter code"
                        style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--neutral-100)', borderRadius: 8, fontSize: 14, fontFamily: 'Inter', outline: 'none' }}
                    />
                    <button onClick={onApplyDiscount} disabled={previewLoading || disableDiscount} style={{ padding: '8px 14px', border: '1px solid var(--primary)', color: 'var(--primary)', background: 'white', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                        Apply
                    </button>
                </div>
                {previewError && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 6 }}>{previewError}</div>}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--neutral-100)', margin: '12px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                <span style={{ color: 'var(--neutral-600)' }}>Subtotal</span>
                <span style={{ fontWeight: 500 }}>₹{subtotal}</span>
            </div>
            {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                    <span style={{ color: '#16a34a' }}>Discount</span>
                    <span style={{ fontWeight: 500, color: '#16a34a' }}>-₹{discount}</span>
                </div>
            )}

            <hr style={{ border: 'none', borderTop: '1px solid var(--neutral-100)', margin: '12px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <span style={{ fontWeight: 700, fontSize: 17 }}>Total</span>
                <span style={{ fontWeight: 700, fontSize: 22, color: 'var(--primary)' }}>₹{total}</span>
            </div>

            <button
                onClick={onPayNow}
                disabled={bookingLoading}
                style={{ width: '100%', padding: '14px', background: bookingLoading ? 'var(--neutral-400)' : 'var(--neutral-900)', color: 'white', border: 'none', borderRadius: 999, fontSize: 15, fontWeight: 700, cursor: bookingLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'DM Sans' }}
            >
                {bookingLoading ? 'Processing...' : `Pay ₹${total}`}
                {!bookingLoading && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>}
            </button>
        </div>
    );
}
