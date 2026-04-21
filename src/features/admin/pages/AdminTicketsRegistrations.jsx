import { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../lib/axios';
import Button from '../../../components/ui/Button';
import Pagination from '../../../components/ui/Pagination';

const PAGE_SIZE = 8;

export default function AdminTicketsRegistrations() {
  const [events, setEvents] = useState([]);
  const [ticketSales, setTicketSales] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/reports/events?size=200');
        const list = res.data.content || [];
        setEvents(list);
        if (list[0]) {
          setSelectedEvent(list[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  useEffect(() => {
    async function loadTicketSales() {
      if (!selectedEvent?.eventId) return;

      try {
        setDetailsLoading(true);
        const res = await axiosInstance.get(`/reports/events/${selectedEvent.eventId}/tickets`);
        setTicketSales(res.data || []);
      } catch (err) {
        console.error(err);
        setTicketSales([]);
      } finally {
        setDetailsLoading(false);
      }
    }

    loadTicketSales();
  }, [selectedEvent]);

  const filteredEvents = useMemo(() => {
    return events.filter((item) => item.eventTitle?.toLowerCase().includes(search.toLowerCase()));
  }, [events, search]);

  const totalPages = Math.ceil(filteredEvents.length / PAGE_SIZE);
  const pagedEvents = filteredEvents.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div style={{ padding: 40 }}>
      <div className="view-header">
        <h2 className="view-title">Tickets & Registrations</h2>
        <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>Check registration counts and ticket sales event by event.</p>
      </div>

      <div className="admin-two-col">
        <div>
          <input
            className="form-input"
            style={{ marginBottom: 16 }}
            placeholder="Search event..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />

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
                    <td>{page * PAGE_SIZE + index + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{item.eventTitle}</div>
                      <div style={{ fontSize: 12, color: 'var(--neutral-400)', marginTop: 4 }}>{item.startTime ? new Date(item.startTime).toLocaleString() : '-'}</div>
                    </td>
                    <td><span className={`badge badge-${String(item.status || '').toLowerCase().replaceAll('_', '-')}`}>{item.status}</span></td>
                    <td>{item.confirmedRegistrations || 0} / {item.totalRegistrations || 0}</td>
                    <td><Button variant="table" onClick={() => setSelectedEvent(item)}>Open</Button></td>
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
              <div><strong>Revenue:</strong> Rs. {Number(selectedEvent.netRevenue || 0).toLocaleString()}</div>
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
                    <td>Rs. {Number(item.price || 0).toLocaleString()}</td>
                    <td>{item.soldQuantity || 0} / {item.totalQuantity || 0}</td>
                    <td>{item.availableQuantity || 0}</td>
                    <td>Rs. {Number(item.revenue || 0).toLocaleString()}</td>
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
