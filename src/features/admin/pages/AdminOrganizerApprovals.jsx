import { useCallback, useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../lib/axios';
import Button from '../../../components/ui/Button';
import Pagination from '../../../components/ui/Pagination';
import Modal from '../../../components/ui/Modal';
import { formatDate } from '../../../utils/formatters';
import AdminConfirmModal from '../components/AdminConfirmModal';
import { exportCsv } from '../utils/adminUtils';

export default function AdminOrganizerApprovals() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedOrganizer, setSelectedOrganizer] = useState(null);
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

  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const pagedItems = filteredItems.slice(page * pageSize, (page + 1) * pageSize);

  async function updateOrganizer(id, status) {
    try {
      setSaving(true);
      await axiosInstance.patch(`/organizer-profiles/${id}/status`, { status });
      setMessageType('success');
      setMessage(`Organizer marked as ${status}.`);
      setConfirm(null);
      setSelectedOrganizer(null);
      await loadOrganizers();
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Could not update organizer status.');
    } finally {
      setSaving(false);
    }
  }

  function askUpdate(item, status) {
    setConfirm({
      title: 'Update Organizer',
      message: `Are you sure you want to mark ${item.organizationName || item.fullName} as ${status}?`,
      onConfirm: () => updateOrganizer(item.id, status),
    });
  }

  function exportOrganizers() {
    exportCsv('organizer-approvals.csv', ['ID', 'Name', 'Email', 'Phone', 'Organization', 'Verified', 'Requested'], filteredItems.map((item) => [
      item.id,
      item.fullName,
      item.email,
      item.phone,
      item.organizationName,
      item.verified ? 'APPROVED' : 'PENDING',
      item.createdAt,
    ]));
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
        <select className="form-input" style={{ width: 150 }} value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}>
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
        <Button variant="secondary" onClick={exportOrganizers}>Export</Button>
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
                <td>{page * pageSize + index + 1}</td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{item.fullName}</div>
                  <div style={{ fontSize: 12, color: 'var(--neutral-400)', marginTop: 4 }}>{item.email}</div>
                </td>
                <td>{item.organizationName || '-'}</td>
                <td><span className={`badge ${item.verified ? 'badge-confirmed' : 'badge-pending'}`}>{item.verified ? 'APPROVED' : 'PENDING'}</span></td>
                <td>{formatDate(item.createdAt)}</td>
                <td>
                  <div className="row-actions">
                    <Button variant="table" onClick={() => setSelectedOrganizer(item)}>View</Button>
                    {!item.verified && <Button variant="table" onClick={() => askUpdate(item, 'APPROVED')}>Approve</Button>}
                    <Button variant="table" onClick={() => askUpdate(item, item.verified ? 'SUSPENDED' : 'REJECTED')}>
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
      <Modal
        isOpen={!!selectedOrganizer}
        title="Organizer Details"
        onClose={() => setSelectedOrganizer(null)}
        actions={<Button variant="table" onClick={() => setSelectedOrganizer(null)}>Close</Button>}
      >
        {selectedOrganizer && (
          <div style={{ display: 'grid', gap: 12, fontSize: 14 }}>
            <div><strong>Name:</strong> {selectedOrganizer.fullName || '-'}</div>
            <div><strong>Email:</strong> {selectedOrganizer.email || '-'}</div>
            <div><strong>Phone:</strong> {selectedOrganizer.phone || '-'}</div>
            <div><strong>Organization:</strong> {selectedOrganizer.organizationName || '-'}</div>
            <div><strong>Description:</strong> {selectedOrganizer.description || 'No description added.'}</div>
            <div><strong>Website:</strong> {selectedOrganizer.website ? <a href={selectedOrganizer.website} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>{selectedOrganizer.website}</a> : '-'}</div>
            <div><strong>Instagram:</strong> {selectedOrganizer.instagram ? <a href={selectedOrganizer.instagram} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>{selectedOrganizer.instagram}</a> : '-'}</div>
            <div><strong>LinkedIn:</strong> {selectedOrganizer.linkedin ? <a href={selectedOrganizer.linkedin} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>{selectedOrganizer.linkedin}</a> : '-'}</div>
            <div><strong>Requested:</strong> {formatDate(selectedOrganizer.createdAt)}</div>
            <div><strong>Status:</strong> {selectedOrganizer.verified ? 'APPROVED' : 'PENDING'}</div>
          </div>
        )}
      </Modal>
      <AdminConfirmModal
        confirm={confirm}
        loading={saving}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.onConfirm?.()}
      />
    </div>
  );
}
