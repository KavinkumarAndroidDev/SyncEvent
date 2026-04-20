import { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../../api/axiosInstance';
import Button from '../../../../components/Button';
import Pagination from '../../../../components/Pagination';

const PAGE_SIZE = 8;

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);
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

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const pagedUsers = filteredUsers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  async function updateStatus(userId, status) {
    try {
      await axiosInstance.patch(`/users/${userId}/status`, { status });
      setMessageType('success');
      setMessage(`User status changed to ${status}.`);
      await loadUsers();
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Could not update user status.');
    }
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
                <td>{page * PAGE_SIZE + index + 1}</td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{item.fullName}</div>
                  <div style={{ fontSize: 12, color: 'var(--neutral-400)', marginTop: 4 }}>{item.email}</div>
                </td>
                <td>{item.role}</td>
                <td><span className={`badge badge-${String(item.status || '').toLowerCase()}`}>{item.status}</span></td>
                <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</td>
                <td>
                  <div className="row-actions">
                    {item.status !== 'ACTIVE' && <Button variant="table" onClick={() => updateStatus(item.id, 'ACTIVE')}>Activate</Button>}
                    {item.status !== 'SUSPENDED' && <Button variant="table" onClick={() => updateStatus(item.id, 'SUSPENDED')}>Suspend</Button>}
                    {item.status !== 'INACTIVE' && <Button variant="table" onClick={() => updateStatus(item.id, 'INACTIVE')}>Disable</Button>}
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
    </div>
  );
}
