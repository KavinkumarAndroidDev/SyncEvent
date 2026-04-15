import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import axiosInstance from '../../../../api/axiosInstance';
import { fetchMetadata } from '../../../../features/metadata/metadataSlice';
import Pagination from '../../../../components/Pagination';
import Button from '../../../../components/Button';
import AdminToolbar from '../../../../components/admin/AdminToolbar';
import AdminEntityModal from '../../../../components/admin/AdminEntityModal';
import AdminStatusBadge from '../../../../components/admin/AdminStatusBadge';

const PAGE_SIZE = 6;
const EMPTY_FORM = { categoryName: '' };

export default function AdminCategories() {
  const dispatch = useDispatch();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name-asc');
  const [page, setPage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  async function loadCategories() {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/categories');
      setItems(res.data || []);
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredItems = useMemo(() => {
    const result = items.filter((item) => item.name?.toLowerCase().includes(search.toLowerCase()));

    result.sort((a, b) => {
      if (sort === 'name-asc') return a.name.localeCompare(b.name);
      if (sort === 'name-desc') return b.name.localeCompare(a.name);
      if (sort === 'status') return a.status.localeCompare(b.status);
      return Number(b.id) - Number(a.id);
    });

    return result;
  }, [items, search, sort]);

  const totalPages = Math.ceil(filteredItems.length / PAGE_SIZE);
  const pagedItems = filteredItems.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

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
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowModal(false);
  }

  function handleFormChange(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function validateForm() {
    const nextErrors = {};
    if (!form.categoryName.trim()) {
      nextErrors.categoryName = 'Category name is required.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm()) return;

    try {
      setSaving(true);
      if (editingItem) {
        await axiosInstance.put(`/categories/${editingItem.id}`, { categoryName: form.categoryName.trim() });
        setMessageType('success');
        setMessage('Category updated successfully.');
      } else {
        await axiosInstance.post('/categories', { categoryName: form.categoryName.trim() });
        setMessageType('success');
        setMessage('Category created successfully.');
      }
      closeModal();
      await loadCategories();
      dispatch(fetchMetadata());
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Unable to save category.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(item) {
    try {
      const nextStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await axiosInstance.patch(`/categories/${item.id}/status`, { status: nextStatus });
      setMessageType('success');
      setMessage(`Category marked as ${nextStatus.toLowerCase()}.`);
      await loadCategories();
      dispatch(fetchMetadata());
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Unable to update category status.');
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <AdminToolbar
        title="Categories"
        description="Create, edit, search, sort, and manage category status."
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(0);
        }}
        sort={sort}
        onSortChange={(value) => {
          setSort(value);
          setPage(0);
        }}
        sortOptions={[
          { value: 'name-asc', label: 'Name A-Z' },
          { value: 'name-desc', label: 'Name Z-A' },
          { value: 'status', label: 'Status' },
          { value: 'latest', label: 'Latest' },
        ]}
        actionLabel="Add Category"
        onAction={openCreateModal}
      />

      {message && (
        <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 20 }}>
          {message}
        </div>
      )}

      <div className="table-responsive">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && pagedItems.map((item, index) => (
              <tr key={item.id}>
                <td>{page * PAGE_SIZE + index + 1}</td>
                <td style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{item.name}</td>
                <td><AdminStatusBadge status={item.status} /></td>
                <td>
                  <div className="row-actions">
                    <Button variant="table" onClick={() => openEditModal(item)}>Edit</Button>
                    <Button variant="table" onClick={() => toggleStatus(item)}>
                      {item.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && pagedItems.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: 40, color: 'var(--neutral-400)' }}>
                  No categories found.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: 40, color: 'var(--neutral-400)' }}>
                  Loading categories...
                </td>
              </tr>
            )}
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
        onChange={handleFormChange}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
