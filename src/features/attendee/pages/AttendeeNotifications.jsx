import { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../lib/axios';
import Button from '../../../components/ui/Button';
import Spinner from '../../../components/common/Spinner';
import { formatDateTime } from '../../../utils/formatters';

export default function AttendeeNotifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [marking, setMarking] = useState(false);

  async function loadNotifications() {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/notifications?size=200');
      setItems(res.data?.content || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadNotifications(); }, []);

  const unreadCount = useMemo(() => items.filter(item => !item.isRead).length, [items]);
  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    return items.filter(item =>
      (item.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.message || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  async function markRead(item) {
    await axiosInstance.patch(`/notifications/${item.id}/status`, { isRead: true });
    setItems(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));
  }

  async function markAllRead() {
    try {
      setMarking(true);
      await axiosInstance.post('/notifications/read-all');
      setItems(prev => prev.map(n => ({ ...n, isRead: true })));
    } finally {
      setMarking(false);
    }
  }

  if (loading) return <Spinner label="Loading notifications..." />;

  return (
    <div className="view-container">
      <header className="view-header">
        <h2 className="view-title">Notifications</h2>
        <p style={{ color: 'var(--neutral-400)', fontSize: 14 }}>Updates about your bookings and events.</p>
      </header>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          className="form-input"
          placeholder="Search notifications..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 220 }}
        />
        {unreadCount > 0 && (
          <Button variant="secondary" onClick={markAllRead} disabled={marking}>
            {marking ? 'Marking...' : `Mark All Read (${unreadCount})`}
          </Button>
        )}
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {filtered.map(item => (
          <div key={item.id} style={{ background: 'white', border: '1px solid var(--neutral-100)', borderLeft: item.isRead ? '1px solid var(--neutral-100)' : '3px solid var(--primary)', borderRadius: 12, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  {!item.isRead && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />}
                  <h3 style={{ margin: 0, fontSize: 15 }}>{item.title}</h3>
                </div>
                <p style={{ margin: 0, color: 'var(--neutral-600)', fontSize: 14, lineHeight: 1.6 }}>{item.message}</p>
                <div style={{ fontSize: 12, color: 'var(--neutral-400)', marginTop: 10 }}>{formatDateTime(item.createdAt)}</div>
              </div>
              {!item.isRead && <Button variant="table" onClick={() => markRead(item)}>Mark Read</Button>}
            </div>
          </div>
        ))}
        {!filtered.length && (
          <div style={{ padding: 48, textAlign: 'center', background: 'white', border: '1px solid var(--neutral-100)', borderRadius: 12, color: 'var(--neutral-400)' }}>
            No notifications found.
          </div>
        )}
      </div>
    </div>
  );
}
