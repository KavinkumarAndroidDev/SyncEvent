import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../../../api/axiosInstance';
import Button from '../../../../components/Button';

function StatCard({ label, value, hint }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-label">{label}</div>
      <div className="admin-stat-value">{value}</div>
      <div className="admin-stat-hint">{hint}</div>
    </div>
  );
}

export default function AdminOverview() {
  const [summary, setSummary] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [pendingOrganizers, setPendingOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      try {
        const [summaryRes, eventsRes, paymentsRes, organizersRes] = await Promise.all([
          axiosInstance.get('/reports/summary'),
          axiosInstance.get('/reports/events?size=5'),
          axiosInstance.get('/payments?size=5'),
          axiosInstance.get('/organizer-profiles?status=PENDING&size=5'),
        ]);

        setSummary(summaryRes.data);
        setRecentEvents(eventsRes.data.content || []);
        setRecentPayments(paymentsRes.data.content || []);
        setPendingOrganizers(organizersRes.data.content || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadOverview();
  }, []);

  if (loading) {
    return <div style={{ padding: 40, color: 'var(--neutral-400)' }}>Loading admin dashboard...</div>;
  }

  return (
    <div style={{ padding: 40 }}>
      <div className="view-header" style={{ marginBottom: 28 }}>
        <h2 className="view-title">Admin Dashboard</h2>
        <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>Track events, registrations, payments, and pending actions in one place.</p>
      </div>

      <div className="admin-stat-grid">
        <StatCard label="Total Events" value={summary?.totalEvents || 0} hint={`${summary?.publishedEvents || 0} published`} />
        <StatCard label="Registrations" value={summary?.totalRegistrations || 0} hint={`${summary?.confirmedRegistrations || 0} confirmed`} />
        <StatCard label="Revenue" value={`Rs. ${Number(summary?.totalRevenue || 0).toLocaleString()}`} hint="Completed bookings" />
        <StatCard label="Participants" value={summary?.totalParticipants || 0} hint={`${summary?.checkedInParticipants || 0} checked in`} />
      </div>

      <div className="admin-overview-grid">
        <div className="overview-card">
          <div className="card-header">
            <h3>Pending Organizer Approvals</h3>
            <Link to="/admin/organizer-approvals" style={{ textDecoration: 'none' }}>
              <Button variant="table">Open</Button>
            </Link>
          </div>
          {pendingOrganizers.length === 0 ? (
            <p style={{ color: 'var(--neutral-400)', fontSize: 14 }}>No pending organizer requests right now.</p>
          ) : (
            <div className="admin-mini-list">
              {pendingOrganizers.map((item) => (
                <div key={item.id} className="admin-mini-item">
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.organizationName || item.fullName}</div>
                    <div style={{ fontSize: 12, color: 'var(--neutral-400)', marginTop: 4 }}>{item.fullName} • {item.email}</div>
                  </div>
                  <span className="badge badge-pending">Pending</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overview-card">
          <div className="card-header">
            <h3>Recent Event Activity</h3>
            <Link to="/admin/event-approvals" style={{ textDecoration: 'none' }}>
              <Button variant="table">Review</Button>
            </Link>
          </div>
          {recentEvents.length === 0 ? (
            <p style={{ color: 'var(--neutral-400)', fontSize: 14 }}>No event records found.</p>
          ) : (
            <div className="admin-mini-list">
              {recentEvents.map((item) => (
                <div key={item.eventId} className="admin-mini-item">
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.eventTitle}</div>
                    <div style={{ fontSize: 12, color: 'var(--neutral-400)', marginTop: 4 }}>
                      {item.startTime ? new Date(item.startTime).toLocaleString() : 'No date'} • {item.totalRegistrations || 0} registrations
                    </div>
                  </div>
                  <span className={`badge badge-${String(item.status || '').toLowerCase().replaceAll('_', '-')}`}>{item.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="overview-card" style={{ marginTop: 28 }}>
        <div className="card-header">
          <h3>Latest Payments</h3>
          <Link to="/admin/payments" style={{ textDecoration: 'none' }}>
            <Button variant="table">View All</Button>
          </Link>
        </div>

        <div className="table-responsive">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Reference</th>
                <th>Created</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map((payment, index) => (
                <tr key={payment.id}>
                  <td>{index + 1}</td>
                  <td>REF-{payment.id}</td>
                  <td>{payment.createdAt ? new Date(payment.createdAt).toLocaleString() : '-'}</td>
                  <td style={{ fontWeight: 700 }}>Rs. {Number(payment.amount || 0).toLocaleString()}</td>
                  <td>
                    <span className={`badge badge-${String(payment.status || '').toLowerCase()}`}>{payment.status}</span>
                  </td>
                </tr>
              ))}
              {recentPayments.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--neutral-400)' }}>
                    No payment records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
