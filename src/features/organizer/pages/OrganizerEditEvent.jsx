import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../lib/axios';
import Button from '../../../components/ui/Button';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [categoriesRes, venuesRes, eventRes] = await Promise.all([
          axiosInstance.get('/categories'),
          axiosInstance.get('/venues'),
          axiosInstance.get(`/events/${id}`),
        ]);
        
        setCategories(categoriesRes.data || []);
        setVenues(venuesRes.data || []);
        
        const event = eventRes.data;
        const isFuture = new Date(event.startTime) > new Date();
        const editable = event.status === 'DRAFT' || event.status === 'PENDING_APPROVAL' || event.status === 'REJECTED';

        if (!isFuture || !editable) {
          setMessageType('error');
          setMessage(`This event is ${!isFuture ? 'in the past' : 'already ' + event.status.toLowerCase()} and cannot be modified.`);
          setForm(null); // Hide form
          return;
        }
        
        setForm({
          title: event.title || '',
          description: event.description || '',
          fullDescription: event.fullDescription || '',
          categoryId: event.categoryId || '',
          venueId: event.venueId || '',
          startTime: toLocalISO(event.startTime),
          endTime: toLocalISO(event.endTime),
          cancellationDeadline: toLocalISO(event.cancellationDeadline),
        });
      } catch (err) {
        setMessageType('error');
        setMessage(err.response?.data?.message || 'Failed to load event data.');
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
      setMessageType('success');
      setMessage('Event updated successfully.');
      setTimeout(() => navigate('/organizer/events'), 1000);
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Failed to update event.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading event details...</div>;
  }

  return (
    <div style={{ padding: 40 }}>
      <div className="view-header" style={{ marginBottom: 24 }}>
        <h2 className="view-title">Edit Event</h2>
        <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>Update the core details of your event.</p>
      </div>

      {message && <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 20 }}>{message}</div>}

      {!form ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 16, border: '1px solid var(--neutral-100)' }}>
          <p style={{ color: 'var(--neutral-400)', marginBottom: 24 }}>Editing is locked for this event due to its current status or schedule.</p>
          <Button onClick={() => navigate('/organizer/events')}>Return to Event List</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>
          <div style={{ background: 'white', border: '1px solid var(--neutral-100)', borderRadius: 16, padding: 24 }}>
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
            <Button type="submit" loading={saving}>Save Changes</Button>
          </div>
        </form>
      )}
    </div>
  );
}
