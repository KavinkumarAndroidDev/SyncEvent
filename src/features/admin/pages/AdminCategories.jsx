import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMetadata } from '../../metadata/slices/metadataSlice';
import Pagination from '../../../components/ui/Pagination';
import Button from '../../../components/ui/Button';
import AdminEntityModal from '../components/AdminEntityModal';
import AdminStatusBadge from '../components/AdminStatusBadge';
import AdminConfirmModal from '../components/AdminConfirmModal';
import { exportCsv } from '../utils/adminUtils';
import { fetchAdminCategories, saveAdminCategory, updateAdminCategoryStatus } from '../slices/adminSlice';

const EMPTY_FORM = { categoryName: '' };

export default function AdminCategories() {
  const dispatch = useDispatch();
  const { categories: items, loading, saving } = useSelector((s) => s.admin);
  const [search, setSearch] = useState('');
  const [sort] = useState('name-asc');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [confirm, setConfirm] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    dispatch(fetchAdminCategories()).unwrap().catch((err) => {
      setMessageType('error');
      setMessage(err || 'Failed to load categories.');
    });
  }, [dispatch]);

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter(i => i.status === 'ACTIVE').length,
    inactive: items.filter(i => i.status === 'INACTIVE').length,
  }), [items]);

  const filteredItems = useMemo(() => {
    const result = items.filter((item) => {
      const matchesSearch = item.name?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    result.sort((a, b) => {
      if (sort === 'name-asc') return a.name.localeCompare(b.name);
      if (sort === 'name-desc') return b.name.localeCompare(a.name);
      return Number(b.id) - Number(a.id);
    });

    return result;
  }, [items, search, sort, statusFilter]);

  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const pagedItems = filteredItems.slice(page * pageSize, (page + 1) * pageSize);

  function exportItems() {
    exportCsv('categories.csv', ['ID', 'Category Name', 'Status'], filteredItems.map(i => [i.id, i.name, i.status]));
  }

  function openCreateModal() {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowModal(true);
  }

  function openEditModal(item) {
    setEditingItem(item);
    setForm({ categoryName: item.name || '' });
    setErrors({});
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

  async function handleSubmit() {
    if (!form.categoryName.trim()) {
      setErrors({ categoryName: 'Required' });
      return;
    }

    try {
      const msg = await dispatch(saveAdminCategory({ editingItem, form })).unwrap();
      setMessageType('success');
      setMessage(msg);
      closeModal();
      await dispatch(fetchAdminCategories()).unwrap();
      dispatch(fetchMetadata());
    } catch (err) {
      setMessageType('error');
      setMessage(err || 'Operation failed.');
    }
  }

  async function toggleStatus(item) {
    try {
      const msg = await dispatch(updateAdminCategoryStatus(item)).unwrap();
      setMessageType('success');
      setMessage(msg);
      setConfirm(null);
      await dispatch(fetchAdminCategories()).unwrap();
      dispatch(fetchMetadata());
    } catch (err) {
      setMessageType('error');
      setMessage(err || 'Status update failed.');
    }
  }

  function askToggleStatus(item) {
    const nextStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setConfirm({
      title: 'Confirm Action',
      message: `Change status for ${item.name} to ${nextStatus === 'ACTIVE' ? 'Activate' : 'Suspend'}?`,
      onConfirm: () => toggleStatus(item),
    });
  }

  return (
    <div style={{ padding: 40 }}>
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h2 className="view-title">Categories</h2>
          <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>Manage event categories for the platform.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="secondary" onClick={exportItems}>Export Data</Button>
          <Button onClick={openCreateModal}>Add Category</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Categories</div>
          <div className="admin-stat-value">{stats.total}</div>
        </div>
        <div className="admin-stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="admin-stat-label">Active</div>
          <div className="admin-stat-value" style={{ color: 'var(--primary)' }}>{stats.active}</div>
        </div>
        <div className="admin-stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="admin-stat-label">Inactive</div>
          <div className="admin-stat-value" style={{ color: '#ef4444' }}>{stats.inactive}</div>
        </div>
      </div>

      {message && <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 20 }}>{message}</div>}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <input className="form-input" style={{ flex: 1, minWidth: 220 }} placeholder="Search categories..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
        <select className="form-input" style={{ width: 180 }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
          <option value="ALL">All Status Levels</option>
          <option value="ACTIVE">Active Only</option>
          <option value="INACTIVE">Inactive Only</option>
        </select>
      </div>

      <div className="table-responsive">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Category Name</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && pagedItems.map((item) => (
              <tr key={item.id}>
                <td style={{ fontWeight: 600 }}>{item.name}</td>
                <td><AdminStatusBadge status={item.status} /></td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <Button variant="table" onClick={() => openEditModal(item)}>Edit</Button>
                    <Button variant="table" onClick={() => askToggleStatus(item)}>{item.status === 'ACTIVE' ? 'Suspend' : 'Activate'}</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      <AdminEntityModal
        isOpen={showModal}
        title={editingItem ? 'Edit Category' : 'Add Category'}
        form={form}
        fields={[{ name: 'categoryName', label: 'Category Name', placeholder: 'Enter category name' }]}
        errors={errors}
        loading={saving}
        onChange={(name, val) => setForm(p => ({ ...p, [name]: val }))}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
      <AdminConfirmModal confirm={confirm} loading={saving} onClose={() => setConfirm(null)} onConfirm={() => confirm?.onConfirm?.()} />
    </div>
  );
}
