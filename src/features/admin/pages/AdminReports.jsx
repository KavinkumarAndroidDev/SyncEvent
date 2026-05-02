import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../../components/ui/Button';
import { formatMoney } from '../../../utils/formatters';
import { exportCsv } from '../utils/adminUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { fetchAdminReports } from '../slices/adminSlice';

function StatBox({ label, value }) {
  return (
    <div className="admin-stat-card" style={{ background: 'var(--white)', padding: '24px', borderRadius: '16px', border: '1px solid var(--neutral-100)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
      <div style={{ fontSize: '13px', color: 'var(--neutral-400)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--neutral-900)' }}>{value}</div>
    </div>
  );
}

export default function AdminReports() {
  const dispatch = useDispatch();
  const { reports, loading } = useSelector((s) => s.admin);
  const { summary, revenue, organizers, categoryData } = reports;
  const [timeRange, setTimeRange] = useState('30d');
  const [organizerSort, setOrganizerSort] = useState({ key: 'organizerName', direction: 'asc' });

  const COLORS = ['#17B978', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  useEffect(() => {
    dispatch(fetchAdminReports(timeRange));
  }, [dispatch, timeRange]);

  const sortedOrganizers = [...organizers].sort((a, b) => {
    const aVal = a[organizerSort.key] || 0;
    const bVal = b[organizerSort.key] || 0;
    if (organizerSort.direction === 'asc') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  const toggleSort = (key) => {
    setOrganizerSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  function exportReports() {
    exportCsv('admin-reports.csv', ['Metric', 'Value'], [
      ['Total Events', summary?.totalEvents || 0],
      ['Published Events', summary?.publishedEvents || 0],
      ['Registrations', summary?.totalRegistrations || 0],
      ['Confirmed Registrations', summary?.confirmedRegistrations || 0],
      ['Revenue', summary?.totalRevenue || 0],
      ['Participants', summary?.totalParticipants || 0],
    ]);
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--neutral-400)' }}>Loading reports...</div>;

  return (
    <div style={{ padding: 40 }}>
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '32px' }}>
        <div>
          <h2 className="view-title">Reports & Analytics</h2>
          <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>Platform revenue, registrations and organizer performance.</p>
        </div>
        <Button variant="secondary" onClick={exportReports}>Export Data</Button>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: '32px', alignItems: 'center', background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid var(--neutral-100)' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-600)' }}>Analyze for:</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { label: 'Last 7 Days', value: '7d' },
            { label: 'Last 30 Days', value: '30d' },
            { label: 'Last 6 Months', value: '6m' },
            { label: 'Last Year', value: '1y' }
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setTimeRange(opt.value)}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600,
                border: '1px solid var(--neutral-100)',
                background: timeRange === opt.value ? 'var(--neutral-900)' : 'white',
                color: timeRange === opt.value ? 'white' : 'var(--neutral-600)',
                cursor: 'pointer',
                transition: '0.2s'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <StatBox label="Total Events" value={summary?.totalEvents || 0} />
        <StatBox label="Registrations" value={summary?.totalRegistrations || 0} />
        <StatBox label="Net Revenue" value={formatMoney(summary?.totalRevenue)} />
        <StatBox label="Participants" value={summary?.totalParticipants || 0} />
      </div>

      <div className="admin-overview-grid" style={{ marginBottom: '32px' }}>
        <div className="overview-card">
          <h3 style={{ margin: '0 0 24px 0', fontSize: '17px', fontWeight: 700 }}>Revenue Performance</h3>
          <div style={{ width: '100%', height: 300 }}>
            {revenue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenue}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--neutral-100)" />
                  <XAxis dataKey={(d) => d.label || d.period} tick={{ fontSize: 11, fill: 'var(--neutral-400)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--neutral-400)' }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip cursor={{ fill: 'var(--neutral-50)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(val) => [formatMoney(val), 'Revenue']} />
                  <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neutral-400)', fontSize: '14px' }}>
                No revenue data for this range.
              </div>
            )}
          </div>
        </div>

        <div className="overview-card">
          <h3 style={{ margin: '0 0 24px 0', fontSize: '17px', fontWeight: 700 }}>Category Distribution</h3>
          <div style={{ width: '100%', height: 300 }}>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neutral-400)', fontSize: '14px' }}>
                No event data available.
              </div>
            )}
          </div>
        </div>
      </div>

        <div className="overview-card" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Organizer Performance</h3>
            <span style={{ fontSize: '12px', color: 'var(--neutral-400)' }}>Click headers to sort</span>
          </div>
          <div className="table-responsive">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('organizerName')}>
                    Organizer {organizerSort.key === 'organizerName' ? (organizerSort.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('totalEvents')}>
                    Events {organizerSort.key === 'totalEvents' ? (organizerSort.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('totalRevenue')}>
                    Revenue {organizerSort.key === 'totalRevenue' ? (organizerSort.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedOrganizers.map((item) => (
                  <tr key={item.organizerId}>
                    <td style={{ fontWeight: 600 }}>{item.organizerName}</td>
                    <td>{item.totalEvents || 0}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatMoney(item.totalRevenue)}</td>
                  </tr>
                ))}
                {sortedOrganizers.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', padding: 32, color: 'var(--neutral-400)' }}>No organizer data.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
}
