import { useEffect, useState, useMemo } from 'react';
import axiosInstance from '../../../lib/axios';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { formatDate } from '../../../utils/formatters';
import Spinner from '../../../components/common/Spinner';

const PAGE_SIZE = 6;

export default function PastEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState('5');
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(0);
  const [submittedFeedbacks, setSubmittedFeedbacks] = useState(new Set());
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axiosInstance.get('/bookings?size=200');
        const past = (res.data.content || []).filter(b =>
          b.status === 'CONFIRMED' && b.eventStartTime && new Date(b.eventStartTime) < new Date()
        );
        const uniqueEvents = [];
        const seen = new Set();
        past.forEach(b => {
          if (!seen.has(b.eventId)) {
            seen.add(b.eventId);
            uniqueEvents.push(b);
          }
        });
        const withLocations = await Promise.all(uniqueEvents.map(async (item) => {
          if (item.venueName || item.eventLocation || item.city) return item;
          try {
            const eventRes = await axiosInstance.get(`/events/${item.eventId}`);
            return {
              ...item,
              venueName: eventRes.data?.venueName,
              eventLocation: eventRes.data?.address,
              city: eventRes.data?.city,
            };
          } catch {
            return item;
          }
        }));
        setEvents(withLocations);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    let result = events.filter(e =>
      e.eventTitle.toLowerCase().includes(search.toLowerCase())
    );
    if (sortBy === 'newest') result.sort((a, b) => new Date(b.eventStartTime) - new Date(a.eventStartTime));
    if (sortBy === 'oldest') result.sort((a, b) => new Date(a.eventStartTime) - new Date(b.eventStartTime));
    return result;
  }, [events, search, sortBy]);

  const totalPages = Math.ceil(filteredEvents.length / PAGE_SIZE);
  const pagedEvents = filteredEvents.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) return;
    setSubmitting(true);
    try {
      await axiosInstance.post(`/events/${selectedEvent.eventId}/feedbacks`, {
        rating: Number(rating),
        comment: feedback.trim(),
      });
      setSubmittedFeedbacks(prev => new Set(prev).add(selectedEvent.eventId));
      setShowSuccess(true);
      setTimeout(() => {
        setSelectedEvent(null);
        setShowSuccess(false);
        setFeedback('');
        setRating('5');
      }, 2000);
    } catch {
      alert('Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner label="Loading past events..." />;

  return (
    <div className="view-container">
      <header className="view-header">
        <h2 className="view-title">Past Experiences</h2>
        <p style={{ color: 'var(--neutral-400)', fontSize: '14px' }}>Events you have attended in the past.</p>
      </header>

      <div className="dashboard-filter-bar" style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search past events..."
          className="form-input"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          style={{ flex: 1, minWidth: '200px' }}
        />
        <select
          className="form-input"
          style={{ width: '200px' }}
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value); setPage(0); }}
        >
          <option value="newest">Recent First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      <div className="past-events-grid">
        {pagedEvents.length === 0 ? (
          <div style={{ gridColumn: '1/-1', padding: '48px', textAlign: 'center', color: 'var(--neutral-400)' }}>
            <p>{events.length === 0 ? "You haven't attended any events yet." : "No events match your search."}</p>
          </div>
        ) : (
          pagedEvents.map(ev => {
            const isSubmitted = submittedFeedbacks.has(ev.eventId);
            return (
              <div key={ev.id} className="past-event-card" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid var(--neutral-100)' }}>
                <div className="pe-badge" style={{ background: 'var(--neutral-50)', color: 'var(--neutral-400)' }}>PAST</div>
                <div className="pe-content">
                  <div className="pe-ref">EVT-{ev.id}</div>
                  <h3 className="pe-title" style={{ fontSize: '16px', marginBottom: '12px' }}>{ev.eventTitle}</h3>
                  <div className="pe-meta">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span>{formatDate(ev.eventStartTime)}</span>
                  </div>
                  <div className="pe-meta">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span>{[ev.venueName || ev.eventLocation, ev.city].filter(Boolean).join(', ') || 'Location TBA'}</span>
                  </div>
                </div>
                <div className="pe-actions" style={{ marginTop: '20px' }}>
                  <Button 
                    variant={isSubmitted ? "secondary" : "primary"} 
                    style={{ width: '100%', opacity: isSubmitted ? 0.7 : 1 }} 
                    onClick={() => !isSubmitted && setSelectedEvent(ev)}
                    disabled={isSubmitted}
                  >
                    {isSubmitted ? 'Feedback Submitted' : 'Share Feedback'}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination" style={{ marginTop: '32px' }}>
          <button className="page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={`page-btn ${page === i ? 'page-btn-active' : ''}`}
              onClick={() => setPage(i)}
            >{i + 1}</button>
          ))}
          <button className="page-btn" disabled={page === totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      <Modal
        isOpen={!!selectedEvent}
        title="Event Feedback"
        onClose={() => setSelectedEvent(null)}
        actions={
          <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setSelectedEvent(null)}>Maybe Later</Button>
            <Button onClick={handleSubmitFeedback} loading={submitting}>Submit Feedback</Button>
          </div>
        }
      >
        <div style={{ padding: '8px 0' }}>
          {showSuccess ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ background: '#dcfce7', color: '#166534', padding: '12px', borderRadius: '8px', marginBottom: '10px' }}>
                Thank you for your feedback!
              </div>
              <p style={{ fontSize: '13px', color: 'var(--neutral-400)' }}>Closing window...</p>
            </div>
          ) : (
            <>
              <p style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--neutral-600)' }}>
                How was your experience at <strong>{selectedEvent?.eventTitle}</strong>? Your feedback helps us improve!
              </p>
              <select
                className="form-input"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                style={{ marginBottom: '12px' }}
              >
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Good</option>
                <option value="3">3 - Average</option>
                <option value="2">2 - Poor</option>
                <option value="1">1 - Bad</option>
              </select>
              <textarea
                className="form-input"
                rows="5"
                placeholder="Share your thoughts, highlights, or suggestions..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                style={{ resize: 'none' }}
              ></textarea>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
