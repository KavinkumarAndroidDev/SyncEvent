import { useEffect, useState, useMemo } from 'react';
import axiosInstance from '../../../api/axiosInstance';
import Modal from '../../../components/Modal';
import Button from '../../../components/Button';

const PAGE_SIZE = 10;

export default function MyRegistrations() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [eventForCancel, setEventForCancel] = useState(null);
  const [checkingDeadline, setCheckingDeadline] = useState(false);
  const [page, setPage] = useState(0);

  const fetchBookings = async () => {
    try {
      const res = await axiosInstance.get('/bookings?size=200');
      setBookings(res.data.content || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (confirmCancel) {
      setCheckingDeadline(true);
      axiosInstance.get(`/events/${confirmCancel.eventId}`)
        .then(res => setEventForCancel(res.data))
        .catch(() => setEventForCancel({ error: true }))
        .finally(() => setCheckingDeadline(false));
    } else {
      setEventForCancel(null);
    }
  }, [confirmCancel]);

  const canCancel = useMemo(() => {
    if (!eventForCancel || eventForCancel.error) return false;
    if (!eventForCancel.isCancellable) return false;
    if (!eventForCancel.cancellationDeadline) return true;
    return new Date() < new Date(eventForCancel.cancellationDeadline);
  }, [eventForCancel]);

  const handleCancel = async (id) => {
    try {
      await axiosInstance.patch(`/bookings/${id}/status`, { status: 'CANCELLED' });
      setConfirmCancel(null);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking.');
    }
  };

  const showPass = async (id) => {
    try {
      const res = await axiosInstance.get(`/bookings/${id}`);
      setSelectedBooking(res.data);
    } catch (err) {
      alert('Could not load pass details.');
    }
  };

  const filteredBookings = useMemo(() => {
    let result = bookings.filter(b => {
      const matchesSearch = b.eventTitle.toLowerCase().includes(search.toLowerCase()) ||
                            `REF-${b.id}`.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    if (sortBy === 'newest') result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sortBy === 'oldest') result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return result;
  }, [bookings, search, statusFilter, sortBy]);

  const totalPages = Math.ceil(filteredBookings.length / PAGE_SIZE);
  const pagedBookings = filteredBookings.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (loading) return <div className="p-4">Loading registrations...</div>;

  return (
    <div className="view-container">
      <header className="view-header">
        <h2 className="view-title">My Registrations</h2>
      </header>

      {/* Filter Bar */}
      <div className="dashboard-filter-bar" style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by event title or Reference..."
          className="form-input"
          style={{ flex: 1, minWidth: '200px' }}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        />
        <select
          className="form-input"
          style={{ width: '150px' }}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
        >
          <option value="ALL">All Status</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PENDING">Pending</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          className="form-input"
          style={{ width: '150px' }}
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value); setPage(0); }}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      <div className="registrations-list">
        {filteredBookings.length === 0 ? (
          <div className="empty-state">
            <p>{bookings.length === 0 ? "You haven't registered for any events yet." : "No bookings match your filters."}</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Event</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedBookings.map((b, idx) => (
                  <tr key={b.id}>
                    <td style={{ color: 'var(--neutral-400)', width: 40 }}>{page * PAGE_SIZE + idx + 1}</td>
                    <td>{b.eventTitle}</td>
                    <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge badge-${b.status?.toLowerCase()}`}>{b.status}</span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <Button variant="table" onClick={() => showPass(b.id)}>View Pass</Button>
                        {b.status === 'CONFIRMED' && (
                          <Button variant="table" className="btn-cancel" onClick={() => setConfirmCancel(b)}>Cancel</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination" style={{ marginTop: '24px' }}>
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

      {/* Pass Modal */}
      {selectedBooking && (
        <Modal
          isOpen={!!selectedBooking}
          title="Event Pass"
          onClose={() => setSelectedBooking(null)}
          actions={<Button onClick={() => window.print()}>Print Pass</Button>}
        >
          <div className="pass-body">
            <div className="pass-row">
              <strong>Reference:</strong> <span>REF-{selectedBooking.id}</span>
            </div>
            <div className="pass-row">
              <strong>Event:</strong> <span>{selectedBooking.eventTitle}</span>
            </div>
            <div className="pass-row">
              <strong>Status:</strong> <span className={`badge badge-${selectedBooking.status?.toLowerCase()}`}>{selectedBooking.status}</span>
            </div>
            <div className="pass-tickets" style={{ marginTop: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
              <h6 style={{ marginBottom: '8px' }}>Tickets:</h6>
              {selectedBooking.items?.map(item => (
                <div key={item.id} className="pass-ticket-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span>{item.ticketName}</span>
                  <strong>x {item.quantity}</strong>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Modal */}
      {confirmCancel && (
        <Modal
          isOpen={!!confirmCancel}
          title="Confirm Cancellation"
          onClose={() => setConfirmCancel(null)}
          actions={
            checkingDeadline ? (
              <Button loading disabled>Loading...</Button>
            ) : canCancel ? (
              <>
                <Button variant="secondary" onClick={() => setConfirmCancel(null)}>No, Keep it</Button>
                <Button variant="danger" onClick={() => handleCancel(confirmCancel.id)}>Yes, Cancel Booking</Button>
              </>
            ) : (
              <Button onClick={() => setConfirmCancel(null)}>Back</Button>
            )
          }
        >
          {checkingDeadline ? (
            <p>Verifying cancellation deadline...</p>
          ) : eventForCancel?.error ? (
            <p>Could not verify cancellation policy. Please try again later.</p>
          ) : canCancel ? (
            <p>Are you sure you want to cancel your registration for <strong>{confirmCancel.eventTitle}</strong>? This action cannot be undone.</p>
          ) : (
            <div>
              <p style={{ color: '#dc2626', fontWeight: 600 }}>CANCELLATION NOT POSSIBLE</p>
              {!eventForCancel?.isCancellable ? (
                <p>This event is non-cancellable according to the organizer&apos;s policy.</p>
              ) : (
                <p>The cancellation deadline for this event (<strong>{new Date(eventForCancel?.cancellationDeadline).toLocaleString()}</strong>) has already passed.</p>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
