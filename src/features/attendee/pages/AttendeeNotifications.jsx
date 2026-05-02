import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../../components/ui/Button';
import Spinner from '../../../components/common/Spinner';
import { formatDateTime } from '../../../utils/formatters';
import { fetchAttendeeNotifications, markAllNotificationsRead, markNotificationRead } from '../slices/attendeeSlice';

export default function AttendeeNotifications() {
  const dispatch = useDispatch();
  const { notifications: items, notificationsLoading: loading, markingNotifications: marking } = useSelector((s) => s.attendee);
  const [search, setSearch] = useState('');

  useEffect(() => { dispatch(fetchAttendeeNotifications()); }, [dispatch]);

  const unreadCount = useMemo(() => items.filter(item => !item.isRead).length, [items]);
  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    return items.filter(item =>
      (item.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.message || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  function markRead(item) {
    dispatch(markNotificationRead(item));
  }

  function markAllRead() {
    dispatch(markAllNotificationsRead());
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
