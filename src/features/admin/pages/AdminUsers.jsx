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
      setMessage(`User status changed to ${status}.`);
      setConfirm(null);
      await loadUsers();
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Could not update user status.');
    } finally {
      setSaving(false);
    }
  }

  function askStatus(item, status) {
    setConfirm({
      title: 'Update User Status',
      message: `Are you sure you want to mark ${item.fullName || item.email} as ${status}?`,
      onConfirm: () => updateStatus(item.id, status),
    });
  }

  function exportUsers() {
    exportCsv('users.csv', ['ID', 'Name', 'Email', 'Role', 'Status', 'Joined'], filteredUsers.map((item) => [
      item.id,
      item.fullName,
      item.email,
      item.role,
      item.status,
      item.createdAt,
    ]));
  }

  return (
    <div style={{ padding: 40 }}>
      <div className="view-header">
        <h2 className="view-title">User Management</h2>
        <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>Search users, filter by role, and change account status.</p>
      </div>

      {message && <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>{message}</div>}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <input
          className="form-input"
          style={{ flex: 1, minWidth: 220 }}
          placeholder="Search name or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
        />
        <select className="form-input" style={{ width: 180 }} value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}>
          <option value="ALL">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="ORGANIZER">Organizer</option>
          <option value="ATTENDEE">Attendee</option>
        </select>
        <select className="form-input" style={{ width: 180 }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        <select className="form-input" style={{ width: 150 }} value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}>
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
        <Button variant="secondary" onClick={exportUsers}>Export</Button>
      </div>

      <div className="table-responsive">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>#</th>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && pagedUsers.map((item, index) => (
              <tr key={item.id}>
                <td>{page * pageSize + index + 1}</td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{item.fullName}</div>
                  <div style={{ fontSize: 12, color: 'var(--neutral-400)', marginTop: 4 }}>{item.email}</div>
                </td>
                <td>{item.role}</td>
                <td><span className={`badge badge-${String(item.status || '').toLowerCase()}`}>{item.status}</span></td>
                <td>{formatDate(item.createdAt)}</td>
                <td>
                  <div className="row-actions">
                    {item.status !== 'ACTIVE' && <Button variant="table" onClick={() => askStatus(item, 'ACTIVE')}>Activate</Button>}
                    {item.status !== 'SUSPENDED' && <Button variant="table" onClick={() => askStatus(item, 'SUSPENDED')}>Suspend</Button>}
                    {item.status !== 'INACTIVE' && <Button variant="table" onClick={() => askStatus(item, 'INACTIVE')}>Disable</Button>}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && pagedUsers.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--neutral-400)' }}>
                  No users found.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--neutral-400)' }}>
                  Loading users...
                </td>
              </tr>
            )}
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
