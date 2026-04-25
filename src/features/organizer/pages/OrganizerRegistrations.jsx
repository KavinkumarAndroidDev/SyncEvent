import React, { useState, useEffect, useMemo } from 'react';
import axiosInstance from '../../../lib/axios';
import Button from '../../../components/ui/Button';
import { exportCsv } from '../../admin/utils/adminUtils';
import { isEventActive } from '../utils/organizerHelpers';
import { formatDateTime } from '../../../utils/formatters';

export default function OrganizerRegistrations() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [participants, setParticipants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 4000);
  };

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoadingEvents(true);
        const { data } = await axiosInstance.get('/events?size=100&sort=startTime,desc');
        const eventList = data.content || [];
        setEvents(eventList);
        if (eventList.length > 0) setSelectedEventId(eventList[0].id.toString());
      } catch (err) {
        console.error('Failed to load events', err);
      } finally {
        setLoadingEvents(false);
      }
    }
    loadEvents();
  }, []);

  useEffect(() => {
    async function loadParticipants() {
      if (!selectedEventId) { setParticipants([]); return; }
      try {
        setLoadingParticipants(true);
        const { data } = await axiosInstance.get(`/events/${selectedEventId}/participants?size=500`);
        setParticipants(data.content || []);
      } catch (err) {
        console.error('Failed to load participants', err);
        setParticipants([]);
      } finally {
        setLoadingParticipants(false);
      }
    }
    loadParticipants();
  }, [selectedEventId]);

  const handleCheckIn = async (participantId) => {
    try {
      setUpdatingId(participantId);
      await axiosInstance.patch(`/participants/${participantId}/status`, { status: 'CHECKED_IN' });
      setParticipants(prev => prev.map(p => p.id === participantId ? { ...p, status: 'CHECKED_IN' } : p));
      showToast('Attendee checked in successfully!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Check-in failed. Please try again.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredParticipants = useMemo(() => {
    let list = participants;
    if (statusFilter !== 'ALL') list = list.filter(p => p.status === statusFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.ticketCode && p.ticketCode.toLowerCase().includes(q))
      );
    }
    return list;
  }, [participants, searchQuery, statusFilter]);

  const selectedEvent = useMemo(() => events.find(e => e.id.toString() === selectedEventId), [events, selectedEventId]);
  const isActive = useMemo(() => selectedEvent ? isEventActive(selectedEvent.startTime, selectedEvent.endTime) : false, [selectedEvent]);

  const stats = useMemo(() => {
    const total = participants.length;
    const checkedIn = participants.filter(p => p.status === 'CHECKED_IN').length;
    const cancelled = participants.filter(p => p.status === 'CANCELLED').length;
    const active = Math.max(0, total - checkedIn - cancelled);
    return { total, checkedIn, cancelled, active };
  }, [participants]);

  const checkInRate = stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0;

  const exportData = () => {
    exportCsv('participants.csv',
      ['Name', 'Email', 'Phone', 'Ticket Type', 'Ticket Code', 'Status'],
      filteredParticipants.map(p => [p.name, p.email, p.phone, p.ticketName || 'General', p.ticketCode, p.status])
    );
  };

  const statusBadgeClass = (status) => {
    if (status === 'CHECKED_IN') return 'badge badge-completed';
    if (status === 'CANCELLED') return 'badge badge-cancelled';
    return 'badge badge-active';
  };

  const statusLabel = (status) => {
    if (status === 'CHECKED_IN') return 'Checked In';
    if (status === 'CANCELLED') return 'Cancelled';
    return 'Registered';
  };

  return (
    <div style={{ padding: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h2 className="view-title">Manage Participants</h2>
          <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>
            View attendees and manage check-ins for your events.
          </p>
        </div>
        <Button variant="secondary" onClick={exportData} disabled={filteredParticipants.length === 0}>
          Export List (CSV)
        </Button>
      </div>

      {/* Toast */}
      {toast.msg && (
        <div className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 20 }}>
          {toast.msg}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          disabled={loadingEvents || events.length === 0}
          className="form-input" style={{ width: 280 }}
        >
          {loadingEvents ? (
            <option value="">Loading events...</option>
          ) : events.length === 0 ? (
            <option value="">No events available</option>
          ) : (
            events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)
          )}
        </select>
        <input
          type="text" placeholder="Search by name, email, or ticket code..."
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="form-input" style={{ flex: 1, minWidth: 200 }}
        />
        <select
          className="form-input" style={{ width: 160 }}
          value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Registered</option>
          <option value="CHECKED_IN">Checked In</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="admin-stat-card" style={{ borderTop: '4px solid #6366f1' }}>
          <div className="admin-stat-label">Total Registered</div>
          <div className="admin-stat-value">{stats.total}</div>
          <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 4 }}>All attendees</div>
        </div>
        <div className="admin-stat-card" style={{ borderTop: '4px solid var(--primary)' }}>
          <div className="admin-stat-label">Yet to Arrive</div>
          <div className="admin-stat-value">{stats.active}</div>
          <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 4 }}>Confirmed, not checked in</div>
        </div>
        <div className="admin-stat-card" style={{ borderTop: '4px solid #10b981' }}>
          <div className="admin-stat-label">Checked In</div>
          <div className="admin-stat-value" style={{ color: '#10b981' }}>{stats.checkedIn}</div>
          <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 4 }}>Arrived at event</div>
        </div>
        <div className="admin-stat-card" style={{ borderTop: '4px solid #ef4444' }}>
          <div className="admin-stat-label">Cancelled</div>
          <div className="admin-stat-value" style={{ color: '#ef4444' }}>{stats.cancelled}</div>
          <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 4 }}>Registration cancelled</div>
        </div>
      </div>

      {/* Check-in Progress Bar */}
      {stats.total > 0 && (
        <div style={{ background: 'white', border: '1px solid var(--neutral-100)', borderRadius: 16, padding: '18px 24px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Check-in Progress</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: checkInRate >= 70 ? '#10b981' : checkInRate >= 40 ? '#f59e0b' : 'var(--neutral-600)' }}>
              {stats.checkedIn} / {stats.total} ({checkInRate}%)
            </span>
          </div>
          <div style={{ background: 'var(--neutral-100)', borderRadius: 100, height: 10, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${checkInRate}%`,
              background: checkInRate >= 70 ? '#10b981' : checkInRate >= 40 ? '#f59e0b' : 'var(--primary)',
              borderRadius: 100,
              transition: 'width 0.6s ease'
            }} />
          </div>
        </div>
      )}

      {/* Warning: event not active */}
      {!isActive && selectedEvent && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          {new Date(selectedEvent.endTime) < new Date()
            ? 'This event has ended.'
            : 'This event hasn\'t started yet.'} Check-in is currently unavailable.
        </div>
      )}

      {/* Table */}
      <div className="table-responsive">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Attendee</th>
              <th>Ticket Type</th>
              <th>Ticket Code</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loadingParticipants && filteredParticipants.map(participant => (
              <tr key={participant.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{participant.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--neutral-400)' }}>{participant.email}</div>
                  {participant.phone && <div style={{ fontSize: 11, color: 'var(--neutral-400)' }}>{participant.phone}</div>}
                </td>
                <td style={{ fontSize: 13 }}>{participant.ticketName || 'General'}</td>
                <td style={{ fontSize: 13 }}><code>{participant.ticketCode}</code></td>
                <td>
                  <span className={statusBadgeClass(participant.status)}>
                    {statusLabel(participant.status)}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  {participant.status === 'ACTIVE' && (
                    isActive ? (
                      <Button variant="secondary" onClick={() => handleCheckIn(participant.id)} disabled={updatingId === participant.id}>
                        {updatingId === participant.id ? 'Checking in...' : 'Check In'}
                      </Button>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--neutral-400)' }}>Check-in closed</span>
                    )
                  )}
                  {participant.status === 'CHECKED_IN' && (
                    <span style={{ color: '#10b981', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Done
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {!loadingParticipants && filteredParticipants.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--neutral-400)' }}>
                  {selectedEventId ? 'No participants match your search.' : 'Please select an event.'}
                </td>
              </tr>
            )}
            {loadingParticipants && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px 0' }}>
                  Loading participants...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}