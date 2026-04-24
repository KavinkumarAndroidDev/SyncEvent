import { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../lib/axios';
import Button from '../../../components/ui/Button';
import Pagination from '../../../components/ui/Pagination';
import { formatDate } from '../../../utils/formatters';
import AdminConfirmModal from '../components/AdminConfirmModal';
import { exportCsv } from '../utils/adminUtils';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  async function loadUsers() {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/users?size=200');
      setUsers(res.data.content || []);
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.status === 'ACTIVE').length,
      organizers: users.filter(u => u.role === 'ORGANIZER').length,
      admins: users.filter(u => u.role === 'ADMIN').length
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((item) => {
      const text = `${item.fullName || ''} ${item.email || ''}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || item.role === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const pagedUsers = filteredUsers.slice(page * pageSize, (page + 1) * pageSize);

  async function updateStatus(userId, status) {
    try {
      setSaving(true);
      await axiosInstance.patch(`/users/${userId}/status`, { status });
      setMessageType('success');
      setMessage(`User status updated to ${status}.`);
      setConfirm(null);
      await loadUsers();
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  }

  function askStatus(item, status) {
    setConfirm({
      title: 'Confirm Action',
      message: `Change status for ${item.fullName || item.email} to ${status}?`,
      onConfirm: () => updateStatus(item.id, status),
    });
  }

  function exportUsers() {
    exportCsv('users.csv', ['ID', 'Name', 'Email', 'Role', 'Status'], filteredUsers.map(u => [
      u.id, u.fullName, u.email, u.role, u.status
    ]));
  }

  return (
    <div style={{ padding: 40 }}>
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h2 className="view-title">Users</h2>
          <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>Manage all user accounts and roles on the platform.</p>
        </div>
        <Button variant="secondary" onClick={exportUsers}>Export Data</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Users</div>
          <div className="admin-stat-value">{stats.total}</div>
        </div>
        <div className="admin-stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="admin-stat-label">Active Users</div>
          <div className="admin-stat-value" style={{ color: 'var(--primary)' }}>{stats.active}</div>
        </div>
        <div className="admin-stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div className="admin-stat-label">Organizers</div>
          <div className="admin-stat-value" style={{ color: '#8b5cf6' }}>{stats.organizers}</div>
        </div>
        <div className="admin-stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="admin-stat-label">Admins</div>
          <div className="admin-stat-value" style={{ color: '#ef4444' }}>{stats.admins}</div>
        </div>
      </div>

      {message && <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>{message}</div>}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <input className="form-input" style={{ flex: 1, minWidth: 220 }} placeholder="Search by name or email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
        <select className="form-input" style={{ width: 180 }} value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}>
          <option value="ALL">All Roles</option>
          <option value="ADMIN">Administrator</option>
          <option value="ORGANIZER">Organizer</option>
          <option value="ATTENDEE">Attendee</option>
        </select>
        <select className="form-input" style={{ width: 180 }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="table-responsive">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && pagedUsers.map((item) => (
              <tr key={item.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{item.fullName}</div>
                  <div style={{ fontSize: 12, color: 'var(--neutral-400)' }}>{item.email}</div>
                </td>
                <td style={{ fontSize: 13 }}>{item.role}</td>
                <td><span className={`badge badge-${String(item.status || '').toLowerCase()}`}>{item.status}</span></td>
                <td style={{ fontSize: 13 }}>{formatDate(item.createdAt)}</td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    {item.status !== 'ACTIVE' && <Button variant="table" onClick={() => askStatus(item, 'ACTIVE')}>Activate</Button>}
                    {item.status === 'ACTIVE' && <Button variant="table" onClick={() => askStatus(item, 'SUSPENDED')}>Suspend</Button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      <AdminConfirmModal
        confirm={confirm}
        loading={saving}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.onConfirm?.()}
      />
    </div>
  );
}
