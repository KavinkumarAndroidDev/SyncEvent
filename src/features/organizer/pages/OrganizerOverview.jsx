import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../../components/ui/Button';
import Spinner from '../../../components/common/Spinner';
import { formatMoney, formatDateTime } from '../../../utils/formatters';
import OrgPageHeader from '../components/OrgPageHeader';
import OrgStatCard from '../components/OrgStatCard';
import OrgStatusBadge from '../components/OrgStatusBadge';
import { PERIOD_LABELS } from '../components/OrgPeriodFilter';
import { fetchOrganizerOverview, fetchOrganizerRevenueChart } from '../slices/organizerSlice';

export default function OrganizerOverview() {
  const dispatch = useDispatch();
  const { overview, loading, chartLoading } = useSelector((s) => s.organizer);
  const { stats, recentEvents, chartData, notifications, unreadCount, chartError } = overview;
  const [period, setPeriod] = useState('ALL');

  const loadData = useCallback(async () => {
    dispatch(fetchOrganizerOverview());
  }, [dispatch]);

  const loadChart = useCallback(async (activePeriod) => {
    dispatch(fetchOrganizerRevenueChart(activePeriod));
  }, [dispatch]);

  useEffect(() => { loadData(); loadChart('ALL'); }, [loadData, loadChart]);
  useEffect(() => { loadChart(period); if (period === 'ALL') loadData(); }, [period]); // eslint-disable-line

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <Spinner label="Loading your dashboard..." />
    </div>
  );

  const kpiCards = [
    { label: 'Total Earnings', value: formatMoney(stats.totalRevenue), sub: `Net Revenue · ${PERIOD_LABELS[period]}`, color: 'var(--primary)' },
    { label: 'Tickets Sold', value: Number(stats.totalTickets).toLocaleString(), sub: 'Confirmed Registrations', color: '#6366f1' },
    { label: 'Total Events', value: Number(stats.totalEvents), sub: 'Across All Statuses', color: '#f59e0b' },
    { label: 'Avg. Attendance', value: `${stats.avgAttendance.toFixed(1)}%`, sub: 'Check-in Rate', color: '#10b981' },
  ];

  return (
    <div style={{ padding: 40 }}>

      <OrgPageHeader
        title="Dashboard"
        subtitle="Welcome back! Here's a live snapshot of your event portfolio."
        actions={
          <div style={{ display: 'flex', background: 'var(--neutral-50)', padding: 4, borderRadius: 12, border: '1px solid var(--neutral-100)' }}>
            {Object.entries(PERIOD_LABELS).map(([key, label]) => (
              <button key={key} onClick={() => setPeriod(key)} style={{
                padding: '8px 16px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: period === key ? 'white' : 'transparent',
                color: period === key ? 'var(--primary)' : 'var(--neutral-400)',
                boxShadow: period === key ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s',
              }}>{label}</button>
            ))}
          </div>
        }
      />

      <div style={{ marginBottom: 28 }}>
        <Link to="/organizer/create-event" style={{ textDecoration: 'none' }}>
          <button style={{
            padding: '11px 24px', borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', background: 'var(--primary)', color: 'white',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 14px rgba(99,102,241,0.3)', transition: 'opacity 0.2s',
          }}
            onMouseOver={e => e.currentTarget.style.opacity = '0.88'}
            onMouseOut={e => e.currentTarget.style.opacity = '1'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            Create New Event
          </button>
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 28 }}>
        {kpiCards.map(card => (
          <OrgStatCard key={card.label} label={card.label} value={card.value} sub={card.sub} color={card.color} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 28 }}>

        <div style={{ background: 'white', border: '1px solid var(--neutral-100)', borderRadius: 24, padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Revenue Trend</h3>
            <span style={{ fontSize: 12, color: 'var(--neutral-400)', fontWeight: 500 }}>{PERIOD_LABELS[period]}</span>
          </div>
          <div style={{ height: 300 }}>
            {chartLoading ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spinner label="Loading chart..." />
              </div>
            ) : chartError ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ef4444', gap: 10 }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span style={{ fontSize: 13 }}>Could not load chart data</span>
                <button onClick={() => loadChart(period)} style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Retry →</button>
              </div>
            ) : chartData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: 10 }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
                <span style={{ fontSize: 14 }}>No revenue recorded for this period</span>
                <span style={{ fontSize: 12 }}>Sales will appear here once tickets are purchased</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} tick={{ fill: '#94a3b8', fontSize: 11 }} width={55} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.12)', fontSize: 13 }} formatter={v => [formatMoney(v), 'Revenue']} labelStyle={{ fontWeight: 700, marginBottom: 4 }} />
                  <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#revGrad)" dot={chartData.length <= 14 ? { r: 4, fill: 'var(--primary)', strokeWidth: 0 } : false} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 24 }}>
          <div style={{ background: 'white', border: '1px solid var(--neutral-100)', borderRadius: 24, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Recent Events</h3>
              <Link to="/organizer/events" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>View all →</Link>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {recentEvents.length > 0 ? recentEvents.map(ev => (
                <div key={ev.eventId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--neutral-50)', borderRadius: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.eventTitle}</div>
                    <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 2 }}>{formatDateTime(ev.startTime).split(',')[0]}</div>
                  </div>
                  <OrgStatusBadge status={ev.status} style={{ fontSize: 10, flexShrink: 0, whiteSpace: 'nowrap' }} />
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: 13 }}>
                  No events yet.
                  <div style={{ marginTop: 8 }}>
                    <Link to="/organizer/create-event" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 12 }}>Create your first event →</Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid var(--neutral-100)', borderRadius: 24, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Notifications</h3>
              {unreadCount > 0 && (
                <span style={{ background: '#ef4444', color: 'white', fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>{unreadCount} new</span>
              )}
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {notifications.length > 0 ? notifications.map(n => (
                <div key={n.id} style={{ display: 'flex', gap: 10, paddingBottom: 8, borderBottom: '1px solid var(--neutral-50)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: n.isRead ? 'var(--neutral-50)' : '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={n.isRead ? '#94a3b8' : 'var(--primary)'} strokeWidth="2">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: n.isRead ? 500 : 700, color: n.isRead ? 'var(--neutral-500)' : 'var(--neutral-900)' }}>{n.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {(n.message || '').substring(0, 55)}{(n.message || '').length > 55 ? '...' : ''}
                    </div>
                  </div>
                </div>
              )) : (
                <div style={{ color: 'var(--neutral-400)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>All caught up — inbox is clear.</div>
              )}
              <Link to="/organizer/notifications" style={{ textAlign: 'center', marginTop: 4, fontSize: 12, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', display: 'block' }}>
                View All Notifications →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
