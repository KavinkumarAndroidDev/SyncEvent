import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';
import axiosInstance from '../../../lib/axios';
import Button from '../../../components/ui/Button';
import { formatMoney, formatDateTime } from '../../../utils/formatters';
import { formatPercent } from '../utils/organizerHelpers';
import Spinner from '../../../components/common/Spinner';

export default function OrganizerOverview() {
  const [period, setPeriod] = useState('ALL');
  const [stats, setStats] = useState({ 
    totalRevenue: 0, 
    totalTickets: 0, 
    totalEvents: 0,
    avgAttendance: 0
  });
  const [events, setEvents] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryRes, eventsRes, notifRes, reportsRes] = await Promise.all([
        axiosInstance.get('/reports/summary').catch(() => ({ data: {} })),
        axiosInstance.get('/events?size=50&sort=startTime,desc').catch(() => ({ data: { content: [] } })),
        axiosInstance.get('/notifications?size=5&isRead=false').catch(() => ({ data: { content: [] } })),
        axiosInstance.get('/reports/events?size=500').catch(() => ({ data: { content: [] } }))
      ]);
      
      const summaryData = summaryRes.data || {};
      const eventReports = reportsRes.data?.content || [];
      const recentEvents = eventsRes.data?.content || [];
      
      // Robust aggregation from event-level reports
      const aggregated = eventReports.reduce((acc, curr) => ({
        revenue: acc.revenue + (curr.netRevenue || 0),
        tickets: acc.tickets + (curr.confirmedRegistrations || 0),
        totalAttendance: acc.totalAttendance + (curr.attendanceRate || 0),
        count: acc.count + 1
      }), { revenue: 0, tickets: 0, totalAttendance: 0, count: 0 });

      setStats({
        totalRevenue: summaryData.totalRevenue || aggregated.revenue,
        totalTickets: summaryData.totalTickets || aggregated.tickets,
        totalEvents: summaryData.totalEvents || aggregated.count,
        avgAttendance: summaryData.averageAttendance || (aggregated.count ? (aggregated.totalAttendance / aggregated.count) : 0)
      });
      
      setEvents(recentEvents.slice(0, 5));
      setNotifications(notifRes.data?.content || []);
    } catch (err) {
      console.error('Failed to sync dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const loadChart = async () => {
    try {
      setChartLoading(true);
      const to = new Date();
      let from = new Date();
      let groupBy = 'DAY';

      if (period === '7D') from.setDate(to.getDate() - 7);
      else if (period === '1M') from.setDate(to.getDate() - 30);
      else if (period === '1Y') { from.setFullYear(to.getFullYear() - 1); groupBy = 'MONTH'; }
      else { from = new Date(2022, 0, 1); groupBy = 'MONTH'; }

      const fromStr = from.toISOString().split('T')[0];
      const toStr = to.toISOString().split('T')[0];

      const chartRes = await axiosInstance.get(`/reports/revenue?from=${fromStr}&to=${toStr}&groupBy=${groupBy}`);
      const chartArray = chartRes.data || [];
      
      setChartData(chartArray.map(p => ({
        date: p.label || 'Unknown',
        revenue: p.amount || 0,
        tickets: p.ticketsSold || 0
      })));

      // If period is filtered, update the summary cards to reflect the period totals
      if (period !== 'ALL') {
        const periodTotal = chartArray.reduce((sum, d) => sum + (d.amount || 0), 0);
        const periodTickets = chartArray.reduce((sum, d) => sum + (d.ticketsSold || 0), 0);
        setStats(prev => ({ ...prev, totalRevenue: periodTotal, totalTickets: periodTickets }));
      } else {
        loadData(); // Re-sync lifetime totals
      }
    } catch (err) {
      console.error('Chart sync failed', err);
    } finally {
      setChartLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadChart();
  }, [period]);

  if (loading && !events.length) return <div style={{ padding: 40 }}><Spinner label="Syncing your dashboard..." /></div>;

  return (
    <div style={{ padding: 40 }}>
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h2 className="view-title" style={{ fontSize: 26, fontWeight: 800 }}>Main Dashboard</h2>
          <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>Welcome back! Here is a summary of your event portfolio performance.</p>
        </div>
        <div style={{ display: 'flex', background: 'var(--neutral-50)', padding: 4, borderRadius: 12 }}>
          {['7D', '1M', '1Y', 'ALL'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: period === p ? 'white' : 'transparent',
                color: period === p ? 'var(--primary)' : 'var(--neutral-400)',
                boxShadow: period === p ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                transition: '0.2s'
              }}
            >
              {p === 'ALL' ? 'All Time' : p}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 32 }}>
        <div className="admin-stat-card" style={{ background: 'white', borderRadius: 24, border: '1px solid var(--neutral-100)' }}>
          <div className="admin-stat-label">Total Earnings</div>
          <div className="admin-stat-value" style={{ color: 'var(--primary)' }}>{formatMoney(stats.totalRevenue)}</div>
          <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 4 }}>Net Revenue ({period === 'ALL' ? 'Lifetime' : 'Period'})</div>
        </div>
        <div className="admin-stat-card" style={{ background: 'white', borderRadius: 24, border: '1px solid var(--neutral-100)' }}>
          <div className="admin-stat-label">Tickets Sold</div>
          <div className="admin-stat-value">{stats.totalTickets}</div>
          <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 4 }}>Confirmed Registrations</div>
        </div>
        <div className="admin-stat-card" style={{ background: 'white', borderRadius: 24, border: '1px solid var(--neutral-100)' }}>
          <div className="admin-stat-label">Active Portfolio</div>
          <div className="admin-stat-value">{stats.totalEvents}</div>
          <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 4 }}>Managed Events</div>
        </div>
        <div className="admin-stat-card" style={{ background: 'white', borderRadius: 24, border: '1px solid var(--neutral-100)' }}>
          <div className="admin-stat-label">Arrival Rate</div>
          <div className="admin-stat-value">{formatPercent(stats.avgAttendance)}</div>
          <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 4 }}>Platform Engagement</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32, marginBottom: 32 }}>
        <div style={{ background: 'white', border: '1px solid var(--neutral-100)', borderRadius: 24, padding: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 32 }}>Revenue Trend</h3>
          <div style={{ height: 350 }}>
            {chartLoading ? <Spinner label="Loading trend..." /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    formatter={(val) => [formatMoney(val), 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 32 }}>
          <div style={{ background: 'white', border: '1px solid var(--neutral-100)', borderRadius: 24, padding: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>Recent Activity</h3>
            <div style={{ display: 'grid', gap: 16 }}>
              {events.map(event => (
                <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: 'var(--neutral-50)', borderRadius: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 4 }}>{formatDateTime(event.startTime).split(',')[0]}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className={`badge badge-${(event.status || 'DRAFT').toLowerCase()}`} style={{ fontSize: 10 }}>{event.status || 'DRAFT'}</div>
                  </div>
                </div>
              ))}
              {!events.length && <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No recent events found.</div>}
              <Link to="/organizer/events" style={{ textDecoration: 'none', marginTop: 8 }}>
                <Button variant="secondary" fullWidth>Manage All Events</Button>
              </Link>
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid var(--neutral-100)', borderRadius: 24, padding: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Latest Notifications</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              {notifications.map(n => (
                <div key={n.id} style={{ display: 'flex', gap: 12, padding: '12px', borderBottom: '1px solid var(--neutral-50)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" style={{ marginTop: 2 }}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{n.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 2 }}>{n.message.substring(0, 60)}...</div>
                  </div>
                </div>
              ))}
              {!notifications.length && <div style={{ color: 'var(--neutral-400)', fontSize: 13 }}>No unread notifications.</div>}
              <Link to="/organizer/notifications" style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                View Inbox
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}