import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../lib/axios';
import Button from '../../../components/ui/Button';
import OrgPageHeader from '../components/OrgPageHeader';
import OrgToast from '../components/OrgToast';
import { useToast } from '../components/orgHooks.jsx';

const EMPTY_TICKET = {
  name: '',
  price: '',
  totalQuantity: '',
  saleStartTime: '',
  saleEndTime: '',
};

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

export default function OrganizerCreateEvent() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [venues, setVenues] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [tickets, setTickets] = useState([{ ...EMPTY_TICKET }]);
  const [saving, setSaving] = useState(false);
  const { toast, showToast } = useToast();

  useEffect(() => {
    async function loadMetadata() {
      try {
        const [categoriesRes, venuesRes] = await Promise.all([
          axiosInstance.get('/categories'),
          axiosInstance.get('/venues'),
        ]);
        setCategories(categoriesRes.data || []);
        setVenues(venuesRes.data || []);
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to load form data.', 'error');
      }
    }
    loadMetadata();
  }, []);

  const totalCapacity = useMemo(() => {
    return tickets.reduce((sum, t) => sum + Number(t.totalQuantity || 0), 0);
  }, [tickets]);

  const selectedVenue = useMemo(() => {
    return venues.find((item) => String(item.id) === String(form.venueId));
  }, [venues, form.venueId]);

  function updateTicket(index, name, value) {
    setTickets((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, [name]: value } : item));
  }

  function addTicket() {
    setTickets((prev) => [...prev, { ...EMPTY_TICKET }]);
  }

  function removeTicket(index) {
    setTickets((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (totalCapacity <= 0) {
      showToast('Total event capacity must be at least 1. Please add ticket tiers.', 'error');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (selectedVenue?.capacity && totalCapacity > Number(selectedVenue.capacity)) {
      showToast(`Total ticket quantity cannot be more than venue capacity (${selectedVenue.capacity}).`, 'error');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const now = new Date();
    const start = new Date(form.startTime);
    const end = new Date(form.endTime);
    if (start <= now) {
      showToast('Start time must be after current time.', 'error');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (end <= start) {
      showToast('End time must be after start time.', 'error');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const invalidTicket = tickets.find((item) => Number(item.price) < 1);
    if (invalidTicket) {
      showToast('Ticket price must be at least ₹1.', 'error');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    try {
      setSaving(true);
      await axiosInstance.post('/events', {
        title: form.title,
        description: form.description,
        fullDescription: form.fullDescription,
        categoryId: Number(form.categoryId),
        venueId: Number(form.venueId),
        startTime: form.startTime,
        endTime: form.endTime,
        cancellationDeadline: form.cancellationDeadline || null,
        totalQuantity: totalCapacity,
        tickets: tickets.map((item) => ({
          name: item.name,
          price: Number(item.price),
          totalQuantity: Number(item.totalQuantity),
          saleStartTime: item.saleStartTime,
          saleEndTime: item.saleEndTime,
        })),
      });
      showToast('Event created successfully.');
      setForm(EMPTY_FORM);
      setTickets([{ ...EMPTY_TICKET }]);
      navigate('/organizer/events');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create event.', 'error');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <OrgPageHeader
        title="Create Event"
        subtitle="Add complete event details and ticket setup before submitting for approval."
      />

      <OrgToast msg={toast.msg} type={toast.type} />

      {selectedVenue?.capacity && totalCapacity > Number(selectedVenue.capacity) && (
        <div style={{ background: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', padding: '12px 16px', borderRadius: 12, marginBottom: 20, fontSize: 14, fontWeight: 600 }}>
          Warning: Total ticket quantity ({totalCapacity}) exceeds the selected venue's capacity ({selectedVenue.capacity})!
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>
        <div style={{ background: 'white', border: '1px solid var(--neutral-100)', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Title <span style={{ color: 'var(--error)' }}>*</span></label>
              <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Enter event title" required />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Short Description <span style={{ color: 'var(--error)' }}>*</span></label>
              <textarea className="form-input" rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief summary for list views" required />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Full Description <span style={{ color: 'var(--error)' }}>*</span></label>
              <textarea className="form-input" rows="6" value={form.fullDescription} onChange={(e) => setForm({ ...form, fullDescription: e.target.value })} placeholder="Detailed event information, rules, etc." required />
            </div>
            <div>
              <label className="form-label">Category <span style={{ color: 'var(--error)' }}>*</span></label>
              <select className="form-input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
                <option value="">Select category</option>
                {categories.filter((item) => item.status !== 'INACTIVE').map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Venue <span style={{ color: 'var(--error)' }}>*</span></label>
              <select className="form-input" value={form.venueId} onChange={(e) => setForm({ ...form, venueId: e.target.value })} required>
                <option value="">Select venue</option>
                {venues.filter((item) => item.status !== 'INACTIVE').map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
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
              <p style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 4 }}>Last date for attendees to get refunds.</p>
            </div>
            <div>
              <label className="form-label">Calculated Overall Capacity</label>
              <input className="form-input" type="number" value={totalCapacity} disabled style={{ background: 'var(--neutral-50)', fontWeight: 700, color: 'var(--primary)' }} />
              <p style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 4 }}>Sum of all ticket tier quantities{selectedVenue?.capacity ? ` / venue capacity ${selectedVenue.capacity}` : ''}.</p>
            </div>
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid var(--neutral-100)', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>Tickets Setup</h3>
            <Button type="button" variant="secondary" onClick={addTicket}>+ Add Ticket Tier</Button>
          </div>
          <div style={{ display: 'grid', gap: 20 }}>
            {tickets.map((ticket, index) => (
              <div key={index} style={{ border: '1px solid var(--neutral-100)', borderRadius: 12, padding: 20, position: 'relative' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Tier Name <span style={{ color: 'var(--error)' }}>*</span></label>
                    <input className="form-input" value={ticket.name} onChange={(e) => updateTicket(index, 'name', e.target.value)} placeholder="e.g. Early Bird, VIP, General" required />
                  </div>
                  <div>
                    <label className="form-label">Price (₹) <span style={{ color: 'var(--error)' }}>*</span></label>
                    <input className="form-input" type="number" min="1" value={ticket.price} onChange={(e) => updateTicket(index, 'price', e.target.value)} placeholder="Minimum ₹1" required />
                  </div>
                  <div>
                    <label className="form-label">Quantity <span style={{ color: 'var(--error)' }}>*</span></label>
                    <input className="form-input" type="number" min="1" value={ticket.totalQuantity} onChange={(e) => updateTicket(index, 'totalQuantity', e.target.value)} required />
                  </div>
                  <div>
                    <label className="form-label">Sale Start <span style={{ color: 'var(--error)' }}>*</span></label>
                    <input className="form-input" type="datetime-local" value={ticket.saleStartTime} onChange={(e) => updateTicket(index, 'saleStartTime', e.target.value)} required />
                  </div>
                  <div>
                    <label className="form-label">Sale End <span style={{ color: 'var(--error)' }}>*</span></label>
                    <input className="form-input" type="datetime-local" value={ticket.saleEndTime} onChange={(e) => updateTicket(index, 'saleEndTime', e.target.value)} required />
                  </div>
                </div>
                {tickets.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeTicket(index)}
                    style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: 20 }}
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
          <Button type="button" variant="table" onClick={() => navigate('/organizer/events')}>Discard</Button>
          <Button type="submit" loading={saving} style={{ padding: '12px 48px' }}>Create Event</Button>
        </div>
      </form>
    </div>
  );
}
