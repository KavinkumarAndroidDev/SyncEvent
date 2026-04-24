import { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../lib/axios';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Spinner from '../../../components/common/Spinner';
import { formatDateTime, formatMoney } from '../../../utils/formatters';
import { getBadgeClass, getTicketSold, getTicketStatusAction, toDateTimeInput, isFutureEvent } from '../utils/organizerHelpers';
import { exportCsv } from '../../admin/utils/adminUtils';

const EMPTY_FORM = { name: '', price: '', totalQuantity: '', saleStartTime: '', saleEndTime: '' };

export default function OrganizerTickets() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/events?size=200&sort=startTime,desc');
        const eventItems = res.data?.content || [];
        setEvents(eventItems);
        if (eventItems.length) setSelectedEventId(String(eventItems[0].id));
      } catch (err) {
        setMessageType('error');
        setMessage(err.response?.data?.message || 'Failed to load events.');
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  useEffect(() => {
    async function loadTickets() {
      if (!selectedEventId) return;
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/events/${selectedEventId}/tickets`);
        setTickets(res.data || []);
      } catch (err) {
        setMessageType('error');
        setMessage(err.response?.data?.message || 'Failed to load tickets.');
      } finally {
        setLoading(false);
      }
    }
    loadTickets();
  }, [selectedEventId]);

  const selectedEvent = useMemo(() => events.find((item) => String(item.id) === String(selectedEventId)), [events, selectedEventId]);
  const isFuture = useMemo(() => isFutureEvent(selectedEvent?.startTime), [selectedEvent]);

  const stats = useMemo(() => ({
    total: tickets.length,
    active: tickets.filter((item) => item.status === 'ACTIVE').length,
    sold: tickets.reduce((sum, item) => sum + getTicketSold(item), 0),
    available: tickets.reduce((sum, item) => sum + Number(item.availableQuantity || 0), 0),
  }), [tickets]);

  const filteredTickets = useMemo(() => {
    if (!search) return tickets;
    return tickets.filter(t => t.name?.toLowerCase().includes(search.toLowerCase()));
  }, [tickets, search]);

  const exportData = () => {
    exportCsv('tickets.csv', ['Name', 'Price', 'Sold', 'Available', 'Sale Start', 'Sale End', 'Status'], filteredTickets.map(t => [
      t.name, t.price, getTicketSold(t), t.availableQuantity || 0, t.saleStartTime, t.saleEndTime, t.status
    ]));
  };

  function openCreate() {
    setEditingTicket(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(item) {
    setEditingTicket(item);
    setForm({
      name: item.name || '',
      price: item.price || '',
      totalQuantity: item.totalQuantity || '',
      saleStartTime: toDateTimeInput(item.saleStartTime),
      saleEndTime: toDateTimeInput(item.saleEndTime),
    });
    setShowModal(true);
  }

  async function reloadTickets() {
    const res = await axiosInstance.get(`/events/${selectedEventId}/tickets`);
    setTickets(res.data || []);
  }

  async function saveTicket() {
    try {
      setSaving(true);
      if (editingTicket) {
        await axiosInstance.put(`/tickets/${editingTicket.id}`, {
          price: Number(form.price),
          totalQuantity: Number(form.totalQuantity),
          saleStartTime: form.saleStartTime,
          saleEndTime: form.saleEndTime,
        });
        setMessageType('success');
        setMessage('Ticket updated successfully.');
      } else {
        await axiosInstance.post(`/events/${selectedEventId}/tickets`, {
          name: form.name,
          price: Number(form.price),
          totalQuantity: Number(form.totalQuantity),
          saleStartTime: form.saleStartTime,
          saleEndTime: form.saleEndTime,
        });
        setMessageType('success');
        setMessage('Ticket created successfully.');
      }
      setShowModal(false);
      await reloadTickets();
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Failed to save ticket.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(item) {
    try {
      setSaving(true);
      const nextStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await axiosInstance.patch(`/tickets/${item.id}/status`, { status: nextStatus });
      setMessageType('success');
      setMessage(`Ticket marked as ${nextStatus === 'ACTIVE' ? 'Active' : 'Inactive'}.`);
      await reloadTickets();
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Failed to update ticket status.');
    } finally {
      setSaving(false);
    }
  }

  if (loading && !events.length && !selectedEventId) return <Spinner label="Loading tickets..." />;

  return (
    <div style={{ padding: 40 }}>
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 className="view-title">Ticket Management</h2>
          <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>Manage ticket sales, stock, and sale windows for each event.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" onClick={exportData}>Export Data</Button>
          {isFuture && <Button onClick={openCreate} disabled={!selectedEventId}>Add Ticket</Button>}
        </div>
      </div>

      {message && <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 20 }}>{message}</div>}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <select className="form-input" style={{ width: 320 }} value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
          {events.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
        <input 
          className="form-input" 
          style={{ flex: 1, minWidth: 220 }} 
          placeholder="Search ticket names..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
      </div>

      <div className="admin-stat-grid" style={{ marginBottom: 24 }}>
        <div className="admin-stat-card"><div className="admin-stat-label">Selected Event</div><div className="admin-stat-value" style={{ fontSize: 20 }}>{selectedEvent?.title || '-'}</div></div>
        <div className="admin-stat-card"><div className="admin-stat-label">Ticket Types</div><div className="admin-stat-value">{stats.total}</div></div>
        <div className="admin-stat-card"><div className="admin-stat-label">Active</div><div className="admin-stat-value">{stats.active}</div></div>
        <div className="admin-stat-card"><div className="admin-stat-label">Sold</div><div className="admin-stat-value">{stats.sold}</div></div>
      </div>

      {!isFuture && selectedEvent && (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          This event is in the past. Ticket management actions have been disabled.
        </div>
      )}

      <div className="table-responsive">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Price</th>
              <th>Sold</th>
              <th>Available</th>
              <th>Sale Window</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((item) => (
              <tr key={item.id}>
                <td style={{ fontWeight: 600 }}>{item.name}</td>
                <td>{formatMoney(item.price)}</td>
                <td>{getTicketSold(item)}</td>
                <td>{item.availableQuantity || 0} / {item.totalQuantity || 0}</td>
                <td style={{ fontSize: 13 }}>{formatDateTime(item.saleStartTime)}<br />{formatDateTime(item.saleEndTime)}</td>
                <td><span className={getBadgeClass(item.status)}>{item.status}</span></td>
                <td style={{ textAlign: 'right' }}>
                  {isFuture ? (
                    <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                      <Button variant="table" onClick={() => openEdit(item)}>Edit</Button>
                      <Button variant="table" loading={saving} onClick={() => toggleStatus(item)}>{getTicketStatusAction(item.status)}</Button>
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--neutral-400)' }}>Archived</span>
                  )}
                </td>
              </tr>
            ))}
            {!filteredTickets.length && <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--neutral-400)' }}>No tickets found.</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={showModal}
        title={editingTicket ? 'Edit Ticket' : 'Add Ticket'}
        onClose={() => setShowModal(false)}
        actions={
          <>
            <Button variant="table" onClick={() => setShowModal(false)}>Close</Button>
            <Button loading={saving} onClick={saveTicket}>{editingTicket ? 'Save' : 'Create'}</Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 16 }}>
          {!editingTicket && (
            <div>
              <label className="form-label">Ticket Name <span style={{ color: 'var(--error)' }}>*</span></label>
              <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
          )}
          <div>
            <label className="form-label">Price <span style={{ color: 'var(--error)' }}>*</span></label>
            <input className="form-input" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Quantity <span style={{ color: 'var(--error)' }}>*</span></label>
            <input className="form-input" type="number" min="1" value={form.totalQuantity} onChange={(e) => setForm({ ...form, totalQuantity: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Sale Start Time <span style={{ color: 'var(--error)' }}>*</span></label>
            <input className="form-input" type="datetime-local" value={form.saleStartTime} onChange={(e) => setForm({ ...form, saleStartTime: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Sale End Time <span style={{ color: 'var(--error)' }}>*</span></label>
            <input className="form-input" type="datetime-local" value={form.saleEndTime} onChange={(e) => setForm({ ...form, saleEndTime: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
