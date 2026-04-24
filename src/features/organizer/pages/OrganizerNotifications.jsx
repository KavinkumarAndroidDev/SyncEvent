import { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../lib/axios';
import Button from '../../../components/ui/Button';
import Spinner from '../../../components/common/Spinner';
import { formatDateTime } from '../../../utils/formatters';

export default function OrganizerNotifications() {
  const [events, setEvents] = useState([]);
  const [items, setItems] = useState([]); // Inbox
  const [sentHistory, setSentHistory] = useState([]); // Sent broadcasts
  const [selectedEventId, setSelectedEventId] = useState('');
  const [announcement, setAnnouncement] = useState({ title: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [activeTab, setActiveTab] = useState('inbox'); // inbox, sent, compose
  const [search, setSearch] = useState('');

  async function loadData() {
    try {
      setLoading(true);
      const [eventsRes, notificationsRes, sentRes] = await Promise.all([
        axiosInstance.get('/events?size=200&sort=startTime,desc'),
        axiosInstance.get('/notifications?size=200'),
        // Assuming there might be a way to filter notifications sent BY the user, 
        // or just fetching all and filtering client-side if needed.
        // For now, let's just use the inbox for items and we'll simulate sentHistory if backend is limited
        axiosInstance.get('/notifications?size=200') 
      ]);
      
      const eventItems = eventsRes.data?.content || [];
      setEvents(eventItems);
      setItems(notificationsRes.data?.content?.filter(n => n.isSystem) || []);
      setSentHistory(notificationsRes.data?.content?.filter(n => !n.isSystem) || []);
      
      if (eventItems.length && !selectedEventId) setSelectedEventId(String(eventItems[0].id));
    } catch (err) {
      setMessageType('error');
      setMessage('Failed to synchronize notification center.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredInbox = useMemo(() => {
    if (!search) return items;
    return items.filter(i => 
      i.title?.toLowerCase().includes(search.toLowerCase()) || 
      i.message?.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  async function sendAnnouncement() {
    if (!announcement.title || !announcement.message) return;
    try {
      setSaving(true);
      await axiosInstance.post(`/events/${selectedEventId}/notifications`, {
        ...announcement,
        isSystem: false
      });
      setMessageType('success');
      setMessage('Broadcast sent to all attendees successfully.');
      setAnnouncement({ title: '', message: '' });
      setActiveTab('sent');
      await loadData();
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Failed to dispatch broadcast.');
    } finally {
      setSaving(false);
    }
  }

  async function markAsRead(item) {
    try {
      await axiosInstance.patch(`/notifications/${item.id}/status`, { isRead: true });
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, isRead: true } : i));
    } catch (err) {}
  }

  if (loading && !items.length) return <Spinner label="Loading Notification Center..." />;

  return (
    <div style={{ padding: 40 }}>
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h2 className="view-title">Notifications & Updates</h2>
          <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>Stay informed about system alerts and send direct updates to your attendees.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant={activeTab === 'compose' ? 'primary' : 'secondary'} onClick={() => setActiveTab('compose')}>
            + Send Update
          </Button>
        </div>
      </div>

      {message && <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 24 }}>{message}</div>}

      <div style={{ display: 'flex', gap: 32, borderBottom: '1px solid var(--neutral-100)', marginBottom: 32 }}>
        {[
          { id: 'inbox', label: 'Received', count: items.filter(n => !n.isRead).length },
          { id: 'sent', label: 'Sent Updates', count: sentHistory.length },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ 
              background: 'none', border: 'none', borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              padding: '0 8px 12px 8px', fontSize: 15, fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? 'var(--neutral-900)' : 'var(--neutral-400)', cursor: 'pointer', transition: '0.2s',
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            {tab.label}
            {tab.count > 0 && <span style={{ background: tab.id === 'inbox' ? 'var(--primary)' : 'var(--neutral-100)', color: tab.id === 'inbox' ? 'white' : 'var(--neutral-600)', fontSize: 11, padding: '2px 8px', borderRadius: 10 }}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {activeTab === 'inbox' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
            <input 
              className="form-input" 
              style={{ flex: 1 }} 
              placeholder="Search notifications..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          {filteredInbox.map((item) => (
            <div key={item.id} style={{ 
              border: '1px solid var(--neutral-100)', borderRadius: 16, padding: 20, 
              background: 'white',
              boxShadow: item.isRead ? 'none' : '0 4px 12px rgba(0,0,0,0.03)',
              position: 'relative'
            }}>
              {!item.isRead && <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 4, background: 'var(--primary)', borderRadius: '0 4px 4px 0' }} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{item.title}</div>
                  </div>
                  <div style={{ color: 'var(--neutral-600)', marginTop: 12, lineHeight: 1.6 }}>{item.message}</div>
                  <div style={{ fontSize: 12, color: 'var(--neutral-400)', marginTop: 16 }}>{formatDateTime(item.createdAt)}</div>
                </div>
                {!item.isRead && (
                  <Button variant="table" onClick={() => markAsRead(item)}>Mark Read</Button>
                )}
              </div>
            </div>
          ))}
          {!filteredInbox.length && <div style={{ textAlign: 'center', padding: 60, color: 'var(--neutral-400)', background: 'var(--neutral-50)', borderRadius: 16 }}>No notifications found.</div>}
        </div>
      )}

      {activeTab === 'sent' && (
        <div style={{ display: 'grid', gap: 16 }}>
          {sentHistory.map((item) => (
            <div key={item.id} style={{ border: '1px solid var(--neutral-100)', borderRadius: 16, padding: 20, background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{item.title}</div>
                  </div>
                  <div style={{ color: 'var(--neutral-600)', marginTop: 12, lineHeight: 1.6 }}>{item.message}</div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                    <div style={{ fontSize: 12, color: 'var(--neutral-400)' }}>Sent {formatDateTime(item.createdAt)}</div>
                    <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>Event Update</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {!sentHistory.length && <div style={{ textAlign: 'center', padding: 60, color: 'var(--neutral-400)', background: 'var(--neutral-50)', borderRadius: 16 }}>You haven't sent any event updates yet.</div>}
        </div>
      )}

      {activeTab === 'compose' && (
        <div style={{ background: 'white', border: '1px solid var(--neutral-100)', borderRadius: 20, padding: 32, maxWidth: 800, boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 20, fontWeight: 700 }}>Send New Update</h3>
          <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginBottom: 32 }}>Your message will be sent instantly to all registered attendees of the selected event.</p>
          
          <div style={{ display: 'grid', gap: 24 }}>
            <div>
              <label className="form-label" style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Event</label>
              <select className="form-input" style={{ padding: '12px 16px' }} value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
                {events.map((item) => <option key={item.id} value={item.id}>{item.title} ({formatDateTime(item.startTime).split(',')[0]})</option>)}
              </select>
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Subject</label>
              <input className="form-input" style={{ padding: '12px 16px' }} placeholder="e.g. Venue Location Updated" value={announcement.title} onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })} />
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Message Content</label>
              <textarea className="form-input" rows="8" style={{ padding: '16px' }} placeholder="Provide detailed information for your attendees..." value={announcement.message} onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              <Button variant="secondary" onClick={() => setActiveTab('inbox')}>Cancel</Button>
              <Button loading={saving} disabled={!announcement.title || !announcement.message} onClick={sendAnnouncement}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                Dispatch Update
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
