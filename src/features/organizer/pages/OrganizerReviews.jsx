import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../../components/ui/Button';
import Spinner from '../../../components/common/Spinner';
import { formatDateTime } from '../../../utils/formatters';
import { averageRating } from '../utils/organizerHelpers';
import { fetchOrganizerReviews, fetchOrganizerReviewsEvents } from '../slices/organizerSlice';

function StarRow({ rating, max = 5 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: max }).map((_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24"
          fill={i < Math.round(rating) ? '#f59e0b' : 'none'}
          stroke="#f59e0b" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function reviewStatusLabel(status) {
  const map = { 'APPROVED': 'Approved', 'PENDING_APPROVAL': 'Pending', 'REJECTED': 'Rejected' };
  return map[status] || status;
}

function reviewBadgeClass(status) {
  if (status === 'APPROVED') return 'badge badge-completed';
  if (status === 'REJECTED') return 'badge badge-cancelled';
  return 'badge badge-pending-approval';
}

export default function OrganizerReviews() {
  const dispatch = useDispatch();
  const { reviewEvents: events, reviews: items, loading } = useSelector((s) => s.organizer);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [message, setMessage] = useState('');
  const [ratingFilter, setRatingFilter] = useState(0); // 0 = all

  useEffect(() => {
    async function loadEvents() {
      try {
        const eventItems = await dispatch(fetchOrganizerReviewsEvents()).unwrap();
        if (eventItems.length) setSelectedEventId(String(eventItems[0].eventId));
      } catch (err) {
        setMessage(err || 'Failed to load events.');
      }
    }
    loadEvents();
  }, [dispatch]);

  useEffect(() => {
    async function loadReviews() {
      if (!selectedEventId) return;
      try {
        await dispatch(fetchOrganizerReviews(selectedEventId)).unwrap();
        setRatingFilter(0);
      } catch (err) {
        setMessage(err || 'Failed to load reviews.');
      }
    }
    loadReviews();
  }, [dispatch, selectedEventId]);

  const stats = useMemo(() => ({
    total: items.length,
    approved: items.filter(i => i.status === 'APPROVED').length,
    pending: items.filter(i => i.status === 'PENDING_APPROVAL').length,
    average: averageRating(items),
  }), [items]);

  // Rating distribution: count of reviews per star 1-5
  const ratingDist = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    items.forEach(i => {
      const r = Math.round(Number(i.rating || 0));
      if (r >= 1 && r <= 5) dist[r - 1]++;
    });
    return dist;
  }, [items]);

  const filteredItems = useMemo(() => {
    if (ratingFilter === 0) return items;
    return items.filter(i => Math.round(Number(i.rating || 0)) === ratingFilter);
  }, [items, ratingFilter]);

  async function refreshReviews() {
    if (!selectedEventId) return;
    await dispatch(fetchOrganizerReviews(selectedEventId));
  }

  if (loading && !events.length && !selectedEventId) return <Spinner label="Loading reviews..." />;

  return (
    <div style={{ padding: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 className="view-title">Event Reviews</h2>
          <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>
            View attendee feedback and ratings by event.
          </p>
        </div>
        <Button variant="secondary" onClick={refreshReviews}>Refresh</Button>
      </div>

      {message && <div className="alert alert-error" style={{ marginBottom: 20 }}>{message}</div>}

      {/* Event Selector */}
      <div style={{ marginBottom: 24 }}>
        <select className="form-input" style={{ width: 340 }} value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
          {events.map((item) => <option key={item.eventId} value={item.eventId}>{item.eventTitle}</option>)}
        </select>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="admin-stat-card" style={{ borderTop: '4px solid #6366f1' }}>
          <div className="admin-stat-label">Total Reviews</div>
          <div className="admin-stat-value">{stats.total}</div>
          <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 4 }}>Feedback received</div>
        </div>
        <div className="admin-stat-card" style={{ borderTop: '4px solid #f59e0b' }}>
          <div className="admin-stat-label">Average Rating</div>
          <div className="admin-stat-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#f59e0b' }}>{stats.average}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 4 }}>Out of 5.0</div>
        </div>
        <div className="admin-stat-card" style={{ borderTop: '4px solid #10b981' }}>
          <div className="admin-stat-label">Approved</div>
          <div className="admin-stat-value" style={{ color: '#10b981' }}>{stats.approved}</div>
          <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 4 }}>Published reviews</div>
        </div>
        <div className="admin-stat-card" style={{ borderTop: '4px solid #f59e0b' }}>
          <div className="admin-stat-label">Pending</div>
          <div className="admin-stat-value" style={{ color: '#f59e0b' }}>{stats.pending}</div>
          <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 4 }}>Awaiting approval</div>
        </div>
      </div>

      {/* Rating Distribution */}
      {stats.total > 0 && (
        <div style={{ background: 'white', border: '1px solid var(--neutral-100)', borderRadius: 16, padding: '20px 24px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Rating Breakdown</h3>
            {ratingFilter > 0 && (
              <button onClick={() => setRatingFilter(0)} style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                Clear filter ✕
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {[5, 4, 3, 2, 1].map(star => {
              const count = ratingDist[star - 1];
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <button
                  key={star}
                  onClick={() => setRatingFilter(ratingFilter === star ? 0 : star)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, background: ratingFilter === star ? '#fffbeb' : 'transparent',
                    border: ratingFilter === star ? '1px solid #fde68a' : '1px solid transparent',
                    borderRadius: 8, padding: '6px 10px', cursor: 'pointer', width: '100%'
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, width: 16, textAlign: 'right', color: '#f59e0b' }}>{star}</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  <div style={{ flex: 1, background: 'var(--neutral-100)', borderRadius: 100, height: 8, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: '#f59e0b', borderRadius: 100, transition: 'width 0.4s' }} />
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--neutral-500)', width: 28, textAlign: 'right' }}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviews Table */}
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
            {filteredItems.map((review) => (
              <tr key={review.id}>
                <td style={{ fontWeight: 600 }}>{review.userName || '-'}</td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <StarRow rating={Number(review.rating || 0)} />
                    <span style={{ fontSize: 12, color: 'var(--neutral-500)', fontWeight: 600 }}>
                      {Number(review.rating || 0).toFixed(1)} / 5
                    </span>
                  </div>
                </td>
                <td style={{ color: 'var(--neutral-600)', maxWidth: 280 }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {review.comment || <em style={{ color: 'var(--neutral-400)' }}>No written feedback</em>}
                  </div>
                </td>
                <td>
                  <span className={reviewBadgeClass(review.status)}>
                    {reviewStatusLabel(review.status)}
                  </span>
                </td>
                <td style={{ color: 'var(--neutral-400)', fontSize: 13 }}>{formatDateTime(review.createdAt).split(',')[0]}</td>
              </tr>
            ))}
            {!filteredItems.length && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--neutral-400)' }}>
                  {ratingFilter > 0 ? `No ${ratingFilter}-star reviews found.` : 'No reviews received yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
