import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Pagination from '../../../components/ui/Pagination';
import { formatDateTime } from '../../../utils/formatters';
import AdminConfirmModal from '../components/AdminConfirmModal';
import {
  fetchAdminBroadcasts,
  fetchAdminInbox,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  sendAdminBroadcast
} from '../slices/adminSlice';

const EMPTY_FORM = {
  title: '',
  message: '',
  targetRole: '',
};

export default function AdminNotifications() {
  const dispatch = useDispatch();
  const {
    broadcasts: items,
    inbox: personalNotifications,
    saving,
  } = useSelector((s) => s.admin);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [confirm, setConfirm] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [activeTab, setActiveTab] = useState('broadcast');

  async function loadHistory() {
    try {
      await dispatch(fetchAdminBroadcasts()).unwrap();
    } catch (err) {
      setMessageType('error');
      setMessage(err || 'Failed to load history.');
    }
  }

  useEffect(() => {
    if (activeTab === 'broadcast') {
      dispatch(fetchAdminBroadcasts()).unwrap().catch((err) => {
        setMessageType('error');
        setMessage(err || 'Failed to load history.');
      });
    } else {
      dispatch(fetchAdminInbox());
    }
  }, [activeTab, dispatch]);

  async function markRead(id) {
    dispatch(markAdminNotificationRead(id));
  }

  async function markAllRead() {
    dispatch(markAllAdminNotificationsRead());
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
      setMessage('Mandatory fields missing.');
      return;
    }

    try {
      const msg = await dispatch(sendAdminBroadcast(form)).unwrap();
      setMessageType('success');
      setMessage(msg);
      setForm(EMPTY_FORM);
      setShowModal(false);
      setConfirm(null);
      await loadHistory();
    } catch (err) {
      setMessageType('error');
      setMessage(err || 'Dispatch failed.');
    }
  }

  function askSendBroadcast() {
    if (!form.title.trim() || !form.message.trim()) return;
    setConfirm({
      title: 'Confirm Broadcast',
      message: `Dispatching to ${form.targetRole || 'all platform users'}. Are you sure?`,
      onConfirm: sendBroadcast,
    });
  }

  return (
    <div style={{ padding: 40 }}>
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h2 className="view-title">Notifications</h2>
          <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>Manage system-wide broadcasts and personal alerts.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {activeTab === 'broadcast' && <Button onClick={() => setShowModal(true)}>New Notification</Button>}
          {activeTab === 'inbox' && <Button variant="secondary" onClick={markAllRead}>Clear Inbox</Button>}
        </div>
      </div>

      {message && <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>{message}</div>}

      <div style={{ display: 'flex', gap: 32, borderBottom: '1px solid var(--neutral-100)', marginBottom: 28 }}>
        <button onClick={() => setActiveTab('broadcast')} style={{ padding: '12px 0', border: 'none', background: 'none', borderBottom: activeTab === 'broadcast' ? '2px solid var(--primary)' : 'none', color: activeTab === 'broadcast' ? 'var(--primary)' : 'var(--neutral-400)', fontWeight: 600, cursor: 'pointer' }}>Sent Broadcasts</button>
        <button onClick={() => setActiveTab('inbox')} style={{ padding: '12px 0', border: 'none', background: 'none', borderBottom: activeTab === 'inbox' ? '2px solid var(--primary)' : 'none', color: activeTab === 'inbox' ? 'var(--primary)' : 'var(--neutral-400)', fontWeight: 600, cursor: 'pointer' }}>My Inbox</button>
      </div>

      {activeTab === 'broadcast' ? (
        <>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
            <input className="form-input" style={{ flex: 1, minWidth: 220 }} placeholder="Search broadcasts..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
            <div className="admin-stat-card">
              <div className="admin-stat-label">Total Broadcasts</div>
              <div className="admin-stat-value">{items.length}</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-label">Total Recipients</div>
              <div className="admin-stat-value">{items.reduce((acc, curr) => acc + (curr.recipientCount || 0), 0)}</div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Recipients</th>
                  <th>Sent At</th>
                </tr>
              </thead>
              <tbody>
                {pagedItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--neutral-400)', maxWidth: 400 }}>{item.message}</div>
                    </td>
                    <td><span className="badge badge-table">{item.targetRole || 'GLOBAL'}</span></td>
                    <td style={{ fontSize: 13 }}>{formatDateTime(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {personalNotifications.map(n => (
            <div key={n.id} style={{ padding: 20, background: n.read ? 'var(--white)' : 'var(--neutral-50)', border: '1px solid var(--neutral-100)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h4 style={{ margin: 0, fontSize: 15 }}>{n.title}</h4>
                  {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }}></span>}
                </div>
                <p style={{ margin: '4px 0', fontSize: 14, color: 'var(--neutral-500)' }}>{n.message}</p>
                <div style={{ fontSize: 12, color: 'var(--neutral-400)' }}>{formatDateTime(n.createdAt)}</div>
              </div>
              {!n.read && <Button variant="table" onClick={() => markRead(n.id)}>Dismiss</Button>}
            </div>
          ))}
          {personalNotifications.length === 0 && <div style={{ padding: 60, textAlign: 'center', color: 'var(--neutral-400)' }}>No personal alerts found.</div>}
        </div>
      )}

      <Modal
        isOpen={showModal}
        title="Compose System Broadcast"
        onClose={() => setShowModal(false)}
        actions={
          <div style={{ display: 'flex', gap: 12 }}>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={askSendBroadcast} loading={saving}>Send</Button>
          </div>
        }
      >
        <div style={{ display: 'grid', gap: 20 }}>
          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>Alert Title</label>
            <input className="form-input" value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Scheduled Maintenance" />
          </div>
          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>Detailed Message</label>
            <textarea className="form-input" rows={4} value={form.message} onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Provide clear information to the recipients..." />
          </div>
          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>Target Audience</label>
            <select className="form-input" value={form.targetRole} onChange={(e) => setForm(p => ({ ...p, targetRole: e.target.value }))}>
              <option value="">All Users (Global)</option>
              <option value="ATTENDEE">Attendees Only</option>
              <option value="ORGANIZER">Organizers Only</option>
              <option value="ADMIN">Administrators Only</option>
            </select>
          </div>
        </div>
      </Modal>

      <AdminConfirmModal confirm={confirm} loading={saving} onClose={() => setConfirm(null)} onConfirm={() => confirm?.onConfirm?.()} />
    </div>
  );
}
