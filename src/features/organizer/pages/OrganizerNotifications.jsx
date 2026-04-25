import { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../lib/axios';
import Button from '../../../components/ui/Button';
import Spinner from '../../../components/common/Spinner';
import { formatDateTime } from '../../../utils/formatters';
import OrgPageHeader from '../components/OrgPageHeader';
import OrgStatCard from '../components/OrgStatCard';
import OrgToast from '../components/OrgToast';
import OrgEmptyState from '../components/OrgEmptyState';
import { useToast } from '../components/orgHooks.jsx';

export default function OrganizerNotifications() {
  const [inbox, setInbox] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast, showToast } = useToast();
  const [activeTab, setActiveTab] = useState('inbox');
  const [search, setSearch] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const notificationsRes = await axiosInstance.get('/notifications?size=200');
      const allNotifs = notificationsRes.data?.content || [];
      setInbox(allNotifs.filter(n => n.isSystem !== false));
      setSent(allNotifs.filter(n => n.isSystem === false));
    } catch {
      showToast('Failed to load notification center.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const unreadCount = useMemo(() => inbox.filter(n => !n.isRead).length, [inbox]);

  const filteredInbox = useMemo(() => {
    if (!search) return inbox;
    return inbox.filter(i =>
      (i.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.message || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [inbox, search]);


  async function markAsRead(item) {
    try {
      await axiosInstance.patch(`/notifications/${item.id}/status`, { isRead: true });
      setInbox(prev => prev.map(i => i.id === item.id ? { ...i, isRead: true } : i));
    } catch (err) {}
  }

  async function markAllRead() {
    try {
      setMarkingAll(true);
      const unread = inbox.filter(n => !n.isRead);
      await Promise.all(unread.map(n => axiosInstance.patch(`/notifications/${n.id}/status`, { isRead: true }).catch(() => {})));
      setInbox(prev => prev.map(i => ({ ...i, isRead: true })));
      showToast('All notifications marked as read.');
    } catch (err) {
      showToast('Some notifications could not be marked.', 'error');
    } finally {
      setMarkingAll(false);
    }
  }

  if (loading && !inbox.length && !sent.length) return <Spinner label="Loading Notification Center..." />;

  const tabs = [
    { id: 'inbox', label: 'Received', count: unreadCount },
    { id: 'sent', label: 'Sent Updates', count: null },
  ];

  return (
    <div style={{ padding: 40 }}>
      <OrgPageHeader
        title="Notifications & Updates"
        subtitle="Stay informed about system alerts and direct updates from your attendees."
      />

      <OrgToast msg={toast.msg} type={toast.type} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <OrgStatCard label="Unread"        value={unreadCount}   sub="Notifications to review"  color={unreadCount > 0 ? '#ef4444' : 'var(--neutral-400)'} />
        <OrgStatCard label="Total Received" value={inbox.length}  sub="System & admin alerts"     color="#10b981" />
        <OrgStatCard label="Updates Sent"   value={sent.length}   sub="Broadcasts to attendees"   color="#f59e0b" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--neutral-100)', marginBottom: 28 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none', border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -2, padding: '0 20px 14px', fontSize: 14,
              fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? 'var(--neutral-900)' : 'var(--neutral-400)',
              cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{ background: 'var(--primary)', color: 'white', fontSize: 11, padding: '1px 7px', borderRadius: 10 }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Inbox Tab */}
      {activeTab === 'inbox' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <input
              className="form-input" style={{ flex: 1 }}
              placeholder="Search notifications by title or message..."
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
            {unreadCount > 0 && (
              <Button variant="secondary" onClick={markAllRead} disabled={markingAll}>
                {markingAll ? 'Marking...' : `Mark All Read (${unreadCount})`}
              </Button>
            )}
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {filteredInbox.map((item) => (
              <div key={item.id} style={{
                border: '1px solid var(--neutral-100)', borderRadius: 16, padding: 20,
                background: 'white', position: 'relative',
                boxShadow: item.isRead ? 'none' : '0 4px 12px rgba(0,0,0,0.04)',
                borderLeft: item.isRead ? '1px solid var(--neutral-100)' : '3px solid var(--primary)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      {!item.isRead && (
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block', flexShrink: 0 }} />
                      )}
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{item.title}</div>
                    </div>
                    <div style={{ color: 'var(--neutral-600)', lineHeight: 1.6, fontSize: 14 }}>{item.message}</div>
                    <div style={{ fontSize: 12, color: 'var(--neutral-400)', marginTop: 12 }}>
                      {formatDateTime(item.createdAt)}
                    </div>
                  </div>
                  {!item.isRead && (
                    <Button variant="table" onClick={() => markAsRead(item)}>Mark Read</Button>
                  )}
                </div>
              </div>
            ))}
            {!filteredInbox.length && (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--neutral-400)', background: 'var(--neutral-50)', borderRadius: 16 }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 12, opacity: 0.4 }}>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <div style={{ fontSize: 15 }}>No notifications found.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sent Tab */}
      {activeTab === 'sent' && (
        <div style={{ display: 'grid', gap: 12 }}>
          {sent.map((item) => (
            <div key={item.id} style={{ border: '1px solid var(--neutral-100)', borderRadius: 16, padding: 20, background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{item.title}</div>
                  </div>
                  <div style={{ color: 'var(--neutral-600)', lineHeight: 1.6, fontSize: 14 }}>{item.message}</div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                    <div style={{ fontSize: 12, color: 'var(--neutral-400)' }}>Sent {formatDateTime(item.createdAt)}</div>
                    <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>Event Broadcast</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {!sent.length && (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--neutral-400)', background: 'var(--neutral-50)', borderRadius: 16 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 12, opacity: 0.4 }}>
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              <div style={{ fontSize: 15 }}>No event updates sent yet.</div>
              <div style={{ fontSize: 13, marginTop: 6, color: 'var(--neutral-400)' }}>Use the Send Update option inside each event's Manage panel.</div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
