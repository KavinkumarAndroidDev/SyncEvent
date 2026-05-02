import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  getEventStatusLabel, 
  canSubmitForApproval, 
  canPublishEvent, 
  canOrganizerCancelEvent,
  canEditEvent,
  isFutureEvent,
  isEventActive,
  formatPercent
} from '../utils/organizerHelpers';
import { formatDateTime, formatMoney } from '../../../utils/formatters';
import { exportCsv } from '../../admin/utils/adminUtils';
import Button from '../../../components/ui/Button';
import AdminConfirmModal from '../../admin/components/AdminConfirmModal';
import Modal from '../../../components/ui/Modal';
import { Link } from 'react-router-dom';
import Spinner from '../../../components/common/Spinner';
import OrgPageHeader from '../components/OrgPageHeader';
import OrgStatCard from '../components/OrgStatCard';
import OrgToast from '../components/OrgToast';
import OrgStatusBadge from '../components/OrgStatusBadge';
import { useToast } from '../components/orgHooks.jsx';
import {
  checkInOrganizerParticipant,
  fetchOrganizerEvents,
  fetchOrganizerHub,
  saveOrganizerTicket,
  sendOrganizerAnnouncement,
  updateOrganizerEventStatus,
  updateOrganizerTicketStatus
} from '../slices/organizerSlice';

function getTicketDisplayStatus(item) {
  const now = new Date();
  const start = item.saleStartTime ? new Date(item.saleStartTime) : null;
  const end = item.saleEndTime ? new Date(item.saleEndTime) : null;
  if (item.status !== 'ACTIVE') return 'Inactive';
  if (start && now < start) return 'Upcoming';
  if (end && now > end) return 'Ended';
  return 'Active';
}

export default function OrganizerEvents() {
  const dispatch = useDispatch();
  const {
    events,
    eventReports,
    hubData,
    loading,
    hubLoading,
    saving: updating,
  } = useSelector((s) => s.organizer);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortFilter, setSortFilter] = useState('startTime,desc');
  const [search, setSearch] = useState('');
  
  const [confirmModal, setConfirmModal] = useState(null);
  const [manageEvent, setManageEvent] = useState(null);
  const [manageTab, setManageTab] = useState('overview');
  const { toast, showToast } = useToast();
  const [openActionId, setOpenActionId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const [editingTicket, setEditingTicket] = useState(null);
  const [newTicket, setNewTicket] = useState(null);
  const checkInEnabled = isEventActive(manageEvent?.startTime, manageEvent?.endTime);

  const loadEvents = useCallback(async () => {
    try {
      await dispatch(fetchOrganizerEvents({ statusFilter, sortFilter })).unwrap();
    } catch (err) {
      showToast(err || 'Failed to load events.', 'error');
    }
  }, [dispatch, sortFilter, statusFilter, showToast]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      if (newStatus === 'PUBLISHED') {
        const evt = events.find(e => e.id === id);
        if (evt && new Date(evt.startTime) < new Date()) {
          showToast('Cannot publish an event with a past start date.', 'error');
          setConfirmModal(null);
          return;
        }
      }
      await dispatch(updateOrganizerEventStatus({ id, status: newStatus })).unwrap();
      showToast(`Status updated to ${getEventStatusLabel(newStatus)}.`);
      setConfirmModal(null);
      if (manageEvent?.id === id) setManageEvent(prev => ({ ...prev, status: newStatus }));
      await loadEvents();
    } catch (err) {
      showToast(err || 'Failed to update event status.', 'error');
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
    setOpenActionId(null);
    try {
      await dispatch(fetchOrganizerHub(event.id)).unwrap();
    } catch (err) {
      showToast(err || 'Some event data could not be loaded.', 'error');
    }
  };

  const getTicketsSold = (item) => {
    if (!item) return 0;
    const report = eventReports[item.id];
    if (report) return Number(report.confirmedRegistrations || 0);
    return 0;
  };


  const eventsStats = useMemo(() => ({
    total: events.length,
    live: events.filter(e => e.status === 'PUBLISHED').length,
    draft: events.filter(e => ['DRAFT', 'PENDING_APPROVAL'].includes(e.status)).length,
    completed: events.filter(e => e.status === 'COMPLETED').length,
  }), [events]);

  const filteredEvents = useMemo(() => {
    let list = [...events];
    if (search) {
      list = list.filter(e => e.title?.toLowerCase().includes(search.toLowerCase()));
    }
    
    if (sortFilter === 'status,asc') {
      list.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
    }
    
    return list;
  }, [events, search, sortFilter]);

  const exportData = () => {
    exportCsv('events-list.csv',
      ['ID', 'Title', 'Venue', 'City', 'Category', 'Start Date', 'Status', 'Tickets Sold', 'Net Revenue'],
      filteredEvents.map(e => {
        const r = eventReports[e.id];
        return [
          e.id, e.title,
          e.venueName || e.venue?.name || '',
          e.city || e.venue?.city || '',
          e.categoryName || e.category?.name || '',
          e.startTime,
          e.status,
          getTicketsSold(e),
          r ? Number(r.netRevenue || 0).toFixed(2) : '0.00'
        ];
      })
    );
  };

  const sendAnnouncement = async (e) => {
    e.preventDefault();
    const subject = e.target.subject.value;
    const msg = e.target.message.value;
    if (!subject || !msg) return;
    try {
      await dispatch(sendOrganizerAnnouncement({ eventId: manageEvent.id, subject, message: msg })).unwrap();
      showToast('Update sent to all registered attendees!');
      e.target.reset();
    } catch (err) {
      showToast(err || 'Failed to send the update. Please try again.', 'error');
    }
  };

  const menuItemStyle = {
    display: 'flex', alignItems: 'center', gap: 8,
    width: '100%', textAlign: 'left', padding: '9px 14px',
    background: 'none', border: 'none', borderRadius: 8, fontSize: 13,
    fontWeight: 500, cursor: 'pointer', color: 'var(--neutral-700)',
    transition: 'background 0.15s',
  };

  return (
    <div style={{ padding: 40 }} onClick={() => setOpenActionId(null)}>
      <OrgPageHeader
        title="My Events"
        subtitle="Create, manage, and track all your events in one place."
        actions={
          <div style={{ display: 'flex', gap: 12 }}>
            <Button variant="secondary" onClick={exportData}>Export Events</Button>
            <Link to="/organizer/create-event" style={{ textDecoration: 'none' }}>
              <Button variant="primary">+ Create New Event</Button>
            </Link>
          </div>
        }
      />

      <OrgToast msg={toast.msg} type={toast.type} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <OrgStatCard label="Total Events"     value={eventsStats.total}     color="#6366f1" />
        <OrgStatCard label="Live Now"         value={eventsStats.live}      color="#10b981" />
        <OrgStatCard label="Drafts / Pending" value={eventsStats.draft}     color="#f59e0b" />
        <OrgStatCard label="Completed"        value={eventsStats.completed} color="var(--neutral-300)" />
      </div>

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
                    <OrgStatusBadge status={event.status} />
                    {!isFutureEvent(event.startTime) && !isEventActive(event.startTime, event.endTime) && event.status !== 'COMPLETED' && event.status !== 'CANCELLED' && (
                      <div style={{ fontSize: 10, color: 'var(--neutral-400)', marginTop: 4 }}>PAST EVENT</div>
                    )}
                  </td>
                  <td style={{ fontSize: 13 }}>
                    <div style={{ fontWeight: 600 }}>{ticketsSold} Tickets Sold</div>
                    <div style={{ fontSize: 11, color: 'var(--neutral-400)' }}>Capacity: {event.capacity}</div>
                  </td>
                  <td style={{ textAlign: 'right', position: 'relative' }}>
                    {/* Single action button → dropdown */}
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setDropdownPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
                          setOpenActionId(openActionId === event.id ? null : event.id);
                        }}
                        style={{
                          padding: '6px 14px', borderRadius: 8, border: '1px solid var(--neutral-200)',
                          background: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6, color: 'var(--neutral-700)'
                        }}
                      >
                        Actions
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </button>
                      {openActionId === event.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            position: 'fixed',
                            top: dropdownPos.top,
                            right: dropdownPos.right,
                            zIndex: 9999,
                            background: 'white', border: '1px solid var(--neutral-100)',
                            borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                            minWidth: 190, padding: 6,
                          }}>
                          <button onClick={() => { openManageHub(event); }} style={menuItemStyle}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                            {isFuture ? 'Manage' : 'Performance'}
                          </button>
                          {isFuture && canEditEvent(event.status) && (
                            <Link to={`/organizer/events/edit/${event.id}`} style={{ textDecoration: 'none' }}>
                              <button style={menuItemStyle}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                Edit Event
                              </button>
                            </Link>
                          )}
                          {canSubmitForApproval(event.status, event.startTime) && (
                            <button onClick={() => { askStatus(event, 'PENDING_APPROVAL'); setOpenActionId(null); }} style={menuItemStyle}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                              Submit for Review
                            </button>
                          )}
                          {canPublishEvent(event.status, event.startTime) && (
                            <button onClick={() => { askStatus(event, 'PUBLISHED'); setOpenActionId(null); }} style={{ ...menuItemStyle, color: '#10b981', fontWeight: 700 }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                              Go Live
                            </button>
                          )}
                          {isFuture && canOrganizerCancelEvent(event.status, event.startTime) && (
                            <button onClick={() => { askStatus(event, 'CANCELLED'); setOpenActionId(null); }} style={{ ...menuItemStyle, color: '#ef4444' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                              Cancel Event
                            </button>
                          )}
                        </div>
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
        title={`Event Details: ${manageEvent?.title}`}
        onClose={() => setManageEvent(null)}
        maxWidth="1000px"
        actions={<Button variant="table" onClick={() => setManageEvent(null)}>Close</Button>}
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
                      <OrgStatCard
                        label="Tickets Sold"
                        value={`${Number(hubData.report?.confirmedRegistrations || 0)} / ${hubData.tickets.reduce((s, t) => s + (t.totalQuantity || 0), 0) || manageEvent?.capacity || 0}`}
                      />
                      <OrgStatCard
                        label="Event Revenue"
                        value={formatMoney(hubData.report?.netRevenue || 0)}
                        color="var(--primary)"
                      />
                      <OrgStatCard
                        label="Arrival Rate"
                        value={formatPercent(hubData.report?.attendanceRate || 0)}
                      />
                    </div>
                    <div style={{ background: 'var(--neutral-50)', padding: 20, borderRadius: 12 }}>
                      <h4 style={{ marginBottom: 12, fontSize: 15, fontWeight: 700 }}>Status & Quick Actions</h4>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <OrgStatusBadge status={manageEvent?.status} />
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
                                  {(p.status || '').replaceAll('_', ' ')}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                {p.status !== 'CHECKED_IN' && p.status !== 'CANCELLED' && (
                                  <Button variant="table" onClick={async () => {
                                    if (!checkInEnabled) {
                                      showToast('Check-in is enabled only when the event is ongoing.', 'error');
                                      return;
                                    }
                                    try {
                                      await dispatch(checkInOrganizerParticipant(p.id)).unwrap();
                                    } catch {
                                      alert('Check-in failed.');
                                    }
                                  }} disabled={!checkInEnabled}>Check In</Button>
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
                      <h4 style={{ margin: 0 }}>Ticket Tiers ({hubData.tickets.length})</h4>
                      {canEditEvent(manageEvent?.status) && !newTicket && (
                        <button
                          onClick={() => setNewTicket({ name: '', price: '', totalQuantity: '' })}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid var(--primary)', background: 'transparent', color: 'var(--primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                          Add Tier
                        </button>
                      )}
                    </div>

                    {newTicket && (
                      <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 12, padding: 16, marginBottom: 16, display: 'grid', gap: 10 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>New Ticket Tier</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                          <input className="form-input" placeholder="Tier name" value={newTicket.name} onChange={e => setNewTicket(p => ({ ...p, name: e.target.value }))} />
                          <input className="form-input" placeholder="Price (₹)" type="number" min="1" value={newTicket.price} onChange={e => setNewTicket(p => ({ ...p, price: e.target.value }))} />
                          <input className="form-input" placeholder="Total quantity" type="number" min="1" value={newTicket.totalQuantity} onChange={e => setNewTicket(p => ({ ...p, totalQuantity: e.target.value }))} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button onClick={() => setNewTicket(null)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--neutral-200)', background: 'white', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                          <button onClick={async () => {
                            if (!newTicket.name || !newTicket.totalQuantity) return;
                            if (Number(newTicket.price) < 1) {
                              showToast('Ticket price must be at least ₹1.', 'error');
                              return;
                            }
                            try {
                              await dispatch(saveOrganizerTicket({ eventId: manageEvent.id, form: {
                                name: newTicket.name,
                                price: Number(newTicket.price),
                                totalQuantity: Number(newTicket.totalQuantity),
                              }})).unwrap();
                              setNewTicket(null);
                              showToast('Ticket tier added.');
                            } catch (err) {
                              showToast(err || 'Failed to add ticket tier.', 'error');
                            }
                          }} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Save Tier</button>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'grid', gap: 12 }}>
                      {hubData.tickets.map(t => (
                        <div key={t.id} style={{ border: '1px solid var(--neutral-100)', borderRadius: 12, overflow: 'hidden' }}>
                          {editingTicket?.id === t.id ? (
                            <div style={{ padding: 16, background: '#fafafa', display: 'grid', gap: 10 }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                                <input className="form-input" value={editingTicket.name} onChange={e => setEditingTicket(p => ({ ...p, name: e.target.value }))} placeholder="Name" />
                                <input className="form-input" type="number" min="1" value={editingTicket.price} onChange={e => setEditingTicket(p => ({ ...p, price: e.target.value }))} placeholder="Price" />
                                <input className="form-input" type="number" value={editingTicket.totalQuantity} onChange={e => setEditingTicket(p => ({ ...p, totalQuantity: e.target.value }))} placeholder="Quantity" />
                              </div>
                              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button onClick={() => setEditingTicket(null)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--neutral-200)', background: 'white', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                                <button onClick={async () => {
                                  try {
                                    if (Number(editingTicket.price) < 1) {
                                      showToast('Ticket price must be at least ₹1.', 'error');
                                      return;
                                    }
                                    await dispatch(saveOrganizerTicket({ eventId: manageEvent.id, editingTicket: t, form: {
                                      name: editingTicket.name,
                                      price: Number(editingTicket.price),
                                      totalQuantity: Number(editingTicket.totalQuantity),
                                    }})).unwrap();
                                    setEditingTicket(null);
                                    showToast('Ticket tier updated.');
                                  } catch (err) {
                                    showToast(err || 'Failed to update.', 'error');
                                  }
                                }} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Save</button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
                              <div>
                                <div style={{ fontWeight: 700 }}>{t.name}</div>
                                <div style={{ fontSize: 13, color: 'var(--neutral-400)', marginTop: 2 }}>
                                  {(t.totalQuantity || 0) - (t.availableQuantity || 0)} sold · {t.availableQuantity} remaining of {t.totalQuantity}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 17 }}>{formatMoney(t.price)}</div>
                                  <span className={`badge badge-${t.status === 'ACTIVE' ? 'completed' : 'cancelled'}`} style={{ fontSize: 10 }}>{getTicketDisplayStatus(t)}</span>
                                </div>
                                {canEditEvent(manageEvent?.status) && (
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <button onClick={() => setEditingTicket({ ...t })} style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid var(--neutral-200)', background: 'white', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                      Edit
                                    </button>
                                    <button onClick={async () => {
                                      try {
                                        const newStatus = t.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                                        await dispatch(updateOrganizerTicketStatus(t)).unwrap();
                                        showToast(`Ticket ${newStatus === 'ACTIVE' ? 'activated' : 'suspended'}.`);
                                      } catch {
                                        showToast('Failed to update ticket status.', 'error');
                                      }
                                    }} style={{ padding: '5px 10px', borderRadius: 7, border: `1px solid ${t.status === 'ACTIVE' ? '#fca5a5' : '#86efac'}`, background: 'white', fontSize: 12, cursor: 'pointer', color: t.status === 'ACTIVE' ? '#ef4444' : '#16a34a' }}>
                                      {t.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {!hubData.tickets.length && <div style={{ textAlign: 'center', padding: 32, color: 'var(--neutral-400)' }}>No ticket tiers created yet.</div>}
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


