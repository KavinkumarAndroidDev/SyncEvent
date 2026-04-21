import { useCallback, useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../lib/axios';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Pagination from '../../../components/ui/Pagination';

const PAGE_SIZE = 8;

const STATUS_LABELS = {
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PUBLISHED: 'Published',
  CANCELLED: 'Cancelled',
};

export default function AdminEventApprovals() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING_APPROVAL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const query = `/events?status=${statusFilter}&size=200&sort=startTime,asc`;
      const res = await axiosInstance.get(query);
      setEvents(res.data.content || []);
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const filteredEvents = useMemo(() => {
    return events.filter((item) => {
      const text = `${item.title || ''} ${item.categoryName || ''} ${item.venueName || ''} ${item.city || ''}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [events, search]);

  const totalPages = Math.ceil(filteredEvents.length / PAGE_SIZE);
  const pagedEvents = filteredEvents.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  async function updateStatus(eventId, status) {
    try {
      await axiosInstance.patch(`/events/${eventId}/status`, { status });
      setMessageType('success');
      setMessage(`Event marked as ${status}.`);
      await loadEvents();
      setSelectedEvent(null);
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Could not update event status.');
    }
  }

  async function openEvent(id) {
    try {
      const res = await axiosInstance.get(`/events/${id}`);
      setSelectedEvent(res.data);
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Could not load event details.');
    }
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
                <td>{page * PAGE_SIZE + index + 1}</td>
                <td style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{item.title}</td>
                <td>{item.categoryName || '-'}</td>
                <td>{item.venueName || '-'}{item.city ? `, ${item.city}` : ''}</td>
                <td>{item.startTime ? new Date(item.startTime).toLocaleString() : '-'}</td>
                <td>
                  <div className="row-actions">
                    <Button variant="table" onClick={() => openEvent(item.id)}>View</Button>
                    {statusFilter === 'PENDING_APPROVAL' && <Button variant="table" onClick={() => updateStatus(item.id, 'APPROVED')}>Approve</Button>}
                    {statusFilter === 'PENDING_APPROVAL' && <Button variant="table" onClick={() => updateStatus(item.id, 'REJECTED')}>Reject</Button>}
                    {statusFilter === 'APPROVED' && <Button variant="table" onClick={() => updateStatus(item.id, 'PUBLISHED')}>Publish</Button>}
                    {(statusFilter === 'APPROVED' || statusFilter === 'PUBLISHED') && <Button variant="table" onClick={() => updateStatus(item.id, 'CANCELLED')}>Cancel</Button>}
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
        title={selectedEvent?.title || 'Event'}
        onClose={() => setSelectedEvent(null)}
        actions={<Button variant="table" onClick={() => setSelectedEvent(null)}>Close</Button>}
      >
        {selectedEvent && (
          <div style={{ display: 'grid', gap: 12, fontSize: 14 }}>
            <div><strong>Start:</strong> {selectedEvent.startTime ? new Date(selectedEvent.startTime).toLocaleString() : '-'}</div>
            <div><strong>End:</strong> {selectedEvent.endTime ? new Date(selectedEvent.endTime).toLocaleString() : '-'}</div>
            <div><strong>Organizer:</strong> {selectedEvent.organizer?.fullName || '-'}</div>
            <div><strong>Venue:</strong> {selectedEvent.venue?.name || '-'}{selectedEvent.venue?.city ? `, ${selectedEvent.venue.city}` : ''}</div>
            <div><strong>Category:</strong> {selectedEvent.category?.name || '-'}</div>
            <div><strong>Capacity:</strong> {selectedEvent.capacity || '-'}</div>
            <div><strong>Description:</strong> {selectedEvent.fullDescription || selectedEvent.description || 'No description available.'}</div>
          </div>
        )}
      </Modal>
    </div>
  );
}
