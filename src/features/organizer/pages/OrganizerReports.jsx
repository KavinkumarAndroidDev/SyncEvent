import { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../lib/axios';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Pagination from '../../../components/ui/Pagination';
import Spinner from '../../../components/common/Spinner';
import { formatDateTime, formatMoney } from '../../../utils/formatters';
import { formatPercent, getBadgeClass } from '../utils/organizerHelpers';
import { exportCsv } from '../../admin/utils/adminUtils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend, ComposedChart, Area
} from 'recharts';

const COLORS = ['#17B978', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function OrganizerReports() {
  const [summary, setSummary] = useState({});
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedRevenue, setSelectedRevenue] = useState(null);
  const [selectedTickets, setSelectedTickets] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [message, setMessage] = useState('');
  const pageSize = 10;

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [summaryRes, reportsRes] = await Promise.all([
          axiosInstance.get('/reports/summary'),
          axiosInstance.get('/reports/events?size=500'),
        ]);
        setSummary(summaryRes.data || {});
        setItems(reportsRes.data?.content || []);
      } catch (err) {
        setMessage(err.response?.data?.message || 'Failed to load analytical reports.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter(i => {
      const matchSearch = !search || i.eventTitle?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || i.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [items, search, statusFilter]);

  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const pagedItems = filteredItems.slice(page * pageSize, (page + 1) * pageSize);

  const revenueChartData = useMemo(() => {
    return [...filteredItems]
      .sort((a, b) => b.netRevenue - a.netRevenue)
      .slice(0, 8)
      .map(i => ({
        name: i.eventTitle.length > 15 ? i.eventTitle.substring(0, 15) + '...' : i.eventTitle,
        revenue: i.netRevenue || 0,
        attendance: (i.attendanceRate || 0) * 100
      }));
  }, [filteredItems]);

  const performanceStats = useMemo(() => {
    if (!items.length) return { avgAttendance: 0, avgRating: 0, topEvent: 'None' };
    
    const totalAttendance = items.reduce((sum, i) => sum + (i.attendanceRate || 0), 0);
    const sortedByRevenue = [...items].sort((a, b) => b.netRevenue - a.netRevenue);
    
    return {
      avgAttendance: (totalAttendance / items.length) * 100,
      avgRating: summary.averageRating || 0,
      topEvent: sortedByRevenue[0]?.eventTitle || 'None'
    };
  }, [items, summary]);

  const exportData = () => {
    exportCsv('analytical_report.csv', ['Event', 'Status', 'Date', 'Revenue', 'Attendance %', 'Rating'], filteredItems.map(i => [
      i.eventTitle, i.status, i.startTime, i.netRevenue, (i.attendanceRate * 100).toFixed(1) + '%', i.averageRating
    ]));
  };

  async function openReport(item) {
    try {
      const [reportRes, revenueRes, ticketsRes] = await Promise.all([
        axiosInstance.get(`/reports/events/${item.eventId}`),
        axiosInstance.get(`/reports/events/${item.eventId}/revenue`),
        axiosInstance.get(`/reports/events/${item.eventId}/tickets`),
      ]);
      setSelectedReport(reportRes.data);
      setSelectedRevenue(revenueRes.data);
      setSelectedTickets(ticketsRes.data || []);
    } catch (err) {
      setMessage('Failed to load deep-dive report.');
    }
  }

  if (loading && !items.length) return <Spinner label="Generating Intelligence Reports..." />;

  return (
    <div style={{ padding: 40 }}>
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h2 className="view-title">Performance Insights</h2>
          <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>Understand how your events are performing through revenue and engagement data.</p>
        </div>
        <Button variant="secondary" onClick={exportData} disabled={filteredItems.length === 0}>Download Report (CSV)</Button>
      </div>

      <div className="admin-stat-grid" style={{ marginBottom: 32 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Overall Revenue</div>
          <div className="admin-stat-value" style={{ color: 'var(--primary)' }}>{formatMoney(summary.totalRevenue)}</div>
          <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 4 }}>Lifetime Earnings</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Avg. Engagement</div>
          <div className="admin-stat-value">{performanceStats.avgAttendance.toFixed(1)}%</div>
          <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 4 }}>Attendance Rate</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Top Performer</div>
          <div className="admin-stat-value" style={{ fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{performanceStats.topEvent}</div>
          <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 4 }}>Highest Net Revenue</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Satisfaction Score</div>
          <div className="admin-stat-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            {Number(performanceStats.avgRating).toFixed(1)}/5.0
          </div>
          <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 4 }}>Platform Average</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        <div style={{ background: 'white', border: '1px solid var(--neutral-100)', borderRadius: 16, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--neutral-800)', marginBottom: 24 }}>Revenue vs Attendance (Top 8 Events)</h3>
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} tick={{fill: '#94a3b8', fontSize: 10}} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} tick={{fill: '#94a3b8', fontSize: 10}} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Legend verticalAlign="top" height={36}/>
                <Bar yAxisId="left" name="Net Revenue (₹)" dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={24} />
                <Line yAxisId="right" name="Attendance Rate (%)" type="monotone" dataKey="attendance" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid var(--neutral-100)', borderRadius: 16, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--neutral-800)', marginBottom: 24 }}>Event Status Breakdown</h3>
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Published', value: items.filter(i => i.status === 'PUBLISHED').length },
                    { name: 'Pending/Draft', value: items.filter(i => ['DRAFT', 'PENDING_APPROVAL'].includes(i.status)).length },
                    { name: 'Completed', value: items.filter(i => i.status === 'COMPLETED').length },
                    { name: 'Cancelled', value: items.filter(i => i.status === 'CANCELLED').length }
                  ]}
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {COLORS.map((color, index) => <Cell key={`cell-${index}`} fill={color} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 20 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <input 
          className="form-input" 
          style={{ flex: 1, minWidth: 250 }} 
          placeholder="Filter by event name..." 
          value={search} 
          onChange={(e) => { setSearch(e.target.value); setPage(0); }} 
        />
        <select className="form-input" style={{ width: 180 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">All Statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="table-responsive">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Event Performance</th>
              <th>Status</th>
              <th>Financials</th>
              <th>Engagement</th>
              <th>Rating</th>
              <th style={{ textAlign: 'right' }}>Analysis</th>
            </tr>
          </thead>
          <tbody>
            {pagedItems.map((item) => (
              <tr key={item.eventId}>
                <td>
                  <div style={{ fontWeight: 600 }}>{item.eventTitle}</div>
                  <div style={{ fontSize: 11, color: 'var(--neutral-400)' }}>Started {formatDateTime(item.startTime)}</div>
                </td>
                <td><span className={getBadgeClass(item.status)}>{item.status}</span></td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{formatMoney(item.netRevenue)}</div>
                  <div style={{ fontSize: 11, color: 'var(--neutral-400)' }}>Net Revenue</div>
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{formatPercent(item.attendanceRate)}</div>
                  <div style={{ fontSize: 11, color: 'var(--neutral-400)' }}>{item.checkedInParticipants || 0} / {item.confirmedRegistrations || 0} arrived</div>
                </td>
                <td style={{ fontWeight: 700, color: '#f59e0b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    {Number(item.averageRating || 0).toFixed(1)}
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}><Button variant="table" onClick={() => openReport(item)}>Deep Dive</Button></td>
              </tr>
            ))}
            {!pagedItems.length && <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--neutral-400)' }}>No analytical data found.</td></tr>}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}

      <Modal
        isOpen={!!selectedReport}
        title={`Intelligence Deep-Dive: ${selectedReport?.eventTitle}`}
        onClose={() => setSelectedReport(null)}
        maxWidth="950px"
        actions={<Button variant="table" onClick={() => setSelectedReport(null)}>Close Insight</Button>}
      >
        {selectedReport && (
          <div style={{ display: 'grid', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <div style={{ background: 'var(--neutral-50)', padding: 16, borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--neutral-400)', textTransform: 'uppercase' }}>Gross Sales</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{formatMoney(selectedRevenue?.grossRevenue)}</div>
              </div>
              <div style={{ background: 'var(--neutral-50)', padding: 16, borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--neutral-400)', textTransform: 'uppercase' }}>Refunds</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#ef4444' }}>{formatMoney(selectedRevenue?.refundAmount)}</div>
              </div>
              <div style={{ background: 'var(--neutral-50)', padding: 16, borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--neutral-400)', textTransform: 'uppercase' }}>Net ROI</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>{formatMoney(selectedRevenue?.netRevenue)}</div>
              </div>
              <div style={{ background: 'var(--neutral-50)', padding: 16, borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--neutral-400)', textTransform: 'uppercase' }}>Attendance</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{formatPercent(selectedReport.attendanceRate)}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div style={{ border: '1px solid var(--neutral-100)', borderRadius: 12, padding: 20 }}>
                <h4 style={{ marginBottom: 16, fontSize: 14 }}>Registration Funnel</h4>
                <div style={{ display: 'grid', gap: 12, fontSize: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Slots:</span> <strong>{selectedReport.capacity || 'Unlimited'}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Orders:</span> <strong>{selectedReport.totalRegistrations || 0}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Paid/Confirmed:</span> <strong>{selectedReport.confirmedRegistrations || 0}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Participants:</span> <strong>{selectedReport.totalParticipants || 0}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Check-ins:</span> <strong style={{ color: 'var(--primary)' }}>{selectedReport.checkedInParticipants || 0}</strong></div>
                </div>
              </div>

              <div style={{ border: '1px solid var(--neutral-100)', borderRadius: 12, padding: 20 }}>
                <h4 style={{ marginBottom: 16, fontSize: 14 }}>Ticket Tier Efficiency</h4>
                <div className="table-responsive">
                  <table className="dashboard-table" style={{ fontSize: 12 }}>
                    <thead><tr><th>Tier</th><th>Price</th><th>Sold</th><th>Revenue</th></tr></thead>
                    <tbody>
                      {selectedTickets.map((item) => (
                        <tr key={item.ticketId}>
                          <td>{item.ticketName}</td>
                          <td>{formatMoney(item.price)}</td>
                          <td>{item.soldQuantity}</td>
                          <td style={{ fontWeight: 600 }}>{formatMoney(item.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
