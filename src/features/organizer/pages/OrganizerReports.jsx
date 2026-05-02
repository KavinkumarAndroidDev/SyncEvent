import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Pagination from '../../../components/ui/Pagination';
import Spinner from '../../../components/common/Spinner';
import { formatDateTime, formatMoney } from '../../../utils/formatters';
import { exportCsv } from '../../admin/utils/adminUtils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import OrgPageHeader from '../components/OrgPageHeader';
import OrgStatCard from '../components/OrgStatCard';
import OrgToast from '../components/OrgToast';
import OrgPeriodFilter from '../components/OrgPeriodFilter';
import OrgStatusBadge from '../components/OrgStatusBadge';
import { useToast } from '../components/orgHooks.jsx';
import {
  clearOrganizerReportModal,
  fetchOrganizerReportDetails,
  fetchOrganizerReports
} from '../slices/organizerSlice';

const COLORS = ['#17B978', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function OrganizerReports() {
  const dispatch = useDispatch();
  const {
    reportsSummary: summary,
    reportsItems: items,
    selectedReport,
    selectedRevenue,
    selectedTickets,
    modalLoading,
    loading,
  } = useSelector((s) => s.organizer);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [period, setPeriod] = useState('ALL');
  const [page, setPage] = useState(0);
  const { toast, showToast } = useToast();
  const pageSize = 10;

  useEffect(() => {
    async function loadData() {
      try {
        await dispatch(fetchOrganizerReports()).unwrap();
      } catch (err) {
        showToast(err || 'Failed to load reports.', 'error');
      }
    }
    loadData();
  }, [dispatch, showToast]);

  const filteredItems = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    if (period === '7D') cutoff.setDate(now.getDate() - 7);
    else if (period === '1M') cutoff.setDate(now.getDate() - 30);
    else if (period === '1Y') cutoff.setFullYear(now.getFullYear() - 1);
    else cutoff.setFullYear(2000);

    return items.filter(i => {
      const matchSearch = !search || i.eventTitle?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || i.status === statusFilter;
      const matchPeriod = new Date(i.startTime) >= cutoff;
      return matchSearch && matchStatus && matchPeriod;
    });
  }, [items, search, statusFilter, period]);

  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const pagedItems = filteredItems.slice(page * pageSize, (page + 1) * pageSize);

  const revenueChartData = useMemo(() => {
    return [...filteredItems]
      .sort((a, b) => b.netRevenue - a.netRevenue)
      .slice(0, 8)
      .map(i => ({
        name: i.eventTitle.length > 18 ? i.eventTitle.substring(0, 18) + '…' : i.eventTitle,
        fullName: i.eventTitle,
        revenue: Number(i.netRevenue || 0),
        tickets: Number(i.confirmedRegistrations || 0),
        attendance: Math.min(100, Number(i.attendanceRate || 0))
      }));
  }, [filteredItems]);

  const performanceStats = useMemo(() => {
    if (!items.length) return { avgAttendance: 0, avgRating: 0, topEvent: 'None', totalTickets: 0 };
    const totalAttendance = items.reduce((sum, i) => sum + Math.min(100, Number(i.attendanceRate || 0)), 0);
    const sortedByRevenue = [...items].sort((a, b) => b.netRevenue - a.netRevenue);
    return {
      avgAttendance: items.length > 0 ? totalAttendance / items.length : 0,
      avgRating: summary.averageRating || 0,
      topEvent: sortedByRevenue[0]?.eventTitle || 'None',
      totalTickets: items.reduce((sum, i) => sum + Number(i.confirmedRegistrations || 0), 0),
    };
  }, [items, summary]);

  // Aggregate revenue from event reports if summary is empty
  const totalRevenue = useMemo(() => {
    if (summary.totalRevenue && summary.totalRevenue > 0) return summary.totalRevenue;
    return items.reduce((sum, i) => sum + (i.netRevenue || 0), 0);
  }, [summary, items]);

  const exportData = () => {
    exportCsv('analytics_report.csv',
      ['Event', 'Status', 'Date', 'Revenue', 'Attendance %', 'Rating'],
      filteredItems.map(i => [
        i.eventTitle, i.status, i.startTime, i.netRevenue,
        ((i.attendanceRate || 0) * 100).toFixed(1) + '%', i.averageRating
      ])
    );
  };

  async function openReport(item) {
    try {
      await dispatch(fetchOrganizerReportDetails(item.eventId)).unwrap();
    } catch {
      showToast('Failed to load event report.', 'error');
    }
  }

  if (loading && !items.length) return <Spinner label="Loading performance reports..." />;

  return (
    <div style={{ padding: 40 }}>
      <OrgPageHeader
        title="Performance Reports"
        subtitle="Understand how your events are performing through revenue and engagement data."
        actions={<Button variant="secondary" onClick={exportData} disabled={filteredItems.length === 0}>Download Report (CSV)</Button>}
      />

      <OrgToast msg={toast.msg} type={toast.type} />

      <OrgPeriodFilter value={period} onChange={key => { setPeriod(key); setPage(0); }} />

      <div className="admin-stat-grid" style={{ marginBottom: 28 }}>
        <OrgStatCard label="Total Revenue"     value={formatMoney(totalRevenue)}                                     sub="Lifetime Net Earnings"            color="var(--primary)" />
        <OrgStatCard label="Avg. Check-in Rate" value={`${Math.min(100, performanceStats.avgAttendance).toFixed(1)}%`} sub="Check-in Rate Across Events"       color="#10b981" />
        <OrgStatCard label="Top Event"          value={performanceStats.topEvent}                                     sub="Highest Net Revenue"              color="#6366f1" />
        <OrgStatCard label="Avg. Rating"        value={performanceStats.avgRating > 0 ? `${performanceStats.avgRating.toFixed(1)} / 5` : 'N/A'} sub="Attendee Satisfaction" color="#f59e0b" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
        <div style={{ background: 'white', border: '1px solid var(--neutral-100)', borderRadius: 16, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Top Events by Revenue</h3>
          <p style={{ fontSize: 12, color: 'var(--neutral-400)', marginBottom: 20 }}>Your highest earning events</p>
          <div style={{ height: 260 }}>
            {revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChartData} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 11}} width={110} />
                  <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString()}`, 'Net Revenue']} labelFormatter={(l, payload) => payload?.[0]?.payload?.fullName || l} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="revenue" name="Net Revenue" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No data yet</div>
            )}
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid var(--neutral-100)', borderRadius: 16, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Top Events by Tickets Sold</h3>
          <p style={{ fontSize: 12, color: 'var(--neutral-400)', marginBottom: 20 }}>Confirmed paid registrations</p>
          <div style={{ height: 260 }}>
            {revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...revenueChartData].sort((a, b) => b.tickets - a.tickets)} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 11}} width={110} />
                  <Tooltip formatter={(v) => [v, 'Tickets Sold']} labelFormatter={(l, payload) => payload?.[0]?.payload?.fullName || l} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="tickets" name="Tickets Sold" fill="#10b981" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No data yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input
          className="form-input" style={{ flex: 1, minWidth: 240 }}
          placeholder="Search by event name..."
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        />
        <select className="form-input" style={{ width: 180 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">All Statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="DRAFT">Draft</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Status</th>
              <th>Net Revenue</th>
              <th>Attendance</th>
              <th>Rating</th>
              <th style={{ textAlign: 'right' }}>Report</th>
            </tr>
          </thead>
          <tbody>
            {pagedItems.map((item) => (
              <tr key={item.eventId}>
                <td>
                  <div style={{ fontWeight: 600 }}>{item.eventTitle}</div>
                  <div style={{ fontSize: 11, color: 'var(--neutral-400)' }}>{formatDateTime(item.startTime).split(',')[0]}</div>
                </td>
                <td><OrgStatusBadge status={item.status} /></td>
                <td>
                  <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatMoney(item.netRevenue)}</div>
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{Math.min(100, Number(item.attendanceRate || 0)).toFixed(1)}%</div>
                  <div style={{ fontSize: 11, color: 'var(--neutral-400)' }}>
                    {item.checkedInParticipants || 0} / {item.confirmedRegistrations || 0} checked in
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#f59e0b' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    {Number(item.averageRating || 0).toFixed(1)}
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <Button variant="table" onClick={() => openReport(item)}>View Report</Button>
                </td>
              </tr>
            ))}
            {!pagedItems.length && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--neutral-400)' }}>
                  No events found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}

      {/* Deep-dive Modal */}
      <Modal
        isOpen={!!selectedReport}
        title={selectedReport ? `Event Report: ${selectedReport.eventTitle}` : ''}
        onClose={() => dispatch(clearOrganizerReportModal())}
        maxWidth="950px"
        actions={<Button variant="table" onClick={() => dispatch(clearOrganizerReportModal())}>Close</Button>}
      >
        {modalLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Spinner label="Loading event report..." />
          </div>
        ) : selectedReport && !selectedReport._loading && (
          <div style={{ display: 'grid', gap: 24 }}>
            {/* Revenue Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { label: 'Gross Sales', value: formatMoney(selectedRevenue?.grossRevenue), color: '#6366f1' },
                { label: 'Refunds', value: formatMoney(selectedRevenue?.refundAmount), color: '#ef4444' },
                { label: 'Net Revenue', value: formatMoney(selectedRevenue?.netRevenue), color: 'var(--primary)' },
                { label: 'Attendance', value: `${Math.min(100, Number(selectedReport.attendanceRate || 0)).toFixed(1)}%`, color: '#10b981' },
              ].map(card => (
                <div key={card.label} style={{ background: 'var(--neutral-50)', padding: '16px 18px', borderRadius: 12, borderTop: `3px solid ${card.color}` }}>
                  <div style={{ fontSize: 11, color: 'var(--neutral-400)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: 8 }}>{card.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: card.color }}>{card.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* Registration Funnel */}
              <div style={{ border: '1px solid var(--neutral-100)', borderRadius: 12, padding: 20 }}>
                <h4 style={{ marginBottom: 16, fontSize: 14, fontWeight: 700 }}>Registration Funnel</h4>
                <div style={{ display: 'grid', gap: 10, fontSize: 14 }}>
                  {[
                    { label: 'Event Capacity', value: selectedReport.capacity || 'Unlimited' },
                    { label: 'Total Orders', value: selectedReport.totalRegistrations || 0 },
                    { label: 'Confirmed & Paid', value: selectedReport.confirmedRegistrations || 0 },
                    { label: 'Total Participants', value: selectedReport.totalParticipants || 0 },
                    { label: 'Checked In', value: selectedReport.checkedInParticipants || 0, highlight: true },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--neutral-50)' }}>
                      <span style={{ color: 'var(--neutral-600)' }}>{row.label}</span>
                      <strong style={{ color: row.highlight ? 'var(--primary)' : 'var(--neutral-900)' }}>{row.value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ticket Breakdown */}
              <div style={{ border: '1px solid var(--neutral-100)', borderRadius: 12, padding: 20 }}>
                <h4 style={{ marginBottom: 16, fontSize: 14, fontWeight: 700 }}>Ticket Tier Breakdown</h4>
                {selectedTickets.length > 0 ? (
                  <div className="table-responsive">
                    <table className="dashboard-table" style={{ fontSize: 13 }}>
                      <thead><tr><th>Tier</th><th>Price</th><th>Sold</th><th>Revenue</th></tr></thead>
                      <tbody>
                        {selectedTickets.map((t) => (
                          <tr key={t.ticketId}>
                            <td>{t.ticketName}</td>
                            <td>{formatMoney(t.price)}</td>
                            <td style={{ fontWeight: 700 }}>{t.soldQuantity}</td>
                            <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatMoney(t.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 20, color: 'var(--neutral-400)', fontSize: 13 }}>
                    No ticket data available.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
