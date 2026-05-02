import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../../components/ui/Button';
import { formatDate, formatDateTime, formatMoney } from '../../../utils/formatters';
import Spinner from '../../../components/common/Spinner';
import { fetchAttendeeOverview } from '../slices/attendeeSlice';

export default function Overview() {
  const dispatch = useDispatch();
  const { overviewBookings: bookings, overviewPayments: payments, overviewLoading: loading } = useSelector((s) => s.attendee);

  useEffect(() => {
    dispatch(fetchAttendeeOverview());
  }, [dispatch]);

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookings
      .filter(b => b.status === 'CONFIRMED' && b.eventStartTime && new Date(b.eventStartTime) >= today)
      .sort((a, b) => new Date(a.eventStartTime) - new Date(b.eventStartTime))
      .slice(0, 5);
  }, [bookings]);

  if (loading) return <Spinner label="Loading dashboard..." />;

  return (
    <div className="view-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <header className="view-header" style={{ marginBottom: '40px' }}>
        <h2 className="view-title" style={{ fontSize: '28px', marginBottom: '8px' }}>Welcome back!</h2>
        <p style={{ color: 'var(--neutral-400)', fontSize: '15px' }}>Manage your event activity and upcoming schedules here.</p>
      </header>

      <div className="overview-grid">
        <div className="overview-card">
          <div className="card-header" style={{ borderBottom: '1px solid var(--neutral-50)', paddingBottom: '20px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px' }}>Confirmed Upcoming Events</h3>
            <Link to="/dashboard/registrations" style={{ textDecoration: 'none' }}>
              <Button variant="table">View Full Schedule</Button>
            </Link>
          </div>
          <div className="card-body">
            {upcomingEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 20px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--neutral-50)', display: 'flex', alignItems: 'center', justify_content: 'center', margin: '0 auto 16px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--neutral-400)' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <h4 style={{ fontFamily: 'DM Sans', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No upcoming events confirmed</h4>
                <p style={{ color: 'var(--neutral-400)', marginBottom: '24px', fontSize: '14px', maxWidth: '320px', margin: '0 auto 24px' }}>
                  Looks like you haven't booked any upcoming events. Discover amazing experiences and start your journey!
                </p>
                <Link to="/events" style={{ textDecoration: 'none' }}>
                   <Button>Discover Events</Button>
                </Link>
              </div>
            ) : (
              <ul className="overview-list">
                {upcomingEvents.map(b => {
                  const eventDate = new Date(b.eventStartTime);
                  const today = new Date(); today.setHours(0,0,0,0);
                  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
                  const evDay = new Date(eventDate); evDay.setHours(0,0,0,0);
                  const dayLabel = evDay.getTime() === today.getTime() ? 'Today' :
                                   evDay.getTime() === tomorrow.getTime() ? 'Tomorrow' :
                                   formatDate(eventDate);
                  const timeLabel = eventDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                  return (
                  <li key={b.id} className="list-item" style={{ padding: '20px 0' }}>
                    <div className="item-main">
                      <p className="item-title" style={{ fontSize: '16px', marginBottom: '4px' }}>{b.eventTitle}</p>
                      <p className="item-sub" style={{ fontSize: '13px' }}>
                        {dayLabel} at {timeLabel}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span className="badge badge-confirmed" style={{ padding: '6px 12px' }}>Confirmed</span>
                        <Link to="/dashboard/registrations">
                            <Button variant="table">Details</Button>
                        </Link>
                    </div>
                  </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="overview-card">
          <div className="card-header" style={{ borderBottom: '1px solid var(--neutral-50)', paddingBottom: '20px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px' }}>Recent Transaction History</h3>
            <Link to="/dashboard/payments" style={{ textDecoration: 'none' }}>
              <Button variant="table">Full History</Button>
            </Link>
          </div>
          <div className="card-body">
            {payments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 20px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--neutral-50)', display: 'flex', alignItems: 'center', justify_content: 'center', margin: '0 auto 16px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--neutral-400)' }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <h4 style={{ fontFamily: 'DM Sans', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No transactions found</h4>
                <p style={{ color: 'var(--neutral-400)', fontSize: '14px', maxWidth: '320px', margin: '0 auto' }}>
                  Your recent payment activity and history will appear here once you make a booking.
                </p>
              </div>
            ) : (
              <ul className="overview-list">
                {payments.slice(0, 5).map(p => (
                  <li key={p.id} className="list-item" style={{ padding: '20px 0' }}>
                    <div className="item-main">
                      <p className="item-title" style={{ fontSize: '15px', marginBottom: '4px' }}>Payment · {formatDate(p.createdAt)}</p>
                      <p className="item-sub" style={{ fontSize: '13px' }}>
                        {formatDateTime(p.createdAt)} via {p.paymentMode || 'Gateway'}
                      </p>
                    </div>
                    <div className="item-side">
                      <p className="item-amount" style={{ fontSize: '16px', color: p.status === 'FAILED' ? 'var(--error)' : 'var(--primary)', marginBottom: '4px' }}>
                        {formatMoney(p.amount)}
                      </p>
                      <span className={`badge badge-${p.status?.toLowerCase()}`} style={{ fontSize: '10px' }}>{p.status}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
