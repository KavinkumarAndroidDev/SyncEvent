import { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../lib/axios';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Pagination from '../../../components/ui/Pagination';
import { formatDateTime, formatMoney } from '../../../utils/formatters';
import AdminConfirmModal from '../components/AdminConfirmModal';
import { exportCsv } from '../utils/adminUtils';

const EMPTY_FORM = { code: '', discountPercentage: '', maxDiscountAmount: '', validFrom: '', validTo: '', totalUsageLimit: '' };

function toLocalInput(value) {
  if (!value) return '';
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function getOfferStatus(item) {
  if (!item?.validTo) return 'ACTIVE';
  return new Date(item.validTo) < new Date() ? 'INACTIVE' : 'ACTIVE';
}

export default function AdminOffers() {
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState('');
  const [offers, setOffers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirm, setConfirm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  useEffect(() => {
    axiosInstance.get('/events?size=200')
      .then((res) => {
        const now = new Date();
        const list = (res.data.content || []).filter(e => new Date(e.endTime || e.startTime) > now);
        setEvents(list);
        if (list[0]) setEventId(String(list[0].id));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    axiosInstance.get(`/events/${eventId}/offers`)
      .then((res) => setOffers(res.data || []))
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  }, [eventId]);

  const filteredOffers = useMemo(() => offers.filter((item) => item.code?.toLowerCase().includes(search.toLowerCase())), [offers, search]);
  const totalPages = Math.ceil(filteredOffers.length / pageSize);
  const pagedOffers = filteredOffers.slice(page * pageSize, (page + 1) * pageSize);

  function openCreate() {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(item) {
    setEditingItem(item);
    setForm({
      code: item.code || '',
      discountPercentage: item.discountPercentage || '',
      maxDiscountAmount: item.maxDiscountAmount || '',
      validFrom: toLocalInput(item.validFrom),
      validTo: toLocalInput(item.validTo),
      totalUsageLimit: item.totalUsageLimit || '',
    });
    setShowModal(true);
  }

  async function saveOffer() {
    if ((!editingItem && (!form.code.trim() || !form.discountPercentage)) || !form.validFrom || !form.validTo) return;
    try {
      setSaving(true);
      if (editingItem) {
        await axiosInstance.put(`/offers/${editingItem.id}`, {
          validFrom: form.validFrom,
          validTo: form.validTo,
          totalUsageLimit: form.totalUsageLimit ? Number(form.totalUsageLimit) : null,
        });
        setMessageType('success');
        setMessage('Offer updated successfully.');
      } else {
        await axiosInstance.post(`/events/${eventId}/offers`, {
          code: form.code.trim(),
          discountPercentage: Number(form.discountPercentage),
          maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
          validFrom: form.validFrom,
          validTo: form.validTo,
          totalUsageLimit: form.totalUsageLimit ? Number(form.totalUsageLimit) : null,
        });
        setMessageType('success');
        setMessage('Offer created successfully.');
      }
      setShowModal(false);
      const res = await axiosInstance.get(`/events/${eventId}/offers`);
      setOffers(res.data || []);
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Unable to save offer.');
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(item, status) {
    try {
      setSaving(true);
      await axiosInstance.patch(`/offers/${item.id}/status`, { status });
      setMessageType('success');
      setMessage(`Offer marked as ${status}.`);
      setConfirm(null);
      const res = await axiosInstance.get(`/events/${eventId}/offers`);
      setOffers(res.data || []);
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Unable to update offer status.');
    } finally {
      setSaving(false);
    }
  }

  function askStatus(item, status) {
    setConfirm({
      title: 'Update Offer',
      message: `Are you sure you want to mark ${item.code} as ${status}?`,
      onConfirm: () => updateStatus(item, status),
    });
  }

  function exportOffers() {
    exportCsv('offers.csv', ['ID', 'Event ID', 'Code', 'Discount', 'Max Discount', 'Valid From', 'Valid To', 'Usage Limit', 'Status'], filteredOffers.map((item) => [
      item.id,
      item.eventId,
      item.code,
      item.discountPercentage,
      item.maxDiscountAmount,
      item.validFrom,
      item.validTo,
      item.totalUsageLimit,
      getOfferStatus(item),
    ]));
  }

  return (
    <div style={{ padding: 40 }}>
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <h2 className="view-title">Offers</h2>
          <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>Create and manage discount codes event wise.</p>
        </div>
        <Button onClick={openCreate} disabled={!eventId}>Add Offer</Button>
      </div>

      {message && <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>{message}</div>}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <select className="form-input" style={{ flex: 1, minWidth: 220 }} value={eventId} onChange={(e) => { setEventId(e.target.value); setPage(0); }}>
          {events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
        </select>
        <input className="form-input" style={{ flex: 1, minWidth: 220 }} placeholder="Search offer code..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
        <select className="form-input" style={{ width: 150 }} value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}>
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
        <Button variant="secondary" onClick={exportOffers}>Export</Button>
      </div>

      <div className="table-responsive">
        <table className="dashboard-table">
          <thead><tr><th>#</th><th>Code</th><th>Discount</th><th>Valid</th><th>Usage Limit</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {!loading && pagedOffers.map((item, index) => (
              <tr key={item.id}>
                <td>{page * pageSize + index + 1}</td>
                <td style={{ fontWeight: 700 }}>{item.code}</td>
                <td>{item.discountPercentage}% up to {formatMoney(item.maxDiscountAmount)}</td>
                <td>{formatDateTime(item.validFrom)} to {formatDateTime(item.validTo)}</td>
                <td>{item.totalUsageLimit || '-'}</td>
                <td><span className={`badge badge-${getOfferStatus(item).toLowerCase()}`}>{getOfferStatus(item)}</span></td>
                <td>
                  <div className="row-actions">
                    <Button variant="table" onClick={() => openEdit(item)}>Edit</Button>
                    <Button variant="table" onClick={() => askStatus(item, getOfferStatus(item) === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}>
                      {getOfferStatus(item) === 'ACTIVE' ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && pagedOffers.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--neutral-400)' }}>No offers found.</td></tr>}
            {loading && <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--neutral-400)' }}>Loading offers...</td></tr>}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal
        isOpen={showModal}
        title={editingItem ? 'Edit Offer' : 'Add Offer'}
        onClose={() => setShowModal(false)}
        actions={<><Button variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button><Button onClick={saveOffer} loading={saving}>Save</Button></>}
      >
        <div style={{ display: 'grid', gap: 14 }}>
          <input className="form-input" placeholder="Offer code *" value={form.code} disabled={!!editingItem} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} />
          <input className="form-input" type="number" placeholder="Discount percentage *" value={form.discountPercentage} disabled={!!editingItem} onChange={(e) => setForm((p) => ({ ...p, discountPercentage: e.target.value }))} />
          <input className="form-input" type="number" placeholder="Max discount amount" value={form.maxDiscountAmount} disabled={!!editingItem} onChange={(e) => setForm((p) => ({ ...p, maxDiscountAmount: e.target.value }))} />
          <input className="form-input" type="datetime-local" value={form.validFrom} onChange={(e) => setForm((p) => ({ ...p, validFrom: e.target.value }))} />
          <input className="form-input" type="datetime-local" value={form.validTo} onChange={(e) => setForm((p) => ({ ...p, validTo: e.target.value }))} />
          <input className="form-input" type="number" placeholder="Usage limit" value={form.totalUsageLimit} onChange={(e) => setForm((p) => ({ ...p, totalUsageLimit: e.target.value }))} />
        </div>
      </Modal>
      <AdminConfirmModal confirm={confirm} loading={saving} onClose={() => setConfirm(null)} onConfirm={() => confirm?.onConfirm?.()} />
    </div>
  );
}
