import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import axiosInstance from '../../../../api/axiosInstance';
import { fetchMetadata } from '../../../../features/metadata/metadataSlice';
import Pagination from '../../../../components/Pagination';
import Button from '../../../../components/Button';
import AdminToolbar from '../../../../components/admin/AdminToolbar';
import AdminEntityModal from '../../../../components/admin/AdminEntityModal';
import AdminStatusBadge from '../../../../components/admin/AdminStatusBadge';

const PAGE_SIZE = 5;
const EMPTY_FORM = { name: '', address: '', city: '', state: '', capacity: '' };

export default function AdminVenues() {
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

  async function loadVenues() {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/venues');
      setItems(res.data || []);
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Failed to load venues.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVenues();
  }, []);

  const filteredItems = useMemo(() => {
    const result = items.filter((item) => {
      const text = `${item.name || ''} ${item.city || ''} ${item.state || ''}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });

    result.sort((a, b) => {
      if (sort === 'name-asc') return a.name.localeCompare(b.name);
      if (sort === 'name-desc') return b.name.localeCompare(a.name);
      if (sort === 'city') return a.city.localeCompare(b.city);
      if (sort === 'capacity') return Number(b.capacity) - Number(a.capacity);
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
    setForm({
      name: item.name || '',
      address: item.address || '',
      city: item.city || '',
      state: item.state || '',
      capacity: item.capacity || '',
    });
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

    if (!form.name.trim()) nextErrors.name = 'Venue name is required.';
    if (!form.address.trim()) nextErrors.address = 'Address is required.';
    if (!form.city.trim()) nextErrors.city = 'City is required.';
    if (!form.state.trim()) nextErrors.state = 'State is required.';
    if (!String(form.capacity).trim()) nextErrors.capacity = 'Capacity is required.';
    if (Number(form.capacity) < 1) nextErrors.capacity = 'Capacity must be at least 1.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm()) return;

    const payload = {
      name: form.name.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      capacity: Number(form.capacity),
    };

    try {
      setSaving(true);
      if (editingItem) {
        await axiosInstance.put(`/venues/${editingItem.id}`, payload);
        setMessageType('success');
        setMessage('Venue updated successfully.');
      } else {
        await axiosInstance.post('/venues', payload);
        setMessageType('success');
        setMessage('Venue created successfully.');
      }
      closeModal();
      await loadVenues();
      dispatch(fetchMetadata());
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Unable to save venue.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(item) {
    try {
      const nextStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await axiosInstance.patch(`/venues/${item.id}/status`, { status: nextStatus });
      setMessageType('success');
      setMessage(`Venue marked as ${nextStatus.toLowerCase()}.`);
      await loadVenues();
      dispatch(fetchMetadata());
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Unable to update venue status.');
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <AdminToolbar
        title="Venues"
        description="Manage venue details, status, search, sorting, and pagination."
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
          { value: 'city', label: 'City' },
          { value: 'capacity', label: 'Highest Capacity' },
          { value: 'latest', label: 'Latest' },
        ]}
        actionLabel="Add Venue"
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
              <th>City</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && pagedItems.map((item, index) => (
              <tr key={item.id}>
                <td>{page * PAGE_SIZE + index + 1}</td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--neutral-400)', marginTop: 4 }}>{item.address}</div>
                </td>
                <td>{item.city}, {item.state}</td>
                <td>{item.capacity}</td>
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
                <td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--neutral-400)' }}>
                  No venues found.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--neutral-400)' }}>
                  Loading venues...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      <AdminEntityModal
        isOpen={showModal}
        title={editingItem ? 'Edit Venue' : 'Add Venue'}
        form={form}
        fields={[
          { name: 'name', label: 'Venue Name', placeholder: 'Enter venue name' },
          { name: 'address', label: 'Address', placeholder: 'Enter full address', type: 'textarea' },
          { name: 'city', label: 'City', placeholder: 'Enter city' },
          { name: 'state', label: 'State', placeholder: 'Enter state' },
          { name: 'capacity', label: 'Capacity', placeholder: 'Enter capacity', type: 'number' },
        ]}
        errors={errors}
        loading={saving}
        onChange={handleFormChange}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
