import { useEffect, useState } from 'react';
import Spinner from '../../../components/common/Spinner';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../lib/axios';
import Button from '../../../components/ui/Button';
import { formatMoney } from '../../../utils/formatters';
import OrgPageHeader from '../components/OrgPageHeader';
import OrgToast from '../components/OrgToast';
import { useToast } from '../components/orgHooks.jsx';

const EMPTY_FORM = {
  title: '',
  description: '',
  fullDescription: '',
  categoryId: '',
  venueId: '',
  startTime: '',
  endTime: '',
  cancellationDeadline: '',
};

const EMPTY_TICKET = { name: '', price: '', totalQuantity: '' };

function toLocalISO(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function OrganizerEditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [venues, setVenues] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ticketSaving, setTicketSaving] = useState(false);
  const { toast, showToast } = useToast();
  const [editingTicket, setEditingTicket] = useState(null);
  const [newTicket, setNewTicket] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [categoriesRes, venuesRes, eventRes, ticketsRes] = await Promise.all([
          axiosInstance.get('/categories'),
          axiosInstance.get('/venues'),
          axiosInstance.get(`/events/${id}`),
          axiosInstance.get(`/events/${id}/tickets`).catch(() => ({ data: [] })),
        ]);

        setCategories(categoriesRes.data?.content || categoriesRes.data || []);
        setVenues(venuesRes.data?.content || venuesRes.data || []);
        setTickets(Array.isArray(ticketsRes.data) ? ticketsRes.data : (ticketsRes.data?.content || []));

        const event = eventRes.data;
        const status = event.status || '';
        const isFuture = new Date(event.startTime) > new Date();
        const editable = !status || ['DRAFT', 'PENDING_APPROVAL', 'REJECTED'].includes(status);

        if (!isFuture || !editable) {
          showToast(`This event ${!isFuture ? 'has already passed' : `is "${status}" status`} and cannot be edited.`, 'error');
          setForm(null);
          return;
        }

        setForm({
          title: event.title || '',
          description: event.description || '',
          fullDescription: event.fullDescription || '',
          categoryId: event.category?.id || event.categoryId || '',
          venueId: event.venue?.id || event.venueId || '',
          startTime: toLocalISO(event.startTime),
          endTime: toLocalISO(event.endTime),
          cancellationDeadline: toLocalISO(event.cancellationDeadline),
        });
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to load event data.', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setSaving(true);
      await axiosInstance.put(`/events/${id}`, {
        title: form.title,
        description: form.description,
        fullDescription: form.fullDescription,
        categoryId: Number(form.categoryId),
        venueId: Number(form.venueId),
        startTime: form.startTime,
        endTime: form.endTime,
        cancellationDeadline: form.cancellationDeadline || null,
      });
      showToast('Event updated successfully.');
      setTimeout(() => navigate('/organizer/events'), 1000);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update event.', 'error');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  }

  async function handleAddTicket() {
    if (!newTicket?.name || !newTicket?.totalQuantity) return;
    try {
      setTicketSaving(true);
      const res = await axiosInstance.post(`/events/${id}/tickets`, {
        name: newTicket.name,
        price: Number(newTicket.price) || 0,
        totalQuantity: Number(newTicket.totalQuantity),
      });
      setTickets(prev => [...prev, res.data]);
      setNewTicket(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add ticket tier.', 'error');
    } finally {
      setTicketSaving(false);
    }
  }

  async function handleSaveTicket(t) {
    try {
      setTicketSaving(true);
      const res = await axiosInstance.put(`/tickets/${t.id}`, {
        name: editingTicket.name,
        price: Number(editingTicket.price),
        totalQuantity: Number(editingTicket.totalQuantity),
      });
      setTickets(prev => prev.map(tk => tk.id === t.id ? res.data : tk));
      setEditingTicket(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update ticket tier.', 'error');
    } finally {
      setTicketSaving(false);
    }
  }

  async function handleToggleTicketStatus(t) {
    try {
      setTicketSaving(true);
      const newStatus = t.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const res = await axiosInstance.patch(`/tickets/${t.id}/status`, { status: newStatus });
      setTickets(prev => prev.map(tk => tk.id === t.id ? res.data : tk));
    } catch (err) {
      showToast('Failed to update ticket status.', 'error');
    } finally {
      setTicketSaving(false);
    }
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}><Spinner label="Loading event details..." /></div>;
  }

  const cardStyle = { background: 'white', border: '1px solid var(--neutral-100)', borderRadius: 16, padding: 24 };
  const sectionTitle = { fontSize: 16, fontWeight: 700, marginBottom: 16, marginTop: 0, color: 'var(--neutral-900)' };

  return (
    <div style={{ padding: 40 }}>
      <OrgPageHeader
        title="Edit Event"
        subtitle="Update event details and manage ticket tiers."
      />

      <OrgToast msg={toast.msg} type={toast.type} />

      {!form ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: 60 }}>
          <p style={{ color: 'var(--neutral-400)', marginBottom: 24 }}>
            Editing is locked for this event due to its current status or schedule.
          </p>
          <Button onClick={() => navigate('/organizer/events')}>Return to Event List</Button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 24 }}>

          <form onSubmit={handleSubmit}>
            <div style={{ ...cardStyle, marginBottom: 20 }}>
              <h3 style={sectionTitle}>Event Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Title <span style={{ color: 'var(--error)' }}>*</span></label>
                  <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Short Description <span style={{ color: 'var(--error)' }}>*</span></label>
                  <textarea className="form-input" rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Full Description <span style={{ color: 'var(--error)' }}>*</span></label>
                  <textarea className="form-input" rows="5" value={form.fullDescription} onChange={(e) => setForm({ ...form, fullDescription: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">Category <span style={{ color: 'var(--error)' }}>*</span></label>
                  <select className="form-input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
                    <option value="">Select category</option>
                    {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Venue <span style={{ color: 'var(--error)' }}>*</span></label>
                  <select className="form-input" value={form.venueId} onChange={(e) => setForm({ ...form, venueId: e.target.value })} required>
                    <option value="">Select venue</option>
                    {venues.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Start Time <span style={{ color: 'var(--error)' }}>*</span></label>
                  <input className="form-input" type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">End Time <span style={{ color: 'var(--error)' }}>*</span></label>
                  <input className="form-input" type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">Cancellation Deadline</label>
                  <input className="form-input" type="datetime-local" value={form.cancellationDeadline} onChange={(e) => setForm({ ...form, cancellationDeadline: e.target.value })} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button type="button" variant="table" onClick={() => navigate('/organizer/events')}>Cancel</Button>
              <Button type="submit" loading={saving}>Save Event Details</Button>
            </div>
          </form>

          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ ...sectionTitle, marginBottom: 0 }}>Ticket Tiers</h3>
              {!newTicket && (
                <button
                  onClick={() => setNewTicket({ ...EMPTY_TICKET })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                    borderRadius: 8, border: '1px solid var(--primary)', background: 'transparent',
                    color: 'var(--primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                  </svg>
                  Add Tier
                </button>
              )}
            </div>

            {newTicket && (
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>New Ticket Tier</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label className="form-label">Tier Name <span style={{ color: 'var(--error)' }}>*</span></label>
                    <input className="form-input" placeholder="e.g. General, VIP" value={newTicket.name} onChange={e => setNewTicket(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label">Price (₹)</label>
                    <input className="form-input" type="number" min="0" placeholder="0 for free" value={newTicket.price} onChange={e => setNewTicket(p => ({ ...p, price: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label">Total Quantity <span style={{ color: 'var(--error)' }}>*</span></label>
                    <input className="form-input" type="number" min="1" placeholder="e.g. 100" value={newTicket.totalQuantity} onChange={e => setNewTicket(p => ({ ...p, totalQuantity: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setNewTicket(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--neutral-200)', background: 'white', fontSize: 13, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={handleAddTicket} disabled={ticketSaving} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    {ticketSaving ? 'Saving...' : 'Save Tier'}
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gap: 12 }}>
              {tickets.map(t => (
                <div key={t.id} style={{ border: '1px solid var(--neutral-100)', borderRadius: 12, overflow: 'hidden' }}>
                  {editingTicket?.id === t.id ? (
                    <div style={{ padding: 16, background: '#fafafa' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                        <div>
                          <label className="form-label">Tier Name</label>
                          <input className="form-input" value={editingTicket.name} onChange={e => setEditingTicket(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div>
                          <label className="form-label">Price (₹)</label>
                          <input className="form-input" type="number" value={editingTicket.price} onChange={e => setEditingTicket(p => ({ ...p, price: e.target.value }))} />
                        </div>
                        <div>
                          <label className="form-label">Total Quantity</label>
                          <input className="form-input" type="number" value={editingTicket.totalQuantity} onChange={e => setEditingTicket(p => ({ ...p, totalQuantity: e.target.value }))} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button onClick={() => setEditingTicket(null)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--neutral-200)', background: 'white', fontSize: 13, cursor: 'pointer' }}>
                          Cancel
                        </button>
                        <button onClick={() => handleSaveTicket(t)} disabled={ticketSaving} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                          {ticketSaving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{t.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--neutral-400)', marginTop: 3 }}>
                          {(t.totalQuantity || 0) - (t.availableQuantity || 0)} sold · {t.availableQuantity} available of {t.totalQuantity}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 18 }}>{formatMoney(t.price)}</div>
                          <span className={`badge badge-${t.status === 'ACTIVE' ? 'completed' : 'cancelled'}`} style={{ fontSize: 10 }}>
                            {t.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => setEditingTicket({ ...t })}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--neutral-200)', background: 'white', fontSize: 12, cursor: 'pointer' }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleTicketStatus(t)}
                            disabled={ticketSaving}
                            style={{
                              padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                              border: `1px solid ${t.status === 'ACTIVE' ? '#fca5a5' : '#86efac'}`,
                              background: 'white',
                              color: t.status === 'ACTIVE' ? '#ef4444' : '#16a34a'
                            }}
                          >
                            {t.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {tickets.length === 0 && !newTicket && (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--neutral-400)', fontSize: 14 }}>
                  No ticket tiers yet. Click "Add Tier" to create one.
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
