import { useCallback, useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../lib/axios';
import Button from '../../../components/ui/Button';
import Pagination from '../../../components/ui/Pagination';

const PAGE_SIZE = 8;

export default function AdminOrganizerApprovals() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  const loadOrganizers = useCallback(async () => {
    try {
      setLoading(true);
      const query = statusFilter === 'ALL' ? '/organizer-profiles?size=200' : `/organizer-profiles?status=${statusFilter}&size=200`;
      const res = await axiosInstance.get(query);
      setItems(res.data.content || []);
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Failed to load organizer requests.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadOrganizers();
  }, [loadOrganizers]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const text = `${item.fullName || ''} ${item.email || ''} ${item.organizationName || ''}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [items, search]);

  const totalPages = Math.ceil(filteredItems.length / PAGE_SIZE);
  const pagedItems = filteredItems.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  async function updateOrganizer(id, status) {
    try {
      await axiosInstance.patch(`/organizer-profiles/${id}/status`, { status });
      setMessageType('success');
      setMessage(`Organizer marked as ${status}.`);
      await loadOrganizers();
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Could not update organizer status.');
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <div className="view-header">
        <h2 className="view-title">Organizer Approvals</h2>
        <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>Approve or reject organizer access requests.</p>
      </div>

      {message && <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>{message}</div>}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <input
          className="form-input"
          style={{ flex: 1, minWidth: 220 }}
          placeholder="Search organizer or company..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
        />
        <select className="form-input" style={{ width: 180 }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
          <option value="PENDING">Pending</option>
          <option value="ALL">All</option>
        </select>
      </div>

      <div className="table-responsive">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Organizer</th>
              <th>Organization</th>
              <th>Status</th>
              <th>Requested</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && pagedItems.map((item, index) => (
              <tr key={item.id}>
                <td>{page * PAGE_SIZE + index + 1}</td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{item.fullName}</div>
                  <div style={{ fontSize: 12, color: 'var(--neutral-400)', marginTop: 4 }}>{item.email}</div>
                </td>
                <td>{item.organizationName || '-'}</td>
                <td><span className={`badge ${item.verified ? 'badge-confirmed' : 'badge-pending'}`}>{item.verified ? 'APPROVED' : 'PENDING'}</span></td>
                <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</td>
                <td>
                  <div className="row-actions">
                    {!item.verified && <Button variant="table" onClick={() => updateOrganizer(item.id, 'APPROVED')}>Approve</Button>}
                    <Button variant="table" onClick={() => updateOrganizer(item.id, item.verified ? 'SUSPENDED' : 'REJECTED')}>
                      {item.verified ? 'Suspend' : 'Reject'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && pagedItems.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--neutral-400)' }}>
                  No organizer requests found.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--neutral-400)' }}>
                  Loading organizer requests...
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
