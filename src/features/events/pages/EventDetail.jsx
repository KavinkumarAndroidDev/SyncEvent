import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axiosInstance from '../../../lib/axios';
import Button from '../../../components/ui/Button';

const colors = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444'];
function getColor(id) { return colors[(id || 0) % colors.length]; }

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useSelector((s) => s.auth);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null); // pending/incomplete booking

  useEffect(() => {
    // 1. Fetch Event Details
    axiosInstance.get(`/events/${id}`)
      .then((res) => { setEvent(res.data); setLoading(false); })
      .catch(() => { setError('Could not load event details.'); setLoading(false); });

    // 2. Check for active pending booking if logged in (to show Resume Payment)
    if (token && user?.role === 'ATTENDEE') {
        axiosInstance.get(`/bookings/event/${id}/active`)
            .then(res => setActiveBooking(res.data))
            .catch(() => setActiveBooking(null));
    }
  }, [id, token, user]);

  const handleBookClick = () => {
    if (!token || user?.role !== 'ATTENDEE') { setShowAlert(true); return; }
    if (activeBooking) {
        // Resume existing PENDING booking
        navigate(`/booking/${id}`, { state: { resumeBookingId: activeBooking.id } });
    } else {
        // New booking
        navigate(`/booking/${id}`);
    }
  };

  const fmt = (dt) => dt ? new Date(dt).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'TBA';
  const fmtTime = (dt) => dt ? new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';

  if (loading) return <div className="detail-status">Loading event assets...</div>;
  if (error) return <div className="detail-status">{error}</div>;
  if (!event) return null;

  const locationStr = [event.venue?.address, event.venue?.city, event.venue?.state].filter(Boolean).join(', ') || 'TBA';
  const avatarColor = getColor(event.id);
  const imgBg = avatarColor.replace('#', '');

  return (
    <main className="detail-page">
      <div className="detail-container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to events
        </button>

        {showAlert && (
          <div className="alert-banner">
            <span>
              {!token ? <>Please <Link to="/login">login</Link> as an attendee to book tickets.</> : 'Only registered attendees can book tickets.'}
            </span>
            <button className="alert-close" onClick={() => setShowAlert(false)}>×</button>
          </div>
        )}

        <div className="detail-grid">
          <div className="detail-left">
            <div className="detail-hero">
              <img
                src={`https://placehold.co/900x450/${imgBg}/ffffff?text=${encodeURIComponent(event.title || 'Event')}`}
                alt={event.title}
                className="detail-hero-img"
              />
            </div>

            <div className="detail-about">
              <div className="detail-section-title">About the Event</div>
              <p className="detail-description">{event.fullDescription || event.description || 'No description available.'}</p>
            </div>

            {event.organizer && (
              <div className="detail-organizer">
                <div className="detail-section-title">Organizer</div>
                <div className="organizer-card">
                  <div className="organizer-avatar" style={{ background: avatarColor }}>
                    {event.organizer.fullName?.[0]?.toUpperCase() || 'O'}
                  </div>
                  <div>
                    <div className="organizer-name">{event.organizer.fullName}</div>
                    {event.organizer.email && <div className="organizer-email">{event.organizer.email}</div>}
                  </div>
                </div>
              </div>
            )}

            {event.venue && (
              <div className="detail-venue">
                <div className="detail-section-title">Venue</div>
                <div className="venue-card">
                  <div className="venue-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div>
                    <div className="venue-name">{event.venue.name}</div>
                    <div className="venue-address">{ locationStr}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="detail-policies">
              <div className="detail-section-title">Event Policies</div>
              <div className="policies-grid">
                <div className="policy-card">
                  <div className="policy-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  </div>
                  <div>
                    <div className="policy-title">Cancellation</div>
                    <div className="policy-body">{event.isCancellable ? `Cancellable before ${fmt(event.cancellationDeadline)}` : 'Non-cancellable'}</div>
                  </div>
                </div>
                <div className="policy-card">
                  <div className="policy-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </div>
                  <div>
                    <div className="policy-title">Capacity</div>
                    <div className="policy-body">{event.capacity ? `${event.capacity} attendees` : 'Limited seats'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-right">
            <div className="booking-card">
              <div className="booking-title">{event.title}</div>

              {event.category && (
                <div className="booking-meta">
                  <span className="meta-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></span>
                  {event.category.name}
                </div>
              )}

              <div className="booking-meta">
                <span className="meta-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>
                {fmt(event.startTime)}{event.startTime && ` at ${fmtTime(event.startTime)}`}
              </div>

              {event.endTime && (
                <div className="booking-meta">
                  <span className="meta-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
                  Ends {fmtTime(event.endTime)}
                </div>
              )}

              <div className="booking-meta">
                <span className="meta-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span>
                {locationStr}
              </div>

              <hr className="booking-divider" />

              <div className="booking-footer" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Button
                  onClick={handleBookClick}
                  style={{ width: '100%' }}
                  variant={activeBooking ? 'secondary' : 'primary'}
                >
                  {activeBooking ? 'Resume Payment' : 'Book Tickets'}
                </Button>
                {!token && <p className="booking-hint">Login as an attendee to book</p>}
                {token && user?.role !== 'ATTENDEE' && <p className="booking-hint">Only attendees can book tickets</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
