import { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../lib/axios';
import Pagination from '../../../components/ui/Pagination';
import Spinner from '../../../components/common/Spinner';
import Button from '../../../components/ui/Button';
import { formatDateTime, formatMoney } from '../../../utils/formatters';
import { exportCsv } from '../../admin/utils/adminUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import OrgPageHeader from '../components/OrgPageHeader';
import OrgStatCard from '../components/OrgStatCard';
import OrgToast from '../components/OrgToast';
import OrgPeriodFilter from '../components/OrgPeriodFilter';
import OrgStatusBadge from '../components/OrgStatusBadge';
import { useToast } from '../components/orgHooks.jsx';

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function OrganizerPayments() {
  const [items, setItems] = useState([]);
  const [revenuePoints, setRevenuePoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [period, setPeriod] = useState('ALL');
  const { toast, showToast } = useToast();
  const pageSize = 10;

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const to = new Date();
        const from = new Date();
        let groupBy = 'month';
        if (period === '7D') { from.setDate(to.getDate() - 7); groupBy = 'day'; }
        else if (period === '1M') { from.setDate(to.getDate() - 30); groupBy = 'week'; }
        else if (period === '1Y') { from.setFullYear(to.getFullYear() - 1); groupBy = 'month'; }
        else { from.setFullYear(2022); groupBy = 'month'; }
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);

        const [eventsRes, revenueRes] = await Promise.all([
          axiosInstance.get('/reports/events?size=500'),
          axiosInstance.get(`/reports/revenue?from=${formatLocalDate(from)}&to=${formatLocalDate(to)}&groupBy=${groupBy}`).catch(() => ({ data: [] })),
        ]);
        setItems(eventsRes.data?.content || []);
        setRevenuePoints((revenueRes.data || []).map(p => ({
          name: p.period || 'Unknown',
          revenue: Number(p.revenue || 0),
          tickets: Number(p.registrations || 0),
        })));
      } catch {
        showToast('Failed to load financial data.', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [period]);

  const filteredItems = useMemo(() => {
    if (period === 'ALL') return items;
    const cutoff = new Date();
    if (period === '7D') cutoff.setDate(cutoff.getDate() - 7);
    else if (period === '1M') cutoff.setDate(cutoff.getDate() - 30);
    else if (period === '1Y') cutoff.setFullYear(cutoff.getFullYear() - 1);
    return items.filter(item => new Date(item.startTime) >= cutoff);
  }, [items, period]);

  const stats = useMemo(() => ({
    grossRevenue: filteredItems.reduce((s, i) => s + Number(i.grossRevenue || 0), 0),
    refundAmount: filteredItems.reduce((s, i) => s + Number(i.refundAmount || 0), 0),
    netRevenue:   filteredItems.reduce((s, i) => s + Number(i.netRevenue || 0), 0),
    confirmed:    filteredItems.reduce((s, i) => s + Number(i.confirmedRegistrations || 0), 0),
  }), [filteredItems]);

  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const pagedItems = filteredItems.slice(page * pageSize, (page + 1) * pageSize);

  const exportStatement = () => exportCsv(
    'revenue_statement.csv',
    ['Event', 'Date', 'Tickets Sold', 'Gross Sales', 'Refunds', 'Your Earnings', 'Status'],
    filteredItems.map(i => [i.eventTitle, i.startTime, i.confirmedRegistrations, i.grossRevenue, i.refundAmount, i.netRevenue, i.status])
  );

  if (loading && !items.length) return <Spinner label="Loading financial records..." />;

  const CHART_TOOLTIP_STYLE = { borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' };

  return (
    <div style={{ padding: 40 }}>

      <OrgPageHeader
        title="Payments & Revenue"
        subtitle="Track your ticket sales, earnings, and refund status across all events."
        actions={<Button variant="secondary" onClick={exportStatement} disabled={!filteredItems.length}>Export Records (CSV)</Button>}
      />

      <OrgToast msg={toast.msg} type={toast.type} />

      <OrgPeriodFilter value={period} onChange={key => { setPeriod(key); setPage(0); }} />

      <div className="admin-stat-grid" style={{ marginBottom: 28 }}>
        <OrgStatCard label="Gross Sales"   value={formatMoney(stats.grossRevenue)} sub="Total value of all tickets sold" color="#6366f1" />
        <OrgStatCard label="Total Refunds" value={formatMoney(stats.refundAmount)} sub="Returned to attendees"           color="#ef4444" />
        <OrgStatCard label="Net Earnings"  value={formatMoney(stats.netRevenue)}   sub="After platform fees"             color="var(--primary)" />
        <OrgStatCard label="Tickets Sold"  value={stats.confirmed.toLocaleString()} sub="Confirmed ticket orders"        color="#10b981" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
        {[
          { title: 'Revenue by Period', key: 'revenue', color: 'var(--primary)', label: 'Revenue (₹)', fmt: v => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}` },
          { title: 'Ticket Volume',     key: 'tickets', color: '#f59e0b',         label: 'Tickets Sold', fmt: null },
        ].map(cfg => (
          <div key={cfg.key} style={{ background: 'white', border: '1px solid var(--neutral-100)', borderRadius: 20, padding: 24 }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: 15, fontWeight: 700 }}>{cfg.title}</h3>
            <div style={{ height: 260 }}>
              {revenuePoints.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenuePoints}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={cfg.fmt || undefined} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={CHART_TOOLTIP_STYLE} />
                    <Legend verticalAlign="top" height={32} />
                    <Bar name={cfg.label} dataKey={cfg.key} fill={cfg.color} radius={[4, 4, 0, 0]} barSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 14 }}>
                  No data for this period
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', border: '1px solid var(--neutral-100)', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--neutral-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Event Breakdown</h3>
          <span style={{ fontSize: 13, color: 'var(--neutral-400)' }}>{filteredItems.length} events</span>
        </div>
        <div className="table-responsive">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Event</th><th>Date</th><th>Gross Sales</th><th>Refunds</th><th>Net Earnings</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pagedItems.map(item => (
                <tr key={item.eventId}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{item.eventTitle}</div>
                    <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 2 }}>
                      {item.confirmedRegistrations || 0} ticket{item.confirmedRegistrations !== 1 ? 's' : ''} sold
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--neutral-600)' }}>{formatDateTime(item.startTime).split(',')[0]}</td>
                  <td style={{ fontWeight: 600 }}>{formatMoney(item.grossRevenue)}</td>
                  <td style={{ color: Number(item.refundAmount) > 0 ? '#ef4444' : '#94a3b8' }}>{formatMoney(item.refundAmount)}</td>
                  <td style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 15 }}>{formatMoney(item.netRevenue)}</td>
                  <td><OrgStatusBadge status={item.status} /></td>
                </tr>
              ))}
              {!pagedItems.length && (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 60, color: 'var(--neutral-400)' }}>No records found for this period.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
    </div>
  );
}
