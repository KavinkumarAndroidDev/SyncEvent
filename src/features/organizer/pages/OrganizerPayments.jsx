import { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../lib/axios';
import Pagination from '../../../components/ui/Pagination';
import Spinner from '../../../components/common/Spinner';
import Button from '../../../components/ui/Button';
import { formatDateTime, formatMoney } from '../../../utils/formatters';
import { getBadgeClass } from '../utils/organizerHelpers';
import { exportCsv } from '../../admin/utils/adminUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

export default function OrganizerPayments() {
  const [items, setItems] = useState([]);
  const [revenuePoints, setRevenuePoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [period, setPeriod] = useState('ALL');
  const [message, setMessage] = useState('');
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

        const fromStr = from.toISOString().split('T')[0];
        const toStr = to.toISOString().split('T')[0];

        const [eventsRes, revenueRes] = await Promise.all([
          axiosInstance.get('/reports/events?size=500'),
          axiosInstance.get(`/reports/revenue?from=${fromStr}&to=${toStr}&groupBy=${groupBy}`).catch(() => ({ data: [] })),
        ]);
        setItems(eventsRes.data?.content || []);
        
        const points = (revenueRes.data || []).map(p => ({
          name: p.label || 'Unknown',
          revenue: p.amount || 0,
          tickets: p.ticketsSold || 0
        }));
        setRevenuePoints(points);
      } catch (err) {
        setMessage('Failed to load financial data.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [period]);

  const filteredItems = useMemo(() => {
    if (period === 'ALL') return items;
    const now = new Date();
    const cutoff = new Date();
    if (period === '7D') cutoff.setDate(now.getDate() - 7);
    else if (period === '1M') cutoff.setDate(now.getDate() - 30);
    else if (period === '1Y') cutoff.setFullYear(now.getFullYear() - 1);
    
    return items.filter(item => new Date(item.startTime) >= cutoff);
  }, [items, period]);

  const stats = useMemo(() => ({
    grossRevenue: filteredItems.reduce((sum, item) => sum + Number(item.grossRevenue || 0), 0),
    refundAmount: filteredItems.reduce((sum, item) => sum + Number(item.refundAmount || 0), 0),
    netRevenue: filteredItems.reduce((sum, item) => sum + Number(item.netRevenue || 0), 0),
    confirmed: filteredItems.reduce((sum, item) => sum + Number(item.confirmedRegistrations || 0), 0),
  }), [filteredItems]);

  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const pagedItems = filteredItems.slice(page * pageSize, (page + 1) * pageSize);

  const exportStatement = () => {
    exportCsv('revenue_statement.csv', ['Event', 'Date', 'Tickets Sold', 'Gross Sales', 'Refunds', 'Your Earnings', 'Status'], filteredItems.map(i => [
      i.eventTitle, i.startTime, i.confirmedRegistrations, i.grossRevenue, i.refundAmount, i.netRevenue, i.status
    ]));
  };

  if (loading && !items.length) return <Spinner label="Updating your financial records..." />;

  return (
    <div style={{ padding: 40 }}>
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h2 className="view-title">Payments & Revenue</h2>
          <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>Track your ticket sales, earnings, and refund status across all events.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <select value={period} onChange={(e) => { setPeriod(e.target.value); setPage(0); }} className="form-input" style={{ width: 150 }}>
            <option value="7D">Past 7 Days</option>
            <option value="1M">Past 30 Days</option>
            <option value="1Y">This Year</option>
            <option value="ALL">All Time</option>
          </select>
          <Button variant="secondary" onClick={exportStatement} disabled={!filteredItems.length}>Export Records</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 32 }}>
        <div className="admin-stat-card" style={{ borderTop: '4px solid #6366f1' }}>
          <div className="admin-stat-label">Total Sales (Gross)</div>
          <div className="admin-stat-value" style={{ color: '#1e293b' }}>{formatMoney(stats.grossRevenue)}</div>
          <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 4 }}>Total value of all tickets sold</div>
        </div>
        <div className="admin-stat-card" style={{ borderTop: '4px solid #ef4444' }}>
          <div className="admin-stat-label">Total Refunds</div>
          <div className="admin-stat-value" style={{ color: '#ef4444' }}>{formatMoney(stats.refundAmount)}</div>
          <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 4 }}>Amount returned to attendees</div>
        </div>
        <div className="admin-stat-card" style={{ borderTop: '4px solid var(--primary)' }}>
          <div className="admin-stat-label">Your Earnings (Net)</div>
          <div className="admin-stat-value" style={{ color: 'var(--primary)' }}>{formatMoney(stats.netRevenue)}</div>
          <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 4 }}>Profit after platform fees</div>
        </div>
        <div className="admin-stat-card" style={{ borderTop: '4px solid #10b981' }}>
          <div className="admin-stat-label">Tickets Sold</div>
          <div className="admin-stat-value" style={{ color: '#10b981' }}>{stats.confirmed}</div>
          <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 4 }}>Successful ticket orders</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        <div style={{ background: 'white', border: '1px solid var(--neutral-100)', borderRadius: 20, padding: 24 }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: 16, fontWeight: 700 }}>Revenue Trend</h3>
          <div style={{ height: 280 }}>
            {revenuePoints.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenuePoints}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} tick={{fill: '#94a3b8', fontSize: 11}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <Bar name="Revenue (₹)" dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No sales data for this period.</div>}
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid var(--neutral-100)', borderRadius: 20, padding: 24 }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: 16, fontWeight: 700 }}>Order Volume</h3>
          <div style={{ height: 280 }}>
            {revenuePoints.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenuePoints}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <Bar name="Tickets Sold" dataKey="tickets" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No volume data for this period.</div>}
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Event Name</th>
              <th>Date</th>
              <th>Total Sales</th>
              <th>Refunds</th>
              <th>Earnings</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {pagedItems.map((item) => (
              <tr key={item.eventId}>
                <td>
                  <div style={{ fontWeight: 700, color: '#1e293b' }}>{item.eventTitle}</div>
                  <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 2 }}>{item.confirmedRegistrations || 0} tickets sold</div>
                </td>
                <td style={{ fontSize: 13, color: 'var(--neutral-600)' }}>{formatDateTime(item.startTime).split(',')[0]}</td>
                <td style={{ fontWeight: 600 }}>{formatMoney(item.grossRevenue)}</td>
                <td style={{ color: item.refundAmount > 0 ? '#ef4444' : '#94a3b8' }}>{formatMoney(item.refundAmount)}</td>
                <td style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 15 }}>{formatMoney(item.netRevenue)}</td>
                <td><span className={getBadgeClass(item.status)}>{item.status}</span></td>
              </tr>
            ))}
            {!pagedItems.length && <tr><td colSpan="6" style={{ textAlign: 'center', padding: 60, color: 'var(--neutral-400)' }}>No records match your filters.</td></tr>}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
    </div>
  );
}
