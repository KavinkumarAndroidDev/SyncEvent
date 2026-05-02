import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMetadata } from '../../metadata/slices/metadataSlice';
import Pagination from '../../../components/ui/Pagination';
import Button from '../../../components/ui/Button';
import AdminToolbar from '../components/AdminToolbar';
import AdminEntityModal from '../components/AdminEntityModal';
import AdminStatusBadge from '../components/AdminStatusBadge';
import AdminConfirmModal from '../components/AdminConfirmModal';
import { exportCsv } from '../utils/adminUtils';
import { fetchAdminVenues, saveAdminVenue, updateAdminVenueStatus } from '../slices/adminSlice';

const EMPTY_FORM = { name: '', address: '', city: '', state: '', capacity: '' };

export default function AdminVenues() {
  const dispatch = useDispatch();
  const { venues: items, loading, saving } = useSelector((s) => s.admin);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name-asc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [confirm, setConfirm] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  useEffect(() => {
    dispatch(fetchAdminVenues()).unwrap().catch((err) => {
      setMessageType('error');
      setMessage(err || 'Failed to load venues.');
    });
  }, [dispatch]);

  const stats = useMemo(() => {
    const active = items.filter(i => i.status === 'ACTIVE').length;
    const totalCapacity = items.filter(i => i.status === 'ACTIVE').reduce((sum, i) => sum + (Number(i.capacity) || 0), 0);
    const cities = new Set(items.map(i => i.city).filter(Boolean)).size;
    return { total: items.length, active, totalCapacity, cities };
  }, [items]);

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

  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const pagedItems = filteredItems.slice(page * pageSize, (page + 1) * pageSize);

  function exportVenues() {
    exportCsv('venues.csv', ['ID', 'Name', 'Address', 'City', 'State', 'Capacity', 'Status'], filteredItems.map((item) => [
      item.id,
      item.name,
      item.address,
      item.city,
      item.state,
      item.capacity,
      item.status,
    ]));
  }

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
      const msg = await dispatch(saveAdminVenue({ editingItem, payload })).unwrap();
      setMessageType('success');
      setMessage(msg);
      closeModal();
      await dispatch(fetchAdminVenues()).unwrap();
      dispatch(fetchMetadata());
      setConfirm(null);
    } catch (err) {
      setMessageType('error');
      setMessage(err || 'Unable to save venue.');
    }
  }

  async function toggleStatus(item) {
    try {
      const msg = await dispatch(updateAdminVenueStatus(item)).unwrap();
      setMessageType('success');
      setMessage(msg);
      await dispatch(fetchAdminVenues()).unwrap();
      dispatch(fetchMetadata());
    } catch (err) {
      setMessageType('error');
      setMessage(err || 'Unable to update venue status.');
    }
  }

  function askToggleStatus(item) {
    const nextStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setConfirm({
      title: 'Confirm Action',
      message: `Are you sure you want to mark ${item.name} as ${nextStatus}?`,
      onConfirm: () => toggleStatus(item),
    });
  }

  return (
    <div style={{ padding: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <h2 className="view-title">Venues</h2>
          <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>
            {stats.total} venues across {stats.cities} {stats.cities === 1 ? 'city' : 'cities'} · {stats.active} active · {stats.totalCapacity.toLocaleString()} total capacity
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={exportVenues}>Export Data</Button>
          <Button onClick={openCreateModal}>Add Venue</Button>
        </div>
      </div>

      {message && (
        <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 20 }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <input
          className="form-input"
          style={{ flex: 1, minWidth: 220 }}
          placeholder="Search name, city or state..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        />
        <select className="form-input" style={{ width: 180 }} value={sort} onChange={(e) => { setSort(e.target.value); setPage(0); }}>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="city">City</option>
          <option value="capacity">Highest Capacity</option>
          <option value="latest">Latest</option>
        </select>
        <select className="form-input" style={{ width: 130 }} value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}>
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

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
                <td>{page * pageSize + index + 1}</td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--neutral-400)', marginTop: 4 }}>{item.address}</div>
                </td>
                <td>{item.city}, {item.state}</td>
                <td>{Number(item.capacity || 0).toLocaleString()}</td>
                <td><AdminStatusBadge status={item.status} /></td>
                <td>
                  <div className="row-actions">
                    <Button variant="table" onClick={() => openEditModal(item)}>Edit</Button>
                    <Button variant="table" onClick={() => askToggleStatus(item)}>
                      {item.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
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
      <AdminConfirmModal
        confirm={confirm}
        loading={saving}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.onConfirm?.()}
      />
    </div>
  );
}
