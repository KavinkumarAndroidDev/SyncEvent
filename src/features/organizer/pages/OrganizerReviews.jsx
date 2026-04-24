import { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../lib/axios';
import Button from '../../../components/ui/Button';
import Spinner from '../../../components/common/Spinner';
import { formatDateTime } from '../../../utils/formatters';
import { averageRating, getBadgeClass } from '../utils/organizerHelpers';

export default function OrganizerReviews() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/reports/events?size=200');
        const eventItems = res.data?.content || [];
        setEvents(eventItems);
        if (eventItems.length) setSelectedEventId(String(eventItems[0].eventId));
      } catch (err) {
        setMessage(err.response?.data?.message || 'Failed to load events.');
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  useEffect(() => {
    async function loadReviews() {
      if (!selectedEventId) return;
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/events/${selectedEventId}/feedbacks?size=100`);
        setItems(res.data?.content || []);
      } catch (err) {
        setMessage(err.response?.data?.message || 'Failed to load reviews.');
      } finally {
        setLoading(false);
      }
    }
    loadReviews();
  }, [selectedEventId]);

  const stats = useMemo(() => ({
    total: items.length,
    approved: items.filter((item) => item.status === 'APPROVED').length,
    pending: items.filter((item) => item.status === 'PENDING_APPROVAL').length,
    average: averageRating(items),
  }), [items]);

  async function refreshReviews() {
    if (!selectedEventId) return;
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/events/${selectedEventId}/feedbacks?size=100`);
      setItems(res.data?.content || []);
    } finally {
      setLoading(false);
    }
  }

  if (loading && !events.length && !selectedEventId) return <Spinner label="Loading reviews..." />;

  return (
    <div style={{ padding: 40 }}>
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 className="view-title">Event Reviews</h2>
          <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>View attendee feedback and track review quality by event.</p>
        </div>
        <Button variant="secondary" onClick={refreshReviews}>Refresh</Button>
      </div>

      {message && <div className="alert alert-error" style={{ marginBottom: 20 }}>{message}</div>}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <select className="form-input" style={{ width: 320 }} value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
          {events.map((item) => <option key={item.eventId} value={item.eventId}>{item.eventTitle}</option>)}
        </select>
      </div>

      <div className="admin-stat-grid" style={{ marginBottom: 24 }}>
        <div className="admin-stat-card"><div className="admin-stat-label">Total Reviews</div><div className="admin-stat-value">{stats.total}</div></div>
        <div className="admin-stat-card"><div className="admin-stat-label">Average Rating</div><div className="admin-stat-value">{stats.average}</div></div>
        <div className="admin-stat-card"><div className="admin-stat-label">Approved</div><div className="admin-stat-value">{stats.approved}</div></div>
        <div className="admin-stat-card"><div className="admin-stat-label">Pending Approval</div><div className="admin-stat-value">{stats.pending}</div></div>
      </div>

      <div className="table-responsive">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Attendee</th>
              <th>Rating</th>
              <th>Review</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {items.map((review) => (
              <tr key={review.id}>
                <td style={{ fontWeight: 600 }}>{review.userName || '-'}</td>
                <td style={{ color: '#eab308', fontWeight: 600 }}>{review.rating} / 5</td>
                <td style={{ color: 'var(--neutral-600)' }}>{review.comment || '-'}</td>
                <td><span className={getBadgeClass(review.status)}>{review.status}</span></td>
                <td style={{ color: 'var(--neutral-400)' }}>{formatDateTime(review.createdAt)}</td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--neutral-400)' }}>No reviews found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
