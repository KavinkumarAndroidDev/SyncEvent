import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axiosInstance from '../../../lib/axios';
import Button from '../../../components/ui/Button';
import { exportCsv } from '../../admin/utils/adminUtils';
import { isEventActive } from '../utils/organizerHelpers';

export default function OrganizerRegistrations() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [participants, setParticipants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoadingEvents(true);
        const { data } = await axiosInstance.get('/events?size=100&sort=startTime,desc');
        const eventList = data.content || [];
        setEvents(eventList);
        if (eventList.length > 0) {
          setSelectedEventId(eventList[0].id.toString());
        }
      } catch (err) {
        console.error('Failed to load events', err);
      } finally {
        setLoadingEvents(false);
      }
    }
    loadEvents();
  }, []);

  const loadParticipants = useCallback(async () => {
    if (!selectedEventId) {
      setParticipants([]);
      return;
    }
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
  }, [selectedEventId]);

  useEffect(() => {
    loadParticipants();
  }, [loadParticipants]);

  const handleCheckIn = async (participantId) => {
    try {
      setUpdatingId(participantId);
      await axiosInstance.patch(`/participants/${participantId}/status`, { status: 'CHECKED_IN' });
      await loadParticipants();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to check in participant.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredParticipants = useMemo(() => {
    if (!searchQuery) return participants;
    const lowerQ = searchQuery.toLowerCase();
    return participants.filter(p => 
      (p.name && p.name.toLowerCase().includes(lowerQ)) ||
      (p.email && p.email.toLowerCase().includes(lowerQ)) ||
      (p.ticketCode && p.ticketCode.toLowerCase().includes(lowerQ))
    );
  }, [participants, searchQuery]);

  const selectedEvent = useMemo(() => {
    return events.find(e => e.id.toString() === selectedEventId);
  }, [events, selectedEventId]);

  const isActive = useMemo(() => {
    if (!selectedEvent) return false;
    return isEventActive(selectedEvent.startTime, selectedEvent.endTime);
  }, [selectedEvent]);

  const stats = useMemo(() => {
    const total = participants.length;
    const checkedIn = participants.filter(p => p.status === 'CHECKED_IN').length;
    const cancelled = participants.filter(p => p.status === 'CANCELLED').length;
    return { total, checkedIn, cancelled, active: total - checkedIn - cancelled };
  }, [participants]);

  const exportData = () => {
    exportCsv('participants.csv', ['Name', 'Email', 'Phone', 'Ticket Type', 'Ticket Code', 'Status'], filteredParticipants.map(p => [
      p.name, p.email, p.phone, p.ticketName || 'General', p.ticketCode, p.status
    ]));
  };

  return (
    <div style={{ padding: 40 }}>
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h2 className="view-title">Manage Participants</h2>
          <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>View attendees and manage check-ins for your events.</p>
        </div>
        <Button variant="secondary" onClick={exportData} disabled={filteredParticipants.length === 0}>Export Data</Button>
      </div>
      
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <select 
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          disabled={loadingEvents || events.length === 0}
          className="form-input"
          style={{ width: 250 }}
        >
          {loadingEvents ? (
            <option value="">Loading events...</option>
          ) : events.length === 0 ? (
            <option value="">No events available</option>
          ) : (
            events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))
          )}
        </select>
        
        <input 
          type="text" 
          placeholder="Search name, email, or ticket..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="form-input"
          style={{ flex: 1, minWidth: 220 }}
        />
      </div>

      <div className="admin-stat-grid" style={{ marginBottom: 24 }}>
        <div className="admin-stat-card"><div className="admin-stat-label">Total Participants</div><div className="admin-stat-value">{stats.total}</div></div>
        <div className="admin-stat-card"><div className="admin-stat-label">Yet to Arrive</div><div className="admin-stat-value">{stats.active}</div></div>
        <div className="admin-stat-card" style={{ borderLeft: '4px solid #10b981' }}><div className="admin-stat-label">Checked In</div><div className="admin-stat-value" style={{ color: '#10b981' }}>{stats.checkedIn}</div></div>
        <div className="admin-stat-card"><div className="admin-stat-label">Cancelled</div><div className="admin-stat-value">{stats.cancelled}</div></div>
      </div>

      {!isActive && selectedEvent && (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          {new Date(selectedEvent.endTime) < new Date() ? 'This event has ended.' : 'This event is not currently active.'} Check-ins are disabled.
        </div>
      )}

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
                  <div style={{ fontSize: 12, color: 'var(--neutral-400)' }}>{participant.email} • {participant.phone}</div>
                </td>
                <td style={{ fontSize: 13 }}>{participant.ticketName || 'General'}</td>
                <td style={{ fontSize: 13 }}><code>{participant.ticketCode}</code></td>
                <td>
                  <span className={`badge badge-${participant.status === 'CHECKED_IN' ? 'completed' : participant.status === 'CANCELLED' ? 'cancelled' : 'active'}`}>
                    {participant.status?.replace('_', ' ') || 'ACTIVE'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  {participant.status === 'ACTIVE' && (
                    <>
                      {isActive ? (
                        <Button 
                          variant="secondary"
                          onClick={() => handleCheckIn(participant.id)}
                          disabled={updatingId === participant.id}
                        >
                          {updatingId === participant.id ? 'Checking In...' : 'Check-In'}
                        </Button>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--neutral-400)' }}>Check-in closed</span>
                      )}
                    </>
                  )}
                  {participant.status === 'CHECKED_IN' && (
                    <span style={{ color: '#10b981', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      Done
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {!loadingParticipants && filteredParticipants.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '30px 0', color: 'var(--neutral-400)' }}>
                  {selectedEventId ? 'No participants found matching the criteria.' : 'Please select an event to view participants.'}
                </td>
              </tr>
            )}
            {loadingParticipants && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '30px 0', color: 'var(--neutral-400)' }}>
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