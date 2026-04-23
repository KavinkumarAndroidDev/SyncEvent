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
  const [statusFilter, setStatusFilter] = useState('PUBLISHED');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [stats, setStats] = useState({ total: 0, published: 0, pending: 0, cancelled: 0 });

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/events?size=200');
      const data = res.data.content || [];
      setEvents(data);

      const total = data.length;
      const published = data.filter(e => e.status === 'PUBLISHED').length;
      const pending = data.filter(e => e.status === 'PENDING_APPROVAL').length;
      const cancelled = data.filter(e => e.status === 'CANCELLED').length;
      setStats({ total, published, pending, cancelled });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const filteredEvents = useMemo(() => {
    let result = events.filter((item) => {
      const text = `${item.title || ''} ${item.categoryName || ''} ${item.venueName || ''} ${item.city || ''}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    if (sortBy === 'newest') result.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    if (sortBy === 'oldest') result.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    if (sortBy === 'title-asc') result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    if (sortBy === 'title-desc') result.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
    if (sortBy === 'status') {
      const priority = { 'PENDING_APPROVAL': 1, 'APPROVED': 2, 'PUBLISHED': 3, 'DRAFT': 4, 'CANCELLED': 5, 'COMPLETED': 6, 'REJECTED': 7 };
      result.sort((a, b) => (priority[a.status] || 99) - (priority[b.status] || 99));
    }

    return result;
  }, [events, search, statusFilter, sortBy]);

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

  function exportEventsList() {
    exportCsv('all-events.csv', ['ID', 'Title', 'Category', 'Venue', 'City', 'Start', 'Status'], filteredEvents.map((item) => [
      item.id,
      item.title,
      item.categoryName,
      item.venueName,
      item.city,
      item.startTime,
      item.status,
    ]));
  }

  if (loading) return <Spinner label="Loading events..." />;

  return (
    <div style={{ padding: 40 }}>
      <div className="view-header">
        <h2 className="view-title">All Events</h2>
        <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>Manage and view all events across the platform.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'var(--white)', padding: '20px', borderRadius: '12px', border: '1px solid var(--neutral-100)' }}>
          <div style={{ fontSize: '13px', color: 'var(--neutral-400)', marginBottom: '4px' }}>Total Events</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--neutral-900)' }}>{stats.total}</div>
        </div>
        <div style={{ background: 'var(--white)', padding: '20px', borderRadius: '12px', border: '1px solid var(--neutral-100)' }}>
          <div style={{ fontSize: '13px', color: 'var(--neutral-400)', marginBottom: '4px' }}>Published</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)' }}>{stats.published}</div>
        </div>
        <div style={{ background: 'var(--white)', padding: '20px', borderRadius: '12px', border: '1px solid var(--neutral-100)' }}>
          <div style={{ fontSize: '13px', color: 'var(--neutral-400)', marginBottom: '4px' }}>Pending Approval</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#eab308' }}>{stats.pending}</div>
        </div>
        <div style={{ background: 'var(--white)', padding: '20px', borderRadius: '12px', border: '1px solid var(--neutral-100)' }}>
          <div style={{ fontSize: '13px', color: 'var(--neutral-400)', marginBottom: '4px' }}>Cancelled</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444' }}>{stats.cancelled}</div>
        </div>
      </div>

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
        <select className="form-input" style={{ width: 150 }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
          <option value="ALL">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING_APPROVAL">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="PUBLISHED">Published</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select className="form-input" style={{ width: 160 }} value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(0); }}>
          <option value="newest">Sort by Date (Newest)</option>
          <option value="oldest">Sort by Date (Oldest)</option>
          <option value="title-asc">Sort by Title (A-Z)</option>
          <option value="title-desc">Sort by Title (Z-A)</option>
          <option value="status">Sort by Status (Priority)</option>
        </select>
        <select className="form-input" style={{ width: 130 }} value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}>
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
        </select>
        <Button variant="secondary" onClick={exportEventsList}>Export</Button>
      </div>

      <div className="table-responsive">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Event</th>
              <th>Category</th>
              <th>Venue</th>
              <th>Start Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedEvents.map((item, index) => (
              <tr key={item.id}>
                <td>{page * pageSize + index + 1}</td>
                <td style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{item.title}</td>
                <td>{item.categoryName || '-'}</td>
                <td>{item.venueName || '-'}{item.city ? `, ${item.city}` : ''}</td>
                <td>{formatDateTime(item.startTime)}</td>
                <td><span className={`badge badge-${item.status?.toLowerCase()}`}>{item.status}</span></td>
                <td>
                  <Button variant="table" onClick={() => openEvent(item.id)}>View Details</Button>
                </td>
              </tr>
            ))}
            {pagedEvents.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--neutral-400)' }}>
                  No events found matching your criteria.
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
        onClose={() => setSelectedEvent(null)}
        maxWidth="800px"
        actions={<Button variant="table" onClick={() => setSelectedEvent(null)}>Close</Button>}
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

            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 600 }}>Tickets</h4>
              {selectedTickets.length === 0 ? (
                <div style={{ color: 'var(--neutral-400)', fontStyle: 'italic' }}>No tickets available.</div>
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
    </div>
  );
}
