import { useCallback, useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../lib/axios';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Pagination from '../../../components/ui/Pagination';
import { formatDateTime, formatMoney } from '../../../utils/formatters';
import { exportCsv } from '../utils/adminUtils';
import Spinner from '../../../components/common/Spinner';

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [stats, setStats] = useState({ total: 0, published: 0, pending: 0, cancelled: 0 });
  const [updating, setUpdating] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const [summaryRes, pendingRes, cancelledRes] = await Promise.all([
        axiosInstance.get('/reports/summary').catch(() => ({ data: {} })),
        axiosInstance.get('/events?status=PENDING_APPROVAL&size=1').catch(() => ({ data: { totalElements: 0 } })),
        axiosInstance.get('/events?status=CANCELLED&size=1').catch(() => ({ data: { totalElements: 0 } }))
      ]);

      const summary = summaryRes.data || {};
      setStats({
        total: summary.totalEvents || 0,
        published: summary.publishedEvents || 0,
        pending: pendingRes.data?.totalElements || 0,
        cancelled: cancelledRes.data?.totalElements || 0
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      let sortParam = 'startTime,desc';
      if (sortBy === 'oldest') sortParam = 'startTime,asc';
      else if (sortBy === 'title-asc') sortParam = 'title,asc';
      else if (sortBy === 'status') sortParam = 'status,asc';

      let query = `/events?size=200&sort=${sortParam}`;
      if (statusFilter !== 'ALL') query += `&status=${statusFilter}`;

      const res = await axiosInstance.get(query);
      setEvents(res.data.content || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sortBy]);

  useEffect(() => {
    loadStats();
    loadEvents();
  }, [loadStats, loadEvents]);

  const filteredEvents = useMemo(() => {
    return [...events].filter((item) => {
      const text = `${item.title || ''} ${item.categoryName || ''} ${item.venueName || ''}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [events, search]);

  const totalPages = Math.ceil(filteredEvents.length / pageSize);
  const pagedEvents = filteredEvents.slice(page * pageSize, (page + 1) * pageSize);

  async function openEvent(id) {
    try {
      const [res, ticketRes] = await Promise.all([
        axiosInstance.get(`/events/${id}`),
        axiosInstance.get(`/events/${id}/tickets`).catch(() => ({ data: [] })),
      ]);
      setSelectedEvent(res.data);
      setSelectedTickets(ticketRes.data || []);
    } catch (err) {
      alert('Could not load event details.');
    }
  }

  async function updateEventStatus(id, status) {
    try {
      setUpdating(true);
      await axiosInstance.patch(`/events/${id}/status`, { status });
      await loadEvents();
      await loadStats();
      setSelectedEvent(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  }

  function exportEventsList() {
    exportCsv('events.csv', ['ID', 'Title', 'Category', 'Organizer', 'Status', 'Start Date'], filteredEvents.map(e => [
      e.id, e.title, e.categoryName, e.organizerName, e.status, e.startTime
    ]));
  }

  if (loading && events.length === 0) return <Spinner label="Loading events..." />;

  return (
    <div style={{ padding: 40 }}>
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h2 className="view-title">Events</h2>
          <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>Manage all events on the platform.</p>
        </div>
        <Button variant="secondary" onClick={exportEventsList}>Export Data</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="admin-stat-card" style={{ cursor: 'pointer' }} onClick={() => setStatusFilter('ALL')}>
          <div className="admin-stat-label">Total Events</div>
          <div className="admin-stat-value">{stats.total}</div>
        </div>
        <div className="admin-stat-card" style={{ cursor: 'pointer', borderLeft: '4px solid var(--primary)' }} onClick={() => setStatusFilter('PUBLISHED')}>
          <div className="admin-stat-label">Published</div>
          <div className="admin-stat-value" style={{ color: 'var(--primary)' }}>{stats.published}</div>
        </div>
        <div className="admin-stat-card" style={{ cursor: 'pointer', borderLeft: '4px solid #eab308' }} onClick={() => setStatusFilter('PENDING_APPROVAL')}>
          <div className="admin-stat-label">Pending Review</div>
          <div className="admin-stat-value" style={{ color: '#eab308' }}>{stats.pending}</div>
        </div>
        <div className="admin-stat-card" style={{ cursor: 'pointer', borderLeft: '4px solid #ef4444' }} onClick={() => setStatusFilter('CANCELLED')}>
          <div className="admin-stat-label">Cancelled</div>
          <div className="admin-stat-value" style={{ color: '#ef4444' }}>{stats.cancelled}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <input className="form-input" style={{ flex: 1, minWidth: 220 }} placeholder="Search by title, venue or category..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
        <select className="form-input" style={{ width: 160 }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
          <option value="ALL">All Statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="PENDING_APPROVAL">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select className="form-input" style={{ width: 160 }} value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(0); }}>
          <option value="newest">Recent First</option>
          <option value="oldest">Oldest First</option>
          <option value="title-asc">Title (A-Z)</option>
          <option value="status">By Status</option>
        </select>
      </div>

      <div className="table-responsive">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Organizer</th>
              <th>Venue</th>
              <th>Date & Time</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedEvents.map((item) => (
              <tr key={item.id}>
                <td style={{ fontWeight: 600 }}>{item.title}</td>
                <td style={{ fontSize: 13 }}>{item.organizerName || item.organizer?.fullName || 'Organizer'}</td>
                <td style={{ fontSize: 13 }}>{item.venueName || 'Online'}</td>
                <td style={{ fontSize: 13 }}>{formatDateTime(item.startTime)}</td>
                <td><span className={`badge badge-${item.status?.toLowerCase().replaceAll('_', '-')}`}>{item.status}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <Button variant="table" onClick={() => openEvent(item.id)}>Review</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal
        isOpen={!!selectedEvent}
        title="Event Details"
        onClose={() => setSelectedEvent(null)}
        maxWidth="900px"
        actions={
          <div style={{ display: 'flex', gap: 12 }}>
            {selectedEvent?.status === 'PENDING_APPROVAL' && (
              <Button onClick={() => updateEventStatus(selectedEvent.id, 'APPROVED')} loading={updating}>Approve</Button>
            )}
            {selectedEvent?.status === 'PENDING_APPROVAL' && (
              <Button variant="secondary" onClick={() => updateEventStatus(selectedEvent.id, 'REJECTED')} loading={updating}>Reject</Button>
            )}
            {selectedEvent?.status === 'APPROVED' && (
              <Button onClick={() => updateEventStatus(selectedEvent.id, 'PUBLISHED')} loading={updating}>Publish</Button>
            )}
            {['PUBLISHED', 'APPROVED'].includes(selectedEvent?.status) && (
              <Button variant="secondary" onClick={() => updateEventStatus(selectedEvent.id, 'CANCELLED')} loading={updating}>Cancel</Button>
            )}
            <Button variant="table" onClick={() => setSelectedEvent(null)}>Close</Button>
          </div>
        }
      >
        {selectedEvent && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ background: 'var(--neutral-50)', padding: 20, borderRadius: 12 }}>
                <h4 style={{ marginBottom: 12 }}>Detailed Information</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
                  <div><span style={{ color: 'var(--neutral-400)' }}>Category:</span> {selectedEvent.categoryName}</div>
                  <div><span style={{ color: 'var(--neutral-400)' }}>Capacity:</span> {selectedEvent.capacity}</div>
                  <div><span style={{ color: 'var(--neutral-400)' }}>Start:</span> {formatDateTime(selectedEvent.startTime)}</div>
                  <div><span style={{ color: 'var(--neutral-400)' }}>End:</span> {formatDateTime(selectedEvent.endTime)}</div>
                </div>
              </div>
              
              <div>
                <h4 style={{ marginBottom: 12 }}>Ticket Tiers</h4>
                <div style={{ display: 'grid', gap: 10 }}>
                  {selectedTickets.map(t => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, border: '1px solid var(--neutral-100)', borderRadius: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{t.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--neutral-400)' }}>{t.availableQuantity} of {t.totalQuantity} available</div>
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatMoney(t.price)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ background: 'white', border: '1px solid var(--neutral-100)', padding: 16, borderRadius: 12 }}>
                <h4 style={{ marginBottom: 8, fontSize: 14 }}>Organizer</h4>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedEvent.organizer?.fullName}</div>
                <div style={{ fontSize: 12, color: 'var(--neutral-400)' }}>{selectedEvent.organizer?.email}</div>
                <Button variant="table" style={{ marginTop: 12, width: '100%' }}>Contact Organizer</Button>
              </div>

              <div style={{ background: 'white', border: '1px solid var(--neutral-100)', padding: 16, borderRadius: 12 }}>
                <h4 style={{ marginBottom: 8, fontSize: 14 }}>Location</h4>
                <div style={{ fontSize: 13 }}>{selectedEvent.venueName || (selectedEvent.address ? 'Physical Venue' : 'Online Event')}</div>
                <div style={{ fontSize: 12, color: 'var(--neutral-400)', marginTop: 4 }}>{selectedEvent.address ? `${selectedEvent.address}, ${selectedEvent.city}` : 'Access details will be sent via email'}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
