import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../../api/axiosInstance';
import Button from '../../../components/Button';

export default function Overview() {
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookRes, payRes] = await Promise.all([
          axiosInstance.get('/bookings?size=100'), 
          axiosInstance.get('/payments/my-payments?size=10')
        ]);
        
        setBookings(bookRes.data.content || []);
        setPayments(payRes.data.content || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return bookings
      .filter(b => b.status === 'CONFIRMED' && new Date(b.eventDate) >= now)
      .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
      .slice(0, 10); // Show up to 10
  }, [bookings]);

  if (loading) return <div className="p-4">Loading dashboard...</div>;

  return (
    <div className="view-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <header className="view-header" style={{ marginBottom: '40px' }}>
        <h2 className="view-title" style={{ fontSize: '28px', marginBottom: '8px' }}>Dashboard Overview</h2>
        <p style={{ color: 'var(--neutral-400)', fontSize: '15px' }}>Welcome back. Manage your event activity and upcoming schedules here.</p>
      </header>

      <div className="overview-grid">
        {/* Upcoming Events - Vertical Stack Item 1 */}
        <div className="overview-card">
          <div className="card-header" style={{ borderBottom: '1px solid var(--neutral-50)', paddingBottom: '20px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px' }}>Confirmed Upcoming Events</h3>
            <Link to="/dashboard/registrations" style={{ textDecoration: 'none' }}>
              <Button variant="table">View Full Schedule</Button>
            </Link>
          </div>
          <div className="card-body">
            {upcomingEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <p style={{ color: 'var(--neutral-400)', marginBottom: '24px', fontSize: '15px' }}>You have no upcoming confirmed events at the moment.</p>
                <Link to="/events" style={{ textDecoration: 'none' }}>
                   <Button>Discover New Events</Button>
                </Link>
              </div>
            ) : (
              <ul className="overview-list">
                {upcomingEvents.map(b => (
                  <li key={b.id} className="list-item" style={{ padding: '20px 0' }}>
                    <div className="item-main">
                      <p className="item-title" style={{ fontSize: '16px', marginBottom: '4px' }}>{b.eventTitle}</p>
                      <p className="item-sub" style={{ fontSize: '13px' }}>
                        {new Date(b.eventDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span className="badge badge-confirmed" style={{ padding: '6px 12px' }}>Confirmed</span>
                        <Link to={`/events/${b.eventId}`}>
                            <Button variant="table">Details</Button>
                        </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Recent Activity - Vertical Stack Item 2 */}
        <div className="overview-card">
          <div className="card-header" style={{ borderBottom: '1px solid var(--neutral-50)', paddingBottom: '20px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px' }}>Recent Transaction History</h3>
            <Link to="/dashboard/payments" style={{ textDecoration: 'none' }}>
              <Button variant="table">Full History</Button>
            </Link>
          </div>
          <div className="card-body">
            {payments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <p style={{ color: 'var(--neutral-400)', fontSize: '15px' }}>Your recent payment activity will appear here.</p>
              </div>
            ) : (
              <ul className="overview-list">
                {payments.slice(0, 10).map(p => (
                  <li key={p.id} className="list-item" style={{ padding: '20px 0' }}>
                    <div className="item-main">
                      <p className="item-title" style={{ fontSize: '15px', marginBottom: '4px' }}>Transaction REF-{p.id}</p>
                      <p className="item-sub" style={{ fontSize: '13px' }}>
                        {new Date(p.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} via {p.paymentMode || 'Gateway'}
                      </p>
                    </div>
                    <div className="item-side">
                      <p className="item-amount" style={{ fontSize: '16px', color: p.status === 'FAILED' ? 'var(--error)' : 'var(--primary)', marginBottom: '4px' }}>
                        ₹{p.amount.toLocaleString()}
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
