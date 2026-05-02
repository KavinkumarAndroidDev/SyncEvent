import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../../components/ui/Button';
import Pagination from '../../../components/ui/Pagination';
import Modal from '../../../components/ui/Modal';
import { formatDate } from '../../../utils/formatters';
import AdminConfirmModal from '../components/AdminConfirmModal';
import { exportCsv } from '../utils/adminUtils';
import {
  fetchAdminOrganizerApprovals,
  fetchAdminPendingOrganizerCount,
  updateAdminOrganizerStatus
} from '../slices/adminSlice';

export default function AdminOrganizerApprovals() {
  const dispatch = useDispatch();
  const { organizerApprovals: items, pendingOrganizerCount: pendingCount, loading, saving } = useSelector((s) => s.admin);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [confirm, setConfirm] = useState(null);
  const [selectedOrganizer, setSelectedOrganizer] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  const loadOrganizers = useCallback(async () => {
    try {
      await dispatch(fetchAdminOrganizerApprovals(statusFilter)).unwrap();
    } catch (err) {
      setMessageType('error');
      setMessage(err || 'Failed to load requests.');
    }
  }, [dispatch, statusFilter]);

  useEffect(() => {
    dispatch(fetchAdminOrganizerApprovals(statusFilter)).unwrap().catch((err) => {
      setMessageType('error');
      setMessage(err || 'Failed to load requests.');
    });
  }, [dispatch, statusFilter]);

  useEffect(() => {
    dispatch(fetchAdminPendingOrganizerCount());
  }, [dispatch, items]);

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
      const msg = await dispatch(updateAdminOrganizerStatus({ id, status })).unwrap();
      setMessageType('success');
      setMessage(msg);
      setConfirm(null);
      setSelectedOrganizer(null);
      await loadOrganizers();
      dispatch(fetchAdminPendingOrganizerCount());
    } catch (err) {
      setMessageType('error');
      setMessage(err || 'Update failed.');
    }
  }

  function askUpdate(item, status) {
    setConfirm({
      title: 'Confirm Action',
      message: `Mark ${item.organizationName || item.fullName} as ${status}?`,
      onConfirm: () => updateOrganizer(item.id, status),
    });
  }

  function exportOrganizers() {
    exportCsv('organizers.csv', ['ID', 'Name', 'Email', 'Status', 'Requested'], filteredItems.map(i => [
      i.id, i.organizationName || i.fullName, i.email, i.verified ? 'VERIFIED' : 'PENDING', i.createdAt
    ]));
  }

  return (
    <div style={{ padding: 40 }}>
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h2 className="view-title">Organizer Approvals</h2>
          <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>
            {pendingCount > 0 ? `There are ${pendingCount} organizers awaiting approval.` : 'Organizer approval queue is empty.'}
          </p>
        </div>
        <Button variant="secondary" onClick={exportOrganizers}>Export Data</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div className="admin-stat-card" style={{ cursor: 'pointer' }} onClick={() => setStatusFilter('PENDING')}>
          <div className="admin-stat-label">Awaiting Review</div>
          <div className="admin-stat-value" style={{ color: pendingCount > 0 ? '#eab308' : 'inherit' }}>{pendingCount}</div>
        </div>
      </div>

      {message && <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>{message}</div>}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <input className="form-input" style={{ flex: 1, minWidth: 220 }} placeholder="Search by name, email or company..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
        <select className="form-input" style={{ width: 180 }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
          <option value="PENDING">Pending Verification</option>
          <option value="ALL">All Records</option>
        </select>
      </div>

      <div className="table-responsive">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Organizer Details</th>
              <th>Organization</th>
              <th>Status</th>
              <th>Date Filed</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && pagedItems.map((item) => (
              <tr key={item.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{item.fullName}</div>
                  <div style={{ fontSize: 12, color: 'var(--neutral-400)' }}>{item.email}</div>
                </td>
                <td style={{ fontSize: 13 }}>{item.organizationName || 'Individual'}</td>
                <td><span className={`badge ${item.verified ? 'badge-confirmed' : 'badge-pending'}`}>{item.verified ? 'VERIFIED' : 'PENDING'}</span></td>
                <td style={{ fontSize: 13 }}>{formatDate(item.createdAt)}</td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <Button variant="table" onClick={() => setSelectedOrganizer(item)}>Review</Button>
                    {!item.verified && <Button variant="table" onClick={() => askUpdate(item, 'APPROVED')}>Approve</Button>}
                    {!item.verified && <Button variant="table" onClick={() => askUpdate(item, 'REJECTED')}>Reject</Button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal
        isOpen={!!selectedOrganizer}
        title="Organizer Details"
        onClose={() => setSelectedOrganizer(null)}
        maxWidth="700px"
        actions={
          <div style={{ display: 'flex', gap: 12 }}>
            {!selectedOrganizer?.verified && <Button onClick={() => askUpdate(selectedOrganizer, 'APPROVED')} loading={saving}>Approve</Button>}
            {!selectedOrganizer?.verified && <Button variant="secondary" onClick={() => askUpdate(selectedOrganizer, 'REJECTED')} loading={saving}>Reject</Button>}
            {selectedOrganizer?.verified && <Button variant="secondary" onClick={() => askUpdate(selectedOrganizer, 'SUSPENDED')} loading={saving}>Suspend</Button>}
            <Button variant="table" onClick={() => setSelectedOrganizer(null)}>Close</Button>
          </div>
        }
      >
        {selectedOrganizer && (
          <div style={{ display: 'grid', gap: 24, fontSize: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: 'var(--neutral-50)', padding: 16, borderRadius: 12 }}>
                <h4 style={{ marginBottom: 12, fontSize: 13, textTransform: 'uppercase', color: 'var(--neutral-400)' }}>Contact Info</h4>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div><strong>Name:</strong> {selectedOrganizer.fullName}</div>
                  <div><strong>Email:</strong> {selectedOrganizer.email}</div>
                  <div><strong>Phone:</strong> {selectedOrganizer.phone || 'N/A'}</div>
                </div>
              </div>
              <div style={{ background: 'var(--neutral-50)', padding: 16, borderRadius: 12 }}>
                <h4 style={{ marginBottom: 12, fontSize: 13, textTransform: 'uppercase', color: 'var(--neutral-400)' }}>Business Info</h4>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div><strong>Company:</strong> {selectedOrganizer.organizationName || 'N/A'}</div>
                  <div><strong>Website:</strong> {selectedOrganizer.website || 'N/A'}</div>
                  <div><strong>Date Filed:</strong> {formatDate(selectedOrganizer.createdAt)}</div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 style={{ marginBottom: 8 }}>Professional Summary</h4>
              <p style={{ color: 'var(--neutral-600)', lineHeight: '1.6', background: 'var(--white)', padding: 16, border: '1px solid var(--neutral-100)', borderRadius: 12 }}>
                {selectedOrganizer.description || 'No business description provided by the applicant.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              {selectedOrganizer.linkedin && <a href={selectedOrganizer.linkedin} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>LinkedIn Profile ↗</a>}
              {selectedOrganizer.instagram && <a href={selectedOrganizer.instagram} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Instagram ↗</a>}
            </div>
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
