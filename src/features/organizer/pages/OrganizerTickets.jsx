import { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../lib/axios';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Spinner from '../../../components/common/Spinner';
import { formatDateTime, formatMoney } from '../../../utils/formatters';
import { getTicketSold, toDateTimeInput, isFutureEvent, isEventActive } from '../utils/organizerHelpers';
import { exportCsv } from '../../admin/utils/adminUtils';

const EMPTY_FORM = { name: '', price: '', totalQuantity: '', saleStartTime: '', saleEndTime: '' };

function getTicketDisplayStatus(item) {
  const now = new Date();
  const start = item.saleStartTime ? new Date(item.saleStartTime) : null;
  const end = item.saleEndTime ? new Date(item.saleEndTime) : null;
  if (item.status !== 'ACTIVE') return 'Inactive';
  if (start && now < start) return 'Upcoming';
  if (end && now > end) return 'Ended';
  return 'Active';
}

export default function OrganizerTickets() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmToggle, setShowConfirmToggle] = useState(null);
  const [editingTicket, setEditingTicket] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const [search, setSearch] = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 4000);
  };

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/events?size=200&sort=startTime,desc');
        const eventItems = res.data?.content || [];
        setEvents(eventItems);
        if (eventItems.length) setSelectedEventId(String(eventItems[0].id));
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to load events.', 'error');
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
        showToast(err.response?.data?.message || 'Failed to load tickets.', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadTickets();
  }, [selectedEventId]);

  const selectedEvent = useMemo(() => events.find((item) => String(item.id) === String(selectedEventId)), [events, selectedEventId]);
  const isFuture = useMemo(() => isFutureEvent(selectedEvent?.startTime), [selectedEvent]);
  const isOngoing = useMemo(() => isEventActive(selectedEvent?.startTime, selectedEvent?.endTime), [selectedEvent]);
  const selectedStatus = String(selectedEvent?.status || '').toUpperCase();
  const canManageTickets = isFuture && selectedStatus !== 'COMPLETED' && selectedStatus !== 'CANCELLED';
  const quantityLocked = ['PUBLISHED', 'APPROVED', 'COMPLETED'].includes(selectedStatus);

  const stats = useMemo(() => {
    const totalSold = tickets.reduce((sum, item) => sum + getTicketSold(item), 0);
    const totalRevenue = tickets.reduce((sum, item) => sum + (getTicketSold(item) * Number(item.price || 0)), 0);
    return {
      total: tickets.length,
      active: tickets.filter((item) => item.status === 'ACTIVE').length,
      sold: totalSold,
      available: tickets.reduce((sum, item) => sum + Number(item.availableQuantity || 0), 0),
      revenue: totalRevenue,
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    if (!search) return tickets;
    return tickets.filter(t => t.name?.toLowerCase().includes(search.toLowerCase()));
  }, [tickets, search]);

  const exportData = () => {
    exportCsv('tickets.csv',
      ['Name', 'Price', 'Sold', 'Available', 'Sale Start', 'Sale End', 'Status'],
      filteredTickets.map(t => [t.name, t.price, getTicketSold(t), t.availableQuantity || 0, t.saleStartTime, t.saleEndTime, t.status])
    );
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
      if (!canManageTickets) {
        showToast('Tickets cannot be changed for completed or ongoing events.', 'error');
        return;
      }
      if (Number(form.price) < 1) {
        showToast('Ticket price must be at least ₹1.', 'error');
        return;
      }
      setSaving(true);
      if (editingTicket) {
        await axiosInstance.put(`/tickets/${editingTicket.id}`, {
          price: Number(form.price),
          totalQuantity: quantityLocked ? Number(editingTicket.totalQuantity) : Number(form.totalQuantity),
          saleStartTime: form.saleStartTime,
          saleEndTime: form.saleEndTime,
        });
        showToast('Ticket updated successfully.');
      } else {
        await axiosInstance.post(`/events/${selectedEventId}/tickets`, {
          name: form.name,
          price: Number(form.price),
          totalQuantity: Number(form.totalQuantity),
          saleStartTime: form.saleStartTime,
          saleEndTime: form.saleEndTime,
        });
        showToast('Ticket created successfully.');
      }
      setShowModal(false);
      await reloadTickets();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save ticket.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function confirmToggleStatus() {
    const item = showConfirmToggle;
    if (!item) return;
    try {
      if (!canManageTickets) {
        showToast('Tickets cannot be activated or deactivated for completed or ongoing events.', 'error');
        setShowConfirmToggle(null);
        return;
      }
      setSaving(true);
      const nextStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await axiosInstance.patch(`/tickets/${item.id}/status`, { status: nextStatus });
      showToast(`Ticket marked as ${nextStatus === 'ACTIVE' ? 'Active' : 'Inactive'}.`);
      setShowConfirmToggle(null);
      await reloadTickets();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update ticket status.', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading && !events.length && !selectedEventId) return <Spinner label="Loading tickets..." />;

  return (
    <div style={{ padding: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 className="view-title">Ticket Management</h2>
          <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>
            Manage ticket tiers, pricing, and availability for each event.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="secondary" onClick={exportData}>Export CSV</Button>
          {canManageTickets && <Button onClick={openCreate} disabled={!selectedEventId}>+ Add Ticket</Button>}
        </div>
      </div>

      {/* Toast */}
      {toast.msg && (
        <div className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 20 }}>
          {toast.msg}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <select className="form-input" style={{ width: 300 }} value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
          {events.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
        <input
          className="form-input" style={{ flex: 1, minWidth: 200 }}
          placeholder="Search ticket names..."
          value={search} onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div className="admin-stat-card" style={{ borderTop: '4px solid #6366f1' }}>
          <div className="admin-stat-label">Ticket Types</div>
          <div className="admin-stat-value">{stats.total}</div>
          <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 4 }}>Tiers created</div>
        </div>
        <div className="admin-stat-card" style={{ borderTop: '4px solid #10b981' }}>
          <div className="admin-stat-label">Active Tiers</div>
          <div className="admin-stat-value" style={{ color: '#10b981' }}>{stats.active}</div>
          <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 4 }}>Currently on sale</div>
        </div>
        <div className="admin-stat-card" style={{ borderTop: '4px solid var(--primary)' }}>
          <div className="admin-stat-label">Tickets Sold</div>
          <div className="admin-stat-value" style={{ color: 'var(--primary)' }}>{stats.sold}</div>
          <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 4 }}>{stats.available} remaining</div>
        </div>
        <div className="admin-stat-card" style={{ borderTop: '4px solid #f59e0b' }}>
          <div className="admin-stat-label">Est. Revenue</div>
          <div className="admin-stat-value" style={{ color: '#f59e0b', fontSize: 20 }}>{formatMoney(stats.revenue)}</div>
          <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 4 }}>From ticket sales</div>
        </div>
      </div>

      {/* Past event warning */}
      {(!canManageTickets || isOngoing) && selectedEvent && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          This event is completed or ongoing. Ticket management is view-only.
        </div>
      )}

      {/* Table */}
      <div className="table-responsive">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Ticket Tier</th>
              <th>Price</th>
              <th>Sold</th>
              <th>Available / Total</th>
              <th>Sale Window</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((item) => (
              <tr key={item.id}>
                <td style={{ fontWeight: 600 }}>{item.name}</td>
                <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatMoney(item.price)}</td>
                <td>
                  <span style={{ fontWeight: 700, color: 'var(--neutral-900)' }}>{getTicketSold(item)}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 13 }}>{item.availableQuantity || 0} / {item.totalQuantity || 0}</span>
                    <div style={{ background: 'var(--neutral-100)', borderRadius: 4, height: 5, width: 80 }}>
                      <div style={{
                        height: '100%', borderRadius: 4, background: 'var(--primary)',
                        width: `${item.totalQuantity > 0 ? ((item.totalQuantity - (item.availableQuantity || 0)) / item.totalQuantity) * 100 : 0}%`
                      }} />
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: 12, color: 'var(--neutral-600)' }}>
                  <div>From: {formatDateTime(item.saleStartTime).split(',')[0]}</div>
                  <div>Until: {formatDateTime(item.saleEndTime).split(',')[0]}</div>
                </td>
                <td>
                  <span className={`badge badge-${item.status === 'ACTIVE' ? 'completed' : 'cancelled'}`}>
                    {getTicketDisplayStatus(item)}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  {canManageTickets ? (
                    <div className="row-actions" style={{ justifyContent: 'flex-end', gap: 8 }}>
                      <Button variant="table" onClick={() => openEdit(item)}>Edit</Button>
                      <Button
                        variant="table"
                        style={{ color: item.status === 'ACTIVE' ? '#ef4444' : '#10b981' }}
                        onClick={() => setShowConfirmToggle(item)}
                      >
                        {item.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--neutral-400)' }}>Archived</span>
                  )}
                </td>
              </tr>
            ))}
            {!filteredTickets.length && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--neutral-400)' }}>
                  {selectedEventId ? 'No tickets found.' : 'Select an event to view tickets.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        title={editingTicket ? `Edit: ${editingTicket.name}` : 'Add New Ticket Tier'}
        onClose={() => setShowModal(false)}
        maxWidth="620px"
        actions={
          <>
            <Button variant="table" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button loading={saving} onClick={saveTicket}>{editingTicket ? 'Save Changes' : 'Create Ticket'}</Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 16 }}>
          {!editingTicket && (
            <div>
              <label className="form-label">Ticket Name <span style={{ color: 'var(--error)' }}>*</span></label>
              <input className="form-input" placeholder="e.g. General Admission, VIP" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className="form-label">Price (₹) <span style={{ color: 'var(--error)' }}>*</span></label>
              <input className="form-input" type="number" min="1" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Total Quantity <span style={{ color: 'var(--error)' }}>*</span></label>
              <input className="form-input" type="number" min="1" value={form.totalQuantity} disabled={editingTicket && quantityLocked} onChange={(e) => setForm({ ...form, totalQuantity: e.target.value })} />
              {editingTicket && quantityLocked && <p style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 4 }}>Quantity cannot be changed for published or approved events.</p>}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className="form-label">Sale Starts <span style={{ color: 'var(--error)' }}>*</span></label>
              <input className="form-input" type="datetime-local" value={form.saleStartTime} onChange={(e) => setForm({ ...form, saleStartTime: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Sale Ends <span style={{ color: 'var(--error)' }}>*</span></label>
              <input className="form-input" type="datetime-local" value={form.saleEndTime} onChange={(e) => setForm({ ...form, saleEndTime: e.target.value })} />
            </div>
          </div>
        </div>
      </Modal>

      {/* Toggle Confirmation Modal */}
      <Modal
        isOpen={!!showConfirmToggle}
        title={showConfirmToggle?.status === 'ACTIVE' ? 'Deactivate Ticket?' : 'Activate Ticket?'}
        onClose={() => setShowConfirmToggle(null)}
        actions={
          <>
            <Button variant="table" onClick={() => setShowConfirmToggle(null)}>Cancel</Button>
            <Button loading={saving} onClick={confirmToggleStatus}
              style={{ background: showConfirmToggle?.status === 'ACTIVE' ? '#ef4444' : '#10b981', color: 'white', border: 'none' }}>
              {showConfirmToggle?.status === 'ACTIVE' ? 'Yes, Deactivate' : 'Yes, Activate'}
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--neutral-600)', lineHeight: 1.6 }}>
          {showConfirmToggle?.status === 'ACTIVE'
            ? `Deactivating "${showConfirmToggle?.name}" will stop new ticket sales immediately. Existing purchasers are not affected.`
            : `Activating "${showConfirmToggle?.name}" will allow new ticket purchases.`}
        </p>
      </Modal>
    </div>
  );
}
