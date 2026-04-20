import BookingAlert from './BookingAlert';

export default function ParticipantDetailsSection({
  participants,
  error,
  locked,
  onBack,
  onChange,
  onContinue,
  loading,
}) {
  return (
    <div className="detail-container" style={{ maxWidth: 700, paddingTop: 28 }}>
      <button
        onClick={onBack}
        style={{ background: 'none', border: 'none', color: 'var(--neutral-400)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 20, padding: 0 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        Back to Tickets
      </button>

      <h3 style={{ fontFamily: 'DM Sans', textAlign: 'center', marginBottom: 24 }}>Participant Details</h3>

      <BookingAlert message={error} />

      {locked && (
        <BookingAlert
          type="success"
          message="This booking is already created. Participant details are locked for this payment session."
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {participants.map((participant, index) => (
          <div key={`${participant.ticketId}-${index}`} style={{ padding: 20, border: '1px solid var(--neutral-100)', borderRadius: 12, background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
              <h5 style={{ fontFamily: 'DM Sans', fontWeight: 600 }}>Attendee {index + 1}</h5>
              <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>{participant.ticketName}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  type="text"
                  value={participant.name}
                  disabled={locked}
                  onChange={(e) => onChange(index, 'name', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  value={participant.email}
                  disabled={locked}
                  onChange={(e) => onChange(index, 'email', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  className="form-input"
                  type="text"
                  value={participant.phone}
                  disabled={locked}
                  onChange={(e) => onChange(index, 'phone', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gender</label>
                <select
                  className="form-input"
                  value={participant.gender}
                  disabled={locked}
                  onChange={(e) => onChange(index, 'gender', e.target.value)}
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ position: 'sticky', bottom: 0, background: 'white', borderTop: '1px solid var(--neutral-100)', padding: '16px 0', zIndex: 90, marginTop: 28 }}>
        <div className="detail-container" style={{ padding: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--neutral-400)' }}>Next step</div>
            <div style={{ fontWeight: 700 }}>Payment Summary</div>
          </div>
          <button
            onClick={onContinue}
            disabled={loading}
            style={{ padding: '12px 32px', background: 'var(--neutral-900)', color: 'white', borderRadius: 20, border: 'none', fontWeight: 600, cursor: 'pointer' }}
          >
            {loading ? 'Loading...' : 'Continue to Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}
