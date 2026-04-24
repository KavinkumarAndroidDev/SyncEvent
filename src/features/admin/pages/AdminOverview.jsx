import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axiosInstance from '../../../lib/axios';
import Button from '../../../components/ui/Button';
import { formatDateTime, formatMoney } from '../../../utils/formatters';
import Spinner from '../../../components/common/Spinner';

function StatCard({ label, value, hint, color = 'var(--neutral-900)' }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-label">{label}</div>
      <div className="admin-stat-value" style={{ color }}>{value}</div>
      <div className="admin-stat-hint">{hint}</div>
    </div>
  );
}

export default function AdminOverview() {
  const [summary, setSummary] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [pendingOrganizers, setPendingOrganizers] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      try {
        const [summaryRes, eventsRes, paymentsRes, organizersRes, revenueRes] = await Promise.all([
          axiosInstance.get('/reports/summary'),
          axiosInstance.get('/reports/events?size=5'),
          axiosInstance.get('/payments?size=5'),
          axiosInstance.get('/organizer-profiles?status=PENDING&size=5'),
          axiosInstance.get('/reports/revenue?groupBy=month'),
        ]);

        setSummary(summaryRes.data);
        setRecentEvents(eventsRes.data.content || []);
        setRecentPayments(paymentsRes.data.content || []);
        setPendingOrganizers(organizersRes.data.content || []);
        setRevenueData(revenueRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadOverview();
  }, []);

  if (loading) {
    return <Spinner label="Loading dashboard..." />;
  }

  const chartData = revenueData.map(item => ({
    name: item.period || item.label || 'N/A',
    revenue: item.totalAmount || item.revenue || 0
  }));

  return (
    <div style={{ padding: 40 }}>
      <div className="view-header" style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 className="view-title">Platform Overview</h2>
          <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>Monitor platform performance and system health.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/admin/reports">
            <Button>Generate Report</Button>
          </Link>
        </div>
      </div>

      <div className="admin-stat-grid">
        <StatCard label="Live Events" value={summary?.publishedEvents || 0} hint={`Total: ${summary?.totalEvents || 0}`} color="var(--primary)" />
        <StatCard label="Bookings" value={summary?.confirmedRegistrations || 0} hint={`${summary?.totalRegistrations || 0} total`} color="#10b981" />
        <StatCard label="Total Revenue" value={formatMoney(summary?.totalRevenue)} hint="Settled transactions" color="#8b5cf6" />
        <StatCard label="Total Users" value={summary?.totalParticipants || 0} hint={`${summary?.checkedInParticipants || 0} checked in`} />
      </div>

      <div className="admin-overview-grid">
        <div className="overview-card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <h3>Revenue Growth</h3>
            <div style={{ fontSize: 12, color: 'var(--neutral-400)' }}>Monthly settlement view</div>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--neutral-100)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--neutral-600)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--neutral-600)' }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip 
                    cursor={{ fill: 'var(--neutral-50)' }} 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                    formatter={(val) => [formatMoney(val), 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: 'var(--neutral-400)', fontSize: 14 }}>No revenue data available for trend chart.</p>
            )}
          </div>
        </div>

        <div className="overview-card">
          <div className="card-header">
            <h3>Organizer Requests</h3>
            <Link to="/admin/organizer-approvals" style={{ textDecoration: 'none' }}>
              <Button variant="table">View Queued</Button>
            </Link>
          </div>
          {pendingOrganizers.length === 0 ? (
            <p style={{ color: 'var(--neutral-400)', fontSize: 14, padding: '20px 0' }}>All clear! No pending requests.</p>
          ) : (
            <div className="admin-mini-list">
              {pendingOrganizers.map((item) => (
                <div key={item.id} className="admin-mini-item">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{item.organizationName || item.fullName}</div>
                    <div style={{ fontSize: 12, color: 'var(--neutral-400)', marginTop: 4 }}>{item.email}</div>
                  </div>
                  <Link to="/admin/organizer-approvals">
                    <Button variant="table">Review</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overview-card">
          <div className="card-header">
            <h3>Approval Queue</h3>
            <Link to="/admin/event-approvals" style={{ textDecoration: 'none' }}>
              <Button variant="table">Go to Queue</Button>
            </Link>
          </div>
          {recentEvents.length === 0 ? (
            <p style={{ color: 'var(--neutral-400)', fontSize: 14, padding: '20px 0' }}>No events pending review.</p>
          ) : (
            <div className="admin-mini-list">
              {recentEvents.map((item) => (
                <div key={item.eventId} className="admin-mini-item">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{item.eventTitle}</div>
                    <div style={{ fontSize: 12, color: 'var(--neutral-400)', marginTop: 4 }}>
                      {item.totalRegistrations || 0} tickets sold
                    </div>
                  </div>
                  <span className={`badge badge-${String(item.status || '').toLowerCase().replaceAll('_', '-')}`} style={{ fontSize: 10 }}>{item.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="overview-card" style={{ marginTop: 28 }}>
        <div className="card-header">
          <h3>Recent Transactions</h3>
          <Link to="/admin/payments" style={{ textDecoration: 'none' }}>
            <Button variant="table">View Transactions</Button>
          </Link>
        </div>

        <div className="table-responsive">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Created At</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map((payment) => (
                <tr key={payment.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>#{String(payment.id).slice(-8).toUpperCase()}</td>
                  <td>{formatDateTime(payment.createdAt)}</td>
                  <td style={{ fontWeight: 700 }}>{formatMoney(payment.amount)}</td>
                  <td>{payment.paymentMethod || 'Online'}</td>
                  <td>
                    <span className={`badge badge-${String(payment.status || '').toLowerCase()}`}>{payment.status}</span>
                  </td>
                </tr>
              ))}
              {recentPayments.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--neutral-400)' }}>
                    No payment history.
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
