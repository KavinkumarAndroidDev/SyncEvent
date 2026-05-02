import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../../components/ui/Button';
import Pagination from '../../../components/ui/Pagination';
import { formatDateTime, formatMoney } from '../../../utils/formatters';
import { exportCsv } from '../utils/adminUtils';
import { fetchAdminTicketSales, fetchAdminTicketsEvents } from '../slices/adminSlice';

export default function AdminTicketsRegistrations() {
  const dispatch = useDispatch();
  const { ticketsEvents: events, ticketSales, loading, detailLoading: detailsLoading } = useSelector((s) => s.admin);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [timeRange, setTimeRange] = useState('ALL');

  useEffect(() => {
    dispatch(fetchAdminTicketsEvents()).unwrap().then((list) => {
      if (list[0]) setSelectedEvent(list[0]);
    });
  }, [dispatch]);

  useEffect(() => {
    if (!selectedEvent?.eventId) return;
    dispatch(fetchAdminTicketSales(selectedEvent.eventId));
  }, [dispatch, selectedEvent]);

  const filteredEvents = useMemo(() => {
    let result = events.filter((item) => item.eventTitle?.toLowerCase().includes(search.toLowerCase()));
    
    if (timeRange !== 'ALL') {
      const now = new Date();
      let from = new Date();
      if (timeRange === '7d') from.setDate(now.getDate() - 7);
      else if (timeRange === '30d') from.setDate(now.getDate() - 30);
      else if (timeRange === '6m') from.setMonth(now.getMonth() - 6);
      else if (timeRange === '1y') from.setFullYear(now.getFullYear() - 1);
      
      result = result.filter(ev => new Date(ev.startTime) >= from);
    }
    
    return result;
  }, [events, search, timeRange]);

  const totalPages = Math.ceil(filteredEvents.length / pageSize);
  const pagedEvents = filteredEvents.slice(page * pageSize, (page + 1) * pageSize);

  function exportEvents() {
    exportCsv('tickets-registrations.csv', ['Event ID', 'Title', 'Status', 'Confirmed', 'Total Registrations', 'Participants', 'Revenue'], filteredEvents.map((item) => [
      item.eventId,
      item.eventTitle,
      item.status,
      item.confirmedRegistrations,
      item.totalRegistrations,
      item.totalParticipants,
      item.netRevenue,
    ]));
  }

  return (
    <div style={{ padding: 40 }}>
      <div className="view-header">
        <h2 className="view-title">Ticket Booking</h2>
        <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>Check registration counts and ticket sales event by event.</p>
      </div>

      <div className="admin-two-col">
        <div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: '24px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', padding: '4px', borderRadius: '8px' }}>
          {['ALL', '7d', '30d', '6m', '1y'].map(r => (
            <button
              key={r}
              onClick={() => { setTimeRange(r); setPage(0); }}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: 'none',
                background: timeRange === r ? 'white' : 'transparent',
                boxShadow: timeRange === r ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                color: timeRange === r ? 'var(--neutral-900)' : 'var(--neutral-500)',
                cursor: 'pointer'
              }}
            >
              {r === 'ALL' ? 'All Time' : r.toUpperCase()}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }}></div>
        <input
          className="form-input"
          style={{ width: 280 }}
          placeholder="Search event..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
        />
        <select className="form-input" style={{ width: 130 }} value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}>
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
        </select>
        <Button variant="secondary" onClick={exportEvents}>Export Data</Button>
      </div>

          <div className="table-responsive">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Event</th>
                  <th>Status</th>
                  <th>Registrations</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {!loading && pagedEvents.map((item, index) => (
                  <tr key={item.eventId}>
                    <td>{page * pageSize + index + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{item.eventTitle}</div>
                      <div style={{ fontSize: 12, color: 'var(--neutral-400)', marginTop: 4 }}>{formatDateTime(item.startTime)}</div>
                    </td>
                    <td><span className={`badge badge-${String(item.status || '').toLowerCase().replaceAll('_', '-')}`}>{item.status}</span></td>
                    <td>{item.confirmedRegistrations || 0} / {item.totalRegistrations || 0}</td>
                    <td><Button variant="table" onClick={() => setSelectedEvent(item)}>Review</Button></td>
                  </tr>
                ))}
                {!loading && pagedEvents.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--neutral-400)' }}>
                      No event reports found.
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--neutral-400)' }}>
                      Loading reports...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>

        <div className="overview-card" style={{ minHeight: 420 }}>
          <div className="card-header">
            <h3>{selectedEvent?.eventTitle || 'Event Summary'}</h3>
            {selectedEvent && <span className={`badge badge-${String(selectedEvent.status || '').toLowerCase().replaceAll('_', '-')}`}>{selectedEvent.status}</span>}
          </div>

          {selectedEvent && (
            <div className="admin-details-strip">
              <div><strong>Registrations:</strong> {selectedEvent.totalRegistrations || 0}</div>
              <div><strong>Confirmed:</strong> {selectedEvent.confirmedRegistrations || 0}</div>
              <div><strong>Participants:</strong> {selectedEvent.totalParticipants || 0}</div>
              <div><strong>Total Revenue:</strong> {formatMoney(ticketSales.reduce((sum, t) => sum + (t.revenue || 0), 0))}</div>
            </div>
          )}

          <div className="table-responsive" style={{ marginTop: 16 }}>
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Price</th>
                  <th>Sold</th>
                  <th>Left</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {!detailsLoading && ticketSales.map((item) => (
                  <tr key={item.ticketId}>
                    <td style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{item.ticketName}</td>
                    <td>{formatMoney(item.price)}</td>
                    <td>{item.soldQuantity || 0} / {item.totalQuantity || 0}</td>
                    <td>{item.availableQuantity || 0}</td>
                    <td>{formatMoney(item.revenue)}</td>
                  </tr>
                ))}
                {!detailsLoading && ticketSales.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--neutral-400)' }}>
                      No ticket sales data available.
                    </td>
                  </tr>
                )}
                {detailsLoading && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--neutral-400)' }}>
                      Loading ticket data...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
