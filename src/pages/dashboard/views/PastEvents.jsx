import { useEffect, useState, useMemo } from 'react';
import axiosInstance from '../../../api/axiosInstance';
import Modal from '../../../components/Modal';
import Button from '../../../components/Button';

const PAGE_SIZE = 6;

export default function PastEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(0);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axiosInstance.get('/bookings?size=200');
        const past = (res.data.content || []).filter(b =>
          b.status === 'CONFIRMED' && new Date(b.eventDate) < new Date()
        );
        const uniqueEvents = [];
        const seen = new Set();
        past.forEach(b => {
          if (!seen.has(b.eventId)) {
            seen.add(b.eventId);
            uniqueEvents.push(b);
          }
        });
        setEvents(uniqueEvents);
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
    if (sortBy === 'newest') result.sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));
    if (sortBy === 'oldest') result.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
    return result;
  }, [events, search, sortBy]);

  const totalPages = Math.ceil(filteredEvents.length / PAGE_SIZE);
  const pagedEvents = filteredEvents.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) return;
    setSubmitting(true);
    try {
      await axiosInstance.post('/feedback', {
        eventId: selectedEvent.eventId,
        comment: feedback
      });
      alert('Thank you for your feedback!');
      setSelectedEvent(null);
      setFeedback('');
    } catch (err) {
      alert('Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-4">Loading past events...</div>;

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
          pagedEvents.map(ev => (
            <div key={ev.id} className="past-event-card">
              <div className="pe-badge">PAST</div>
              <div className="pe-content">
                <div className="pe-ref">EVT-{ev.id}</div>
                <h3 className="pe-title">{ev.eventTitle}</h3>
                <div className="pe-meta">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span>{new Date(ev.eventDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="pe-meta">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span>{ev.venueName || 'Confirmed Venue'}</span>
                </div>
              </div>
              <div className="pe-actions" style={{ marginTop: '20px' }}>
                <Button variant="secondary" style={{ width: '100%' }} onClick={() => setSelectedEvent(ev)}>
                  Share Feedback
                </Button>
              </div>
            </div>
          ))
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
          <p style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--neutral-600)' }}>
            How was your experience at <strong>{selectedEvent?.eventTitle}</strong>? Your feedback helps us improve!
          </p>
          <textarea
            className="form-input"
            rows="5"
            placeholder="Share your thoughts, highlights, or suggestions..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            style={{ resize: 'none' }}
          ></textarea>
        </div>
      </Modal>
    </div>
  );
}
