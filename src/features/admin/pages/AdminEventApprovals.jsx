import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Pagination from '../../../components/ui/Pagination';
import { formatDateTime, formatMoney } from '../../../utils/formatters';
import AdminConfirmModal from '../components/AdminConfirmModal';
import { exportCsv } from '../utils/adminUtils';
import {
  clearAdminSelectedEvent,
  fetchAdminEventDetails,
  fetchAdminEvents,
  updateAdminEventStatus
} from '../slices/adminSlice';

const STATUS_LABELS = {
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PUBLISHED: 'Published',
  CANCELLED: 'Cancelled',
};

export default function AdminEventApprovals() {
  const dispatch = useDispatch();
  const { events, loading, selectedEvent, selectedTickets, saving } = useSelector((s) => s.admin);
  const [statusFilter, setStatusFilter] = useState('PENDING_APPROVAL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [pageSize, setPageSize] = useState(10);
  const [confirm, setConfirm] = useState(null);

  const loadEvents = useCallback(async () => {
    try {
      await dispatch(fetchAdminEvents({ statusFilter, sortBy: 'oldest' })).unwrap();
    } catch (err) {
      setMessageType('error');
      setMessage(err || 'Failed to load events.');
    }
  }, [dispatch, statusFilter]);

  useEffect(() => {
    dispatch(fetchAdminEvents({ statusFilter, sortBy: 'oldest' })).unwrap().catch((err) => {
      setMessageType('error');
      setMessage(err || 'Failed to load events.');
    });
  }, [dispatch, statusFilter]);

  const filteredEvents = useMemo(() => {
    return [...events].filter((item) => {
      const text = `${item.title || ''} ${item.categoryName || ''} ${item.venueName || ''} ${item.city || ''}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [events, search]);

  const totalPages = Math.ceil(filteredEvents.length / pageSize);
  const pagedEvents = filteredEvents.slice(page * pageSize, (page + 1) * pageSize);

  async function updateStatus(eventId, status) {
    try {
      const msg = await dispatch(updateAdminEventStatus({ id: eventId, status })).unwrap();
      setMessageType('success');
      setMessage(msg);
      await loadEvents();
      dispatch(clearAdminSelectedEvent());
      setConfirm(null);
    } catch (err) {
      setMessageType('error');
      setMessage(err || 'Could not update event status.');
    }
  }

  function askStatus(item, status) {
    setConfirm({
      title: 'Confirm Action',
      message: `Are you sure you want to mark "${item.title}" as ${status}?`,
      onConfirm: () => updateStatus(item.id || item.eventId, status),
    });
  }

  async function openEvent(id) {
    try {
      await dispatch(fetchAdminEventDetails({ id, statusFilter })).unwrap();
    } catch (err) {
      setMessageType('error');
      setMessage(err || 'Could not load event details.');
    }
  }

  function exportEvents() {
    exportCsv('event-approvals.csv', ['ID', 'Title', 'Category', 'Venue', 'City', 'Start', 'Status'], filteredEvents.map((item) => [
      item.id,
      item.title,
      item.categoryName,
      item.venueName,
      item.city,
      item.startTime,
      item.status,
    ]));
  }

  return (
    <div style={{ padding: 40 }}>
      <div className="view-header">
        <h2 className="view-title">Event Approvals</h2>
        <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>Review submitted events and update their approval state.</p>
      </div>

      {message && <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>{message}</div>}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <input
          className="form-input"
          style={{ flex: 1, minWidth: 220 }}
          placeholder="Search event title or venue..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
        />
        <select className="form-input" style={{ width: 220 }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
          {Object.keys(STATUS_LABELS).map((status) => (
            <option key={status} value={status}>{STATUS_LABELS[status]}</option>
          ))}
        </select>
        <select className="form-input" style={{ width: 150 }} value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}>
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
        <Button variant="secondary" onClick={exportEvents}>Export Data</Button>
      </div>

      <div className="table-responsive">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Event</th>
              <th>Category</th>
              <th>Venue</th>
              <th>Start</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && pagedEvents.map((item, index) => (
              <tr key={item.id}>
                <td>{page * pageSize + index + 1}</td>
                <td style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{item.title}</td>
                <td>{item.categoryName || '-'}</td>
                <td>{item.venueName || '-'}{item.city ? `, ${item.city}` : ''}</td>
                <td>{formatDateTime(item.startTime)}</td>
                <td>
                  <div className="row-actions">
                    <Button variant="table" onClick={() => openEvent(item.id)}>Review</Button>
                    {statusFilter === 'PENDING_APPROVAL' && <Button variant="table" onClick={() => askStatus(item, 'APPROVED')}>Approve</Button>}
                    {statusFilter === 'PENDING_APPROVAL' && <Button variant="table" onClick={() => askStatus(item, 'REJECTED')}>Reject</Button>}
                    {(statusFilter === 'APPROVED' || statusFilter === 'PUBLISHED') && <Button variant="table" onClick={() => askStatus(item, 'CANCELLED')}>Cancel</Button>}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && pagedEvents.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--neutral-400)' }}>
                  No events found for this status.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--neutral-400)' }}>
                  Loading events...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal
        isOpen={!!selectedEvent}
        title={selectedEvent?.title || 'Event Details'}
        onClose={() => dispatch(clearAdminSelectedEvent())}
        maxWidth="800px"
        actions={
          <div style={{ display: 'flex', gap: 12 }}>
            {selectedEvent?.status === 'PENDING_APPROVAL' && (
              <Button onClick={() => askStatus(selectedEvent, 'APPROVED')} loading={saving}>Approve</Button>
            )}
            {selectedEvent?.status === 'PENDING_APPROVAL' && (
              <Button variant="secondary" onClick={() => askStatus(selectedEvent, 'REJECTED')} loading={saving}>Reject</Button>
            )}
            {['PUBLISHED', 'APPROVED'].includes(selectedEvent?.status) && (
              <Button variant="secondary" onClick={() => askStatus(selectedEvent, 'CANCELLED')} loading={saving}>Cancel</Button>
            )}
            <Button variant="table" onClick={() => dispatch(clearAdminSelectedEvent())}>Close</Button>
          </div>
        }
      >
        {selectedEvent && (
          <div style={{ padding: '8px 0', fontSize: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div style={{ background: 'var(--neutral-50)', padding: '16px', borderRadius: '12px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 600, borderBottom: '1px solid var(--neutral-100)', paddingBottom: '8px' }}>Basic Info</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div><strong>ID:</strong> #{selectedEvent.id}</div>
                  <div><strong>Category:</strong> {selectedEvent.category?.name || selectedEvent.categoryName || '-'}</div>
                  <div><strong>Capacity:</strong> {selectedEvent.capacity || '-'}</div>
                  <div><strong>Status:</strong> <span className={`badge badge-${selectedEvent.status?.toLowerCase()}`}>{selectedEvent.status}</span></div>
                </div>
              </div>
              <div style={{ background: 'var(--neutral-50)', padding: '16px', borderRadius: '12px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 600, borderBottom: '1px solid var(--neutral-100)', paddingBottom: '8px' }}>Organizer</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div><strong>Name:</strong> {selectedEvent.organizer?.fullName || '-'}</div>
                  <div><strong>Email:</strong> {selectedEvent.organizer?.email || '-'}</div>
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--neutral-50)', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 600, borderBottom: '1px solid var(--neutral-100)', paddingBottom: '8px' }}>Schedule & Location</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div><strong>Start:</strong> {formatDateTime(selectedEvent.startTime)}</div>
                  <div><strong>End:</strong> {formatDateTime(selectedEvent.endTime)}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div><strong>Venue:</strong> {selectedEvent.venue?.name || selectedEvent.venueName || '-'}</div>
                  <div><strong>Location:</strong> {[selectedEvent.venue?.address, selectedEvent.venue?.city || selectedEvent.city, selectedEvent.venue?.state].filter(Boolean).join(', ') || '-'}</div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 600 }}>Description</h4>
              <p style={{ margin: '0 0 8px 0', color: 'var(--neutral-600)' }}><strong>Short:</strong> {selectedEvent.description || '-'}</p>
              <p style={{ margin: 0, color: 'var(--neutral-600)' }}><strong>Full:</strong> {selectedEvent.fullDescription || 'No full description available.'}</p>
            </div>

            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 600 }}>Tickets</h4>
              {selectedTickets.length === 0 ? (
                <div style={{ color: 'var(--neutral-400)', fontStyle: 'italic' }}>No ticket details available.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {selectedTickets.map((ticket) => (
                    <div key={ticket.id} style={{ border: '1px solid var(--neutral-100)', borderRadius: '10px', padding: '12px', background: 'var(--white)' }}>
                      <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>{ticket.name}</div>
                      <div style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: '8px' }}>{formatMoney(ticket.price)}</div>
                      <div style={{ color: 'var(--neutral-400)', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Total: {ticket.totalQuantity || 0}</span>
                        <span>Avail: {ticket.availableQuantity || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
      <AdminConfirmModal
        confirm={confirm}
        loading={saving}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.onConfirm?.()}
      />
    </div>
  );
}
