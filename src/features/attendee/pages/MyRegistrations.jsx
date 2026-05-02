import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { formatDate, formatDateTime } from '../../../utils/formatters';
import { openPdfDocument } from '../../../utils/documentPrint';
import Spinner from '../../../components/common/Spinner';
import {
  cancelAttendeeBooking,
  clearCancelEvent,
  clearSelectedBooking,
  fetchAttendeeBookings,
  fetchBookingDetails,
  fetchCancelEvent
} from '../slices/attendeeSlice';

const PAGE_SIZE = 10;

export default function MyRegistrations() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const {
    bookings,
    selectedBooking,
    eventForCancel,
    bookingsLoading: loading,
    checkingDeadline,
  } = useSelector((state) => state.attendee);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    dispatch(fetchAttendeeBookings());
  }, [dispatch]);

  useEffect(() => {
    if (confirmCancel) {
      dispatch(fetchCancelEvent(confirmCancel.eventId));
    } else {
      dispatch(clearCancelEvent());
    }
  }, [confirmCancel, dispatch]);

  const canCancel = useMemo(() => {
    if (!eventForCancel || eventForCancel.error) return false;
    if (!eventForCancel.isCancellable) return false;
    if (!eventForCancel.cancellationDeadline) return true;
    return new Date() < new Date(eventForCancel.cancellationDeadline);
  }, [eventForCancel]);

  const handleCancel = async (id) => {
    try {
      await dispatch(cancelAttendeeBooking(id)).unwrap();
      setConfirmCancel(null);
    } catch (err) {
      alert(err || 'Failed to cancel booking.');
    }
  };

  const printPass = () => {
    if (!selectedBooking || selectedBooking.status !== 'CONFIRMED') return;
    const ticketRows = (selectedBooking.items || []).map((item) => (
      `<div class="row"><span>${item.ticketName}</span><strong>x ${item.quantity}</strong></div>`
    )).join('');

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=REF-${selectedBooking.id}`;

    openPdfDocument(`Event Pass REF-${selectedBooking.id}`, `
      <div class="header">
        <div>
          <h1 class="brand">SyncEvent Pass</h1>
          <p class="muted">Reference REF-${selectedBooking.id}</p>
        </div>
        <span class="badge">${selectedBooking.status}</span>
      </div>
      <div style="display:flex;justify-content:space-between;gap:24px;align-items:flex-start;">
        <div style="flex:1;">
          <h2 style="margin:0 0 8px;font-size:26px;">${selectedBooking.eventTitle}</h2>
          <p class="muted">Show this pass at the event entrance for verification.</p>
          <div class="grid">
            <div class="box"><div class="label">Booking ID</div><div class="value">#${selectedBooking.id}</div></div>
            <div class="box"><div class="label">Event Date</div><div class="value">${formatDateTime(selectedBooking.eventStartTime)}</div></div>
            <div class="box"><div class="label">Generated On</div><div class="value">${formatDate(new Date())}</div></div>
            <div class="box"><div class="label">Status</div><div class="value">${selectedBooking.status}</div></div>
          </div>
          <h3 style="margin-top:24px; margin-bottom: 8px; font-size: 18px;">Participant Details</h3>
          <div class="grid" style="margin-bottom: 16px;">
            <div class="box"><div class="label">Name</div><div class="value">${user?.fullName || 'N/A'}</div></div>
            <div class="box"><div class="label">Email</div><div class="value">${user?.email || 'N/A'}</div></div>
            <div class="box"><div class="label">Phone</div><div class="value">${user?.phone || 'N/A'}</div></div>
          </div>
        </div>
        <div style="text-align: center; border: 1px solid #e5e7eb; padding: 12px; border-radius: 8px; background: white;">
          <img src="${qrCodeUrl}" alt="QR Code" style="width: 120px; height: 120px;" />
          <p style="font-size: 12px; color: #6b7280; margin-top: 8px; margin-bottom: 0;">Scan to verify</p>
        </div>
      </div>
      <h3 style="margin-top:24px;">Tickets</h3>
      ${ticketRows}
      <p class="note">Please carry a valid ID proof. This pass is valid only for the registered booking and current booking status.</p>
    `);
  };

  const showPass = async (id) => {
    try {
      await dispatch(fetchBookingDetails(id)).unwrap();
    } catch {
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

  if (loading) return <Spinner label="Loading registrations..." />;

  return (
    <div className="view-container">
      <header className="view-header">
        <h2 className="view-title">My Registrations</h2>
      </header>

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
                    <td>{formatDate(b.createdAt)}</td>
                    <td>
                      <span className={`badge badge-${b.status?.toLowerCase()}`}>{b.status}</span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <Button variant="table" onClick={() => showPass(b.id)}>View Details</Button>
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

      {selectedBooking && (
        <Modal
          isOpen={!!selectedBooking}
          title={selectedBooking.status === 'CONFIRMED' ? 'Event Pass' : 'Registration Details'}
          onClose={() => dispatch(clearSelectedBooking())}
          actions={selectedBooking.status === 'CONFIRMED' ? <Button onClick={printPass}>Download Tickets</Button> : null}
        >
          <div className="pass-body">
            {selectedBooking.status === 'CONFIRMED' && (
              <div style={{ textAlign: 'center', marginBottom: '24px', padding: '16px', background: 'white', border: '1px solid var(--neutral-100)', borderRadius: '12px' }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=REF-${selectedBooking.id}`} 
                  alt="QR Code" 
                  style={{ width: '120px', height: '120px' }}
                />
                <p style={{ fontSize: '11px', color: 'var(--neutral-400)', marginTop: '8px' }}>Scan this code at the venue</p>
                <p style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, marginTop: '8px' }}>
                  Please download and print the ticket before attending the event
                </p>
              </div>
            )}
            <div className="pass-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong style={{ fontSize: '13px', color: 'var(--neutral-600)' }}>Reference:</strong> 
              <span style={{ fontSize: '13px', fontWeight: 600 }}>REF-{selectedBooking.id}</span>
            </div>
            <div className="pass-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong style={{ fontSize: '13px', color: 'var(--neutral-600)' }}>Event:</strong> 
              <span style={{ fontSize: '13px', fontWeight: 600, textAlign: 'right' }}>{selectedBooking.eventTitle}</span>
            </div>
            <div className="pass-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <strong style={{ fontSize: '13px', color: 'var(--neutral-600)' }}>Status:</strong> 
              <span className={`badge badge-${selectedBooking.status?.toLowerCase()}`}>{selectedBooking.status}</span>
            </div>
            
            <div className="pass-tickets" style={{ marginTop: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
              <h6 style={{ marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--neutral-400)' }}>Your Tickets:</h6>
              {selectedBooking.items?.map(item => (
                <div key={item.id} className="pass-ticket-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '14px' }}>
                  <span>{item.ticketName}</span>
                  <strong>x {item.quantity}</strong>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

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
                <p>The cancellation deadline for this event (<strong>{formatDateTime(eventForCancel?.cancellationDeadline)}</strong>) has already passed.</p>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
