import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axiosInstance from '../../../lib/axios';
import { 
  getEventStatusLabel, 
  canSubmitForApproval, 
  canPublishEvent, 
  canOrganizerCancelEvent,
  canEditEvent,
  getBadgeClass,
  isFutureEvent,
  formatPercent
} from '../utils/organizerHelpers';
import { formatDateTime, formatMoney } from '../../../utils/formatters';
import { exportCsv } from '../../admin/utils/adminUtils';
import Button from '../../../components/ui/Button';
import AdminConfirmModal from '../../admin/components/AdminConfirmModal';
import Modal from '../../../components/ui/Modal';
import { Link } from 'react-router-dom';
import Spinner from '../../../components/common/Spinner';

export default function OrganizerEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortFilter, setSortFilter] = useState('startTime,desc');
  const [search, setSearch] = useState('');
  
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  
  const [confirmModal, setConfirmModal] = useState(null);
  const [manageEvent, setManageEvent] = useState(null);
  const [manageTab, setManageTab] = useState('overview'); // overview, participants, tickets, announcements
  const [hubData, setHubData] = useState({ participants: [], tickets: [], feedbacks: [], report: null });
  const [hubLoading, setHubLoading] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      let query = `/events?size=500&sort=${sortFilter}`;
      if (statusFilter !== 'ALL') query += `&status=${statusFilter}`;
      
      const { data } = await axiosInstance.get(query);
      setEvents(data.content || []);
    } catch (err) {
      console.error(err);
      setMessage('Failed to load events.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }, [sortFilter, statusFilter]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      setUpdating(true);
      setMessage('');
      await axiosInstance.patch(`/events/${id}/status`, { status: newStatus });
      setMessageType('success');
      setMessage(`Event status successfully updated to ${getEventStatusLabel(newStatus)}.`);
      setConfirmModal(null);
      if (manageEvent?.id === id) setManageEvent(prev => ({ ...prev, status: newStatus }));
      await loadEvents();
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Failed to update event status.');
    } finally {
      setUpdating(false);
    }
  };

  const askStatus = (event, newStatus) => {
    setConfirmModal({
      title: 'Confirm Status Change',
      message: `Are you sure you want to change the status of "${event.title}" to ${getEventStatusLabel(newStatus)}?`,
      onConfirm: () => handleStatusChange(event.id, newStatus)
    });
  };

  const openManageHub = async (event) => {
    setManageEvent(event);
    setManageTab('overview');
    setHubLoading(true);
    try {
      const [partsRes, ticketsRes, feedbacksRes, reportRes] = await Promise.all([
        axiosInstance.get(`/events/${event.id}/participants?size=500`).catch(() => ({ data: { content: [] } })),
        axiosInstance.get(`/events/${event.id}/tickets`).catch(() => ({ data: [] })),
        axiosInstance.get(`/events/${event.id}/feedbacks?size=100`).catch(() => ({ data: [] })),
        axiosInstance.get(`/reports/events/${event.id}`).catch(() => ({ data: null })),
      ]);

      // Robust data normalization for participants
      let participantsList = [];
      if (Array.isArray(partsRes.data)) participantsList = partsRes.data;
      else if (partsRes.data?.content) participantsList = partsRes.data.content;
      else if (partsRes.data?.data?.content) participantsList = partsRes.data.data.content;
      else if (partsRes.data?.data && Array.isArray(partsRes.data.data)) participantsList = partsRes.data.data;

      setHubData({
        participants: participantsList,
        tickets: ticketsRes.data?.content || ticketsRes.data || [],
        feedbacks: feedbacksRes.data?.content || feedbacksRes.data || [],
        report: reportRes.data
      });
    } catch (err) {
      console.error('Failed to load hub data', err);
    } finally {
      setHubLoading(false);
    }
  };

  const getTicketsSold = (item) => {
    if (!item) return 0;
    if (hubData.report && manageEvent?.id === item?.id) {
      return hubData.report.confirmedRegistrations || 0;
    }
    // Deep check for tickets sold in the event object
    if (item.confirmedRegistrations !== undefined) return item.confirmedRegistrations;
    if (item.ticketsSold !== undefined) return item.ticketsSold;
    
    if (!item.tickets) return 0;
    return item.tickets.reduce((sum, t) => sum + ((t.totalQuantity || 0) - (t.availableQuantity || 0)), 0);
  };

  const filteredEvents = useMemo(() => {
    let list = [...events];
    if (search) {
      list = list.filter(e => e.title?.toLowerCase().includes(search.toLowerCase()));
    }
    
    if (sortFilter === 'status,asc') {
      list.sort((a, b) => a.status.localeCompare(b.status));
    }
    
    return list;
  }, [events, search, sortFilter]);

  const exportData = () => {
    exportCsv('events-list.csv', ['ID', 'Title', 'Date', 'Status', 'Tickets Sold'], filteredEvents.map(e => [
      e.id, e.title, e.startTime, e.status, getTicketsSold(e)
    ]));
  };

  const sendAnnouncement = async (e) => {
    e.preventDefault();
    const subject = e.target.subject.value;
    const message = e.target.message.value;
    if (!subject || !message) return;
    
    try {
      setUpdating(true);
      await axiosInstance.post(`/events/${manageEvent.id}/notifications`, { subject, message, isSystem: false });
      alert('Your update has been sent to all registered attendees!');
      e.target.reset();
    } catch (err) {
      alert('Failed to send the update.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h2 className="view-title">Manage Events</h2>
          <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>Create, edit, and track your events from one central place.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" onClick={exportData}>Export Events</Button>
          <Link to="/organizer/create-event" style={{ textDecoration: 'none' }}>
            <Button variant="primary">+ Create New Event</Button>
          </Link>
        </div>
      </div>

      {message && <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>{message}</div>}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <input 
          className="form-input" 
          style={{ flex: 1, minWidth: 220 }} 
          placeholder="Search your events..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
        <select 
          className="form-input" 
          style={{ width: 180 }}
          value={sortFilter}
          onChange={(e) => setSortFilter(e.target.value)}
        >
          <option value="startTime,desc">Date (Newest First)</option>
          <option value="startTime,asc">Date (Oldest First)</option>
          <option value="title,asc">Title (A-Z)</option>
          <option value="status,asc">By Status</option>
        </select>
        
        <select 
          className="form-input" 
          style={{ width: 180 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="DRAFT">Drafts</option>
          <option value="PENDING_APPROVAL">Pending Review</option>
          <option value="APPROVED">Approved</option>
          <option value="PUBLISHED">Live on Platform</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="COMPLETED">Finished</option>
        </select>
      </div>

      <div className="table-responsive">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Date & Time</th>
              <th>Status</th>
              <th>Performance</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filteredEvents.map((event) => {
              const isFuture = isFutureEvent(event.startTime);
              const ticketsSold = getTicketsSold(event);
              return (
                <tr key={event.id}>
                  <td><div style={{ fontWeight: 600 }}>{event.title}</div></td>
                  <td style={{ fontSize: 13 }}>{formatDateTime(event.startTime)}</td>
                  <td>
                    <span className={getBadgeClass(event.status)}>
                      {getEventStatusLabel(event.status)}
                    </span>
                    {!isFuture && event.status !== 'COMPLETED' && <div style={{ fontSize: 10, color: 'var(--neutral-400)', marginTop: 4 }}>PAST EVENT</div>}
                  </td>
                  <td style={{ fontSize: 13 }}>
                    <div style={{ fontWeight: 600 }}>{ticketsSold} Tickets Sold</div>
                    <div style={{ fontSize: 11, color: 'var(--neutral-400)' }}>Capacity: {event.capacity}</div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      {canSubmitForApproval(event.status, event.startTime) && (
                        <Button variant="secondary" onClick={() => askStatus(event, 'PENDING_APPROVAL')} disabled={updating}>Submit</Button>
                      )}
                      
                      {canPublishEvent(event.status, event.startTime) && (
                        <Button variant="primary" onClick={() => askStatus(event, 'PUBLISHED')} disabled={updating}>Publish</Button>
                      )}

                      {isFuture && canEditEvent(event.status) && (
                        <Link to={`/organizer/events/edit/${event.id}`} style={{ textDecoration: 'none' }}>
                          <Button variant="table">Edit</Button>
                        </Link>
                      )}

                      <Button variant="table" onClick={() => openManageHub(event)}>
                        {isFuture ? 'Manage' : 'Performance'}
                      </Button>
                      
                      {isFuture && canOrganizerCancelEvent(event.status, event.startTime) && (
                        <Button variant="table" style={{ color: 'var(--error)' }} onClick={() => askStatus(event, 'CANCELLED')} disabled={updating}>Cancel</Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && filteredEvents.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--neutral-400)' }}>No events found matching your filters.</td></tr>
            )}
            {loading && (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40 }}><Spinner label="Loading events..." /></td></tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminConfirmModal
        confirm={confirmModal}
        loading={updating}
        onClose={() => setConfirmModal(null)}
        onConfirm={() => confirmModal?.onConfirm?.()}
      />

      <Modal
        isOpen={!!manageEvent}
        title={`Event Command Center: ${manageEvent?.title}`}
        onClose={() => setManageEvent(null)}
        maxWidth="1000px"
        actions={<Button variant="table" onClick={() => setManageEvent(null)}>Close Hub</Button>}
      >
        <div style={{ display: 'flex', gap: 24 }}>
          {/* Hub Sidebar */}
          <div style={{ width: 220, borderRight: '1px solid var(--neutral-100)', paddingRight: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { id: 'overview', label: 'Overview', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> },
              { id: 'participants', label: 'Attendees', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> },
              { id: 'tickets', label: 'Tickets', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="10" rx="2"></rect><line x1="12" y1="7" x2="12" y2="17"></line></svg> },
              { id: 'announcements', label: 'Send Update', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg> },
              { id: 'reviews', label: 'Feedback', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setManageTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8, border: 'none',
                  background: manageTab === tab.id ? 'var(--primary)' : 'transparent',
                  color: manageTab === tab.id ? 'white' : 'var(--neutral-600)',
                  cursor: 'pointer', transition: '0.2s', textAlign: 'left', fontWeight: 600
                }}
              >
                <span>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>

          {/* Hub Content */}
          <div style={{ flex: 1, minHeight: 500 }}>
            {hubLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Spinner label="Syncing event data..." />
              </div>
            ) : (
              <>
                {manageTab === 'overview' && (
                  <div style={{ display: 'grid', gap: 24 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                      <div className="admin-stat-card">
                        <div className="admin-stat-label">Tickets Sold</div>
                        <div className="admin-stat-value">{getTicketsSold(manageEvent)} / {manageEvent?.capacity || 0}</div>
                      </div>
                      <div className="admin-stat-card">
                        <div className="admin-stat-label">Event Revenue</div>
                        <div className="admin-stat-value" style={{ color: 'var(--primary)' }}>{formatMoney(hubData.report?.netRevenue || 0)}</div>
                      </div>
                      <div className="admin-stat-card">
                        <div className="admin-stat-label">Arrival Rate</div>
                        <div className="admin-stat-value">{formatPercent(hubData.report?.attendanceRate || 0)}</div>
                      </div>
                    </div>
                    <div style={{ background: 'var(--neutral-50)', padding: 20, borderRadius: 12 }}>
                      <h4 style={{ marginBottom: 12, fontSize: 15, fontWeight: 700 }}>Status & Quick Actions</h4>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <span className={getBadgeClass(manageEvent?.status)}>{getEventStatusLabel(manageEvent?.status)}</span>
                          <div style={{ fontSize: 13, color: 'var(--neutral-400)', marginTop: 8 }}>Scheduled for {formatDateTime(manageEvent?.startTime)}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                          {canSubmitForApproval(manageEvent?.status, manageEvent?.startTime) && <Button onClick={() => askStatus(manageEvent, 'PENDING_APPROVAL')}>Submit Review</Button>}
                          {canPublishEvent(manageEvent?.status, manageEvent?.startTime) && <Button variant="primary" onClick={() => askStatus(manageEvent, 'PUBLISHED')}>Go Live</Button>}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 style={{ marginBottom: 12, fontSize: 15, fontWeight: 700 }}>Venue Details</h4>
                      <p style={{ fontSize: 14, color: 'var(--neutral-600)' }}>{manageEvent?.venueName || 'Online Event'} • {manageEvent?.address || 'Link shared with ticket holders'}</p>
                    </div>
                  </div>
                )}

                {manageTab === 'participants' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h4 style={{ margin: 0 }}>Registered Attendees ({hubData.participants.length})</h4>
                      <Button variant="table" onClick={() => exportCsv(`${manageEvent.id}_attendees.csv`, ['Name', 'Email', 'Phone', 'Status'], hubData.participants.map(p => [p.name, p.email, p.phone, p.status]))}>Download Attendee List</Button>
                    </div>
                    <div className="table-responsive" style={{ maxHeight: 400, overflow: 'auto' }}>
                      <table className="dashboard-table">
                        <thead><tr><th>Attendee</th><th>Phone</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
                        <tbody>
                          {hubData.participants.map((p, idx) => (
                            <tr key={idx}>
                              <td>
                                <div style={{ fontWeight: 600 }}>{p.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--neutral-400)' }}>{p.email}</div>
                              </td>
                              <td style={{ fontSize: 13 }}>{p.phone}</td>
                              <td>
                                <span className={`badge badge-${p.status === 'CHECKED_IN' ? 'completed' : 'active'}`}>
                                  {p.status?.replace('_', ' ')}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                {p.status !== 'CHECKED_IN' && p.status !== 'CANCELLED' && (
                                  <Button variant="table" onClick={async () => {
                                    try {
                                      setUpdating(true);
                                      await axiosInstance.patch(`/participants/${p.id}/status`, { status: 'CHECKED_IN' });
                                      setHubData(prev => ({
                                        ...prev,
                                        participants: prev.participants.map(item => item.id === p.id ? { ...item, status: 'CHECKED_IN' } : item)
                                      }));
                                    } catch (err) {
                                      alert('Check-in failed.');
                                    } finally {
                                      setUpdating(false);
                                    }
                                  }}>Check In</Button>
                                )}
                              </td>
                            </tr>
                          ))}
                          {!hubData.participants.length && <tr><td colSpan="4" style={{ textAlign: 'center', padding: 32, color: 'var(--neutral-400)' }}>No one has registered for this event yet.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {manageTab === 'tickets' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h4 style={{ margin: 0 }}>Ticket Tiers</h4>
                      {canEditEvent(manageEvent.status) && (
                        <Link to={`/organizer/events/edit/${manageEvent.id}`} style={{ textDecoration: 'none' }}>
                          <Button variant="table">Adjust Tiers</Button>
                        </Link>
                      )}
                    </div>
                    <div style={{ display: 'grid', gap: 12 }}>
                      {hubData.tickets.map(t => (
                        <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 16, border: '1px solid var(--neutral-100)', borderRadius: 12 }}>
                          <div>
                            <div style={{ fontWeight: 700 }}>{t.name}</div>
                            <div style={{ fontSize: 13, color: 'var(--neutral-400)' }}>{t.availableQuantity} of {t.totalQuantity} tickets left</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 18 }}>{formatMoney(t.price)}</div>
                            <span className={`badge badge-${t.status === 'ACTIVE' ? 'completed' : 'cancelled'}`} style={{ fontSize: 10 }}>{t.status}</span>
                          </div>
                        </div>
                      ))}
                      {!hubData.tickets.length && <div style={{ textAlign: 'center', padding: 32, color: 'var(--neutral-400)' }}>No ticket tiers created.</div>}
                    </div>
                  </div>
                )}

                {manageTab === 'announcements' && (
                  <div>
                    <h4 style={{ marginBottom: 16 }}>Send an Update</h4>
                    <p style={{ fontSize: 13, color: 'var(--neutral-400)', marginBottom: 20 }}>This message will be sent to the {hubData.participants.length} attendees registered for this event.</p>
                    <form onSubmit={sendAnnouncement} style={{ display: 'grid', gap: 16 }}>
                      <div>
                        <label className="form-label">Subject</label>
                        <input name="subject" className="form-input" placeholder="e.g. Venue Change or Start Time Update" required />
                      </div>
                      <div>
                        <label className="form-label">Message</label>
                        <textarea name="message" className="form-input" rows={5} placeholder="Provide clear details for your attendees..." required />
                      </div>
                      <Button variant="primary" type="submit" disabled={updating || !hubData.participants.length}>
                        {updating ? 'Sending Update...' : 'Send to All Attendees'}
                      </Button>
                    </form>
                  </div>
                )}

                {manageTab === 'reviews' && (
                  <div>
                    <h4 style={{ marginBottom: 16 }}>Attendee Feedback ({hubData.feedbacks.length})</h4>
                    <div style={{ display: 'grid', gap: 12, maxHeight: 400, overflow: 'auto' }}>
                      {hubData.feedbacks.map((f, idx) => (
                        <div key={idx} style={{ padding: 16, background: 'var(--neutral-50)', borderRadius: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ fontWeight: 600 }}>{f.attendeeName}</div>
                            <div style={{ color: '#f59e0b', display: 'flex', gap: 2 }}>
                              {[...Array(5)].map((_, i) => (
                                <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i < f.rating ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                              ))}
                            </div>
                          </div>
                          <p style={{ fontSize: 14, margin: 0, color: 'var(--neutral-600)' }}>{f.comment || 'No written feedback provided.'}</p>
                        </div>
                      ))}
                      {!hubData.feedbacks.length && <div style={{ textAlign: 'center', padding: 32, color: 'var(--neutral-400)' }}>No feedback has been received yet.</div>}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}