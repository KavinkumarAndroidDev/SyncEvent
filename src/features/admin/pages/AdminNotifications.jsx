import { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../lib/axios';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Pagination from '../../../components/ui/Pagination';

const PAGE_SIZE = 8;

const EMPTY_FORM = {
  title: '',
  message: '',
  targetRole: '',
};

export default function AdminNotifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  async function loadHistory() {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/notifications/broadcast-history?size=200');
      setItems(res.data.content || []);
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Failed to load notification history.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const text = `${item.title || ''} ${item.message || ''} ${item.targetRole || ''}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [items, search]);

  const totalPages = Math.ceil(filteredItems.length / PAGE_SIZE);
  const pagedItems = filteredItems.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  async function sendBroadcast() {
    if (!form.title.trim() || !form.message.trim()) {
      setMessageType('error');
      setMessage('Title and message are required.');
      return;
    }

    try {
      setSaving(true);
      await axiosInstance.post('/notifications/broadcast', {
        title: form.title.trim(),
        message: form.message.trim(),
        targetRole: form.targetRole || null,
      });
      setMessageType('success');
      setMessage('Broadcast sent successfully.');
      setForm(EMPTY_FORM);
      setShowModal(false);
      await loadHistory();
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Could not send broadcast.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <h2 className="view-title">Notifications</h2>
          <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>Send platform broadcasts and review sent history.</p>
        </div>
        <Button onClick={() => setShowModal(true)}>Send Broadcast</Button>
      </div>

      {message && <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>{message}</div>}

      <input
        className="form-input"
        style={{ marginBottom: 20, maxWidth: 420 }}
        placeholder="Search broadcasts..."
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
              <th>Title</th>
              <th>Target</th>
              <th>Recipients</th>
              <th>Sent By</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {!loading && pagedItems.map((item, index) => (
              <tr key={item.id}>
                <td>{page * PAGE_SIZE + index + 1}</td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--neutral-400)', marginTop: 4, maxWidth: 320 }}>{item.message}</div>
                </td>
                <td>{item.targetRole || 'ALL'}</td>
                <td>{item.recipientCount || 0}</td>
                <td>{item.sentByName || '-'}</td>
                <td>{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</td>
              </tr>
            ))}
            {!loading && pagedItems.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--neutral-400)' }}>
                  No broadcasts found.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--neutral-400)' }}>
                  Loading notification history...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal
        isOpen={showModal}
        title="Send Broadcast"
        onClose={() => setShowModal(false)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
            <Button onClick={sendBroadcast} loading={saving}>Send</Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>Title</label>
            <input className="form-input" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
          </div>
          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>Message</label>
            <textarea className="form-input" rows={4} value={form.message} onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))} />
          </div>
          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>Target Role</label>
            <select className="form-input" value={form.targetRole} onChange={(e) => setForm((prev) => ({ ...prev, targetRole: e.target.value }))}>
              <option value="">All Users</option>
              <option value="ATTENDEE">Attendees</option>
              <option value="ORGANIZER">Organizers</option>
              <option value="ADMIN">Admins</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
