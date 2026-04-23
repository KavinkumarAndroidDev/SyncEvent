import { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../lib/axios';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Pagination from '../../../components/ui/Pagination';
import { formatDateTime } from '../../../utils/formatters';
import AdminConfirmModal from '../components/AdminConfirmModal';
import { exportCsv } from '../utils/adminUtils';

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
  const [pageSize, setPageSize] = useState(10);
  const [confirm, setConfirm] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [activeTab, setActiveTab] = useState('broadcast');
  const [personalNotifications, setPersonalNotifications] = useState([]);
  const [personalLoading, setPersonalLoading] = useState(false);

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
    if (activeTab === 'broadcast') {
      loadHistory();
    } else {
      loadInbox();
    }
  }, [activeTab]);

  async function loadInbox() {
    try {
      setPersonalLoading(true);
      const res = await axiosInstance.get('/notifications?size=50');
      setPersonalNotifications(res.data.content || []);
    } catch (err) {
      console.error(err);
    } finally {
      setPersonalLoading(false);
    }
  }

  async function markRead(id) {
    try {
      await axiosInstance.patch(`/notifications/${id}/status`, { read: true });
      setPersonalNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  }

  async function markAllRead() {
    try {
      await axiosInstance.post('/notifications/read-all');
      setPersonalNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  }

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const text = `${item.title || ''} ${item.message || ''} ${item.targetRole || ''}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [items, search]);

  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const pagedItems = filteredItems.slice(page * pageSize, (page + 1) * pageSize);

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
      setConfirm(null);
      await loadHistory();
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Could not send broadcast.');
    } finally {
      setSaving(false);
    }
  }

  function askSendBroadcast() {
    if (!form.title.trim() || !form.message.trim()) {
      setMessageType('error');
      setMessage('Title and message are required.');
      return;
    }
    setConfirm({
      title: 'Send Broadcast',
      message: `Send this broadcast to ${form.targetRole || 'all users'}?`,
      onConfirm: sendBroadcast,
    });
  }

  function exportNotifications() {
    exportCsv('notifications.csv', ['ID', 'Title', 'Message', 'Target', 'Recipients', 'Sent By', 'Created'], filteredItems.map((item) => [
      item.id,
      item.title,
      item.message,
      item.targetRole || 'ALL',
      item.recipientCount,
      item.sentByName,
      item.createdAt,
    ]));
  }

  return (
    <div style={{ padding: 40 }}>
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '24px' }}>
        <div>
          <h2 className="view-title">Notifications Center</h2>
          <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>Manage broadcasts and view your personal alerts.</p>
        </div>
        {activeTab === 'broadcast' ? (
          <Button onClick={() => setShowModal(true)}>New Broadcast</Button>
        ) : (
          <Button variant="secondary" onClick={markAllRead}>Mark All as Read</Button>
        )}
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--neutral-100)', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('broadcast')}
          style={{ 
            padding: '12px 24px', 
            border: 'none', 
            background: 'none', 
            borderBottom: activeTab === 'broadcast' ? '2px solid var(--primary)' : 'none',
            color: activeTab === 'broadcast' ? 'var(--primary)' : 'var(--neutral-400)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Broadcast Tools
        </button>
        <button 
          onClick={() => setActiveTab('inbox')}
          style={{ 
            padding: '12px 24px', 
            border: 'none', 
            background: 'none', 
            borderBottom: activeTab === 'inbox' ? '2px solid var(--primary)' : 'none',
            color: activeTab === 'inbox' ? 'var(--primary)' : 'var(--neutral-400)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          My Inbox {personalNotifications.filter(n => !n.read).length > 0 && <span style={{ marginLeft: '8px', background: 'var(--primary)', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>{personalNotifications.filter(n => !n.read).length}</span>}
        </button>
      </div>

      {activeTab === 'broadcast' ? (
        <>
          {message && <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>{message}</div>}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
            <input
              className="form-input"
              style={{ flex: 1, minWidth: 220 }}
              placeholder="Search broadcast history..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
            <Button variant="secondary" onClick={exportNotifications}>Export</Button>
          </div>

          <div className="table-responsive">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Target</th>
                  <th>Recipients</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {!loading && pagedItems.map((item, index) => (
                  <tr key={item.id}>
                    <td>{page * pageSize + index + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--neutral-400)', marginTop: 4, maxWidth: 320 }}>{item.message}</div>
                    </td>
                    <td>{item.targetRole || 'ALL'}</td>
                    <td>{item.recipientCount || 0}</td>
                    <td>{formatDateTime(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--neutral-100)', overflow: 'hidden' }}>
          {personalLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--neutral-400)' }}>Loading inbox...</div>
          ) : personalNotifications.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <p style={{ color: 'var(--neutral-400)' }}>Your inbox is empty.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {personalNotifications.map(n => (
                <div 
                  key={n.id} 
                  style={{ 
                    padding: '20px', 
                    borderBottom: '1px solid var(--neutral-50)', 
                    background: n.read ? 'transparent' : 'rgba(59, 130, 246, 0.03)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <h4 style={{ margin: 0, fontSize: '15px', color: n.read ? 'var(--neutral-600)' : 'var(--neutral-900)' }}>{n.title}</h4>
                      {!n.read && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></span>}
                    </div>
                    <p style={{ margin: '4px 0', fontSize: '14px', color: 'var(--neutral-500)', lineHeight: '1.5' }}>{n.message}</p>
                    <span style={{ fontSize: '12px', color: 'var(--neutral-400)' }}>{formatDateTime(n.createdAt)}</span>
                  </div>
                  {!n.read && (
                    <Button variant="table" onClick={() => markRead(n.id)}>Mark as Read</Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={showModal}
        title="Send Broadcast"
        onClose={() => setShowModal(false)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
            <Button onClick={askSendBroadcast} loading={saving}>Send</Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>Title <span style={{ color: '#dc2626' }}>*</span></label>
            <input className="form-input" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
          </div>
          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>Message <span style={{ color: '#dc2626' }}>*</span></label>
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
      <AdminConfirmModal
        confirm={confirm}
        loading={saving}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.onConfirm?.()}
      />
    </div>
  );
}
