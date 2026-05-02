import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Pagination from '../../../components/ui/Pagination';
import { formatDateTime, formatMoney } from '../../../utils/formatters';
import AdminConfirmModal from '../components/AdminConfirmModal';
import { exportCsv } from '../utils/adminUtils';
import {
  fetchAdminOfferEvents,
  fetchAdminOffers,
  saveAdminOffer,
  updateAdminOfferStatus
} from '../slices/adminSlice';

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
  const dispatch = useDispatch();
  const { offerEvents: events, offers, loading, saving } = useSelector((s) => s.admin);
  const [eventId, setEventId] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirm, setConfirm] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  useEffect(() => {
    dispatch(fetchAdminOfferEvents()).unwrap().then((list) => {
      if (list[0]) setEventId(String(list[0].id));
    });
  }, [dispatch]);

  useEffect(() => {
    if (!eventId) return;
    dispatch(fetchAdminOffers(eventId));
  }, [dispatch, eventId]);

  const offerStats = useMemo(() => {
    const active = offers.filter(o => getOfferStatus(o) === 'ACTIVE').length;
    const expired = offers.filter(o => getOfferStatus(o) === 'INACTIVE').length;
    return { total: offers.length, active, expired };
  }, [offers]);

  const filteredOffers = useMemo(() => offers.filter((item) => item.code?.toLowerCase().includes(search.toLowerCase())), [offers, search]);
  const totalPages = Math.ceil(filteredOffers.length / pageSize);
  const pagedOffers = filteredOffers.slice(page * pageSize, (page + 1) * pageSize);

  const selectedEventName = useMemo(() => {
    const ev = events.find(e => String(e.id) === String(eventId));
    return ev?.title || '';
  }, [events, eventId]);

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
      const msg = await dispatch(saveAdminOffer({ eventId, editingItem, form })).unwrap();
      setMessageType('success');
      setMessage(msg);
      setShowModal(false);
      await dispatch(fetchAdminOffers(eventId)).unwrap();
    } catch (err) {
      setMessageType('error');
      setMessage(err || 'Unable to save offer.');
    }
  }

  async function updateStatus(item, status) {
    try {
      const msg = await dispatch(updateAdminOfferStatus({ item, status })).unwrap();
      setMessageType('success');
      setMessage(msg);
      setConfirm(null);
      await dispatch(fetchAdminOffers(eventId)).unwrap();
    } catch (err) {
      setMessageType('error');
      setMessage(err || 'Unable to update offer status.');
    }
  }

  function askStatus(item, status) {
    setConfirm({
      title: 'Confirm Action',
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <h2 className="view-title">Offers & Discount Codes</h2>
          <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>Create and manage discount codes per event.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={exportOffers}>Export Data</Button>
          <Button onClick={openCreate} disabled={!eventId}>Add Offer</Button>
        </div>
      </div>

      {message && <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>{message}</div>}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <select className="form-input" style={{ flex: 1, minWidth: 220 }} value={eventId} onChange={(e) => { setEventId(e.target.value); setPage(0); }}>
          {events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
        </select>
        <input className="form-input" style={{ flex: 1, minWidth: 180 }} placeholder="Search offer code..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
        <select className="form-input" style={{ width: 130 }} value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}>
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

      {eventId && offers.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, fontSize: 13, color: 'var(--neutral-500)' }}>
          <span style={{ fontWeight: 600 }}>{selectedEventName}:</span>
          <span>{offerStats.total} offers total</span>
          <span>·</span>
          <span style={{ color: 'var(--primary)' }}>{offerStats.active} active</span>
          <span>·</span>
          <span style={{ color: 'var(--neutral-400)' }}>{offerStats.expired} expired</span>
        </div>
      )}

      <div className="table-responsive">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Code</th>
              <th>Discount</th>
              <th>Valid Until</th>
              <th>Usage Limit</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && pagedOffers.map((item, index) => (
              <tr key={item.id}>
                <td>{page * pageSize + index + 1}</td>
                <td style={{ fontWeight: 700 }}>{item.code}</td>
                <td>
                  {item.discountPercentage}%
                  {item.maxDiscountAmount ? <span style={{ color: 'var(--neutral-400)', fontSize: 12 }}> (up to {formatMoney(item.maxDiscountAmount)})</span> : ''}
                </td>
                <td>{formatDateTime(item.validTo)}</td>
                <td>{item.totalUsageLimit ? item.totalUsageLimit : <span style={{ color: 'var(--neutral-400)' }}>Unlimited</span>}</td>
                <td><span className={`badge badge-${getOfferStatus(item).toLowerCase()}`}>{getOfferStatus(item)}</span></td>
                <td>
                  <div className="row-actions">
                    <Button variant="table" onClick={() => openEdit(item)}>Edit</Button>
                    <Button variant="table" onClick={() => askStatus(item, getOfferStatus(item) === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}>
                      {getOfferStatus(item) === 'ACTIVE' ? 'Suspend' : 'Activate'}
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
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
            <Button onClick={saveOffer} loading={saving}>Save</Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>Offer Code *</label>
            <input className="form-input" placeholder="e.g. SUMMER20" value={form.code} disabled={!!editingItem} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>Discount % *</label>
              <input className="form-input" type="number" placeholder="e.g. 20" value={form.discountPercentage} disabled={!!editingItem} onChange={(e) => setForm((p) => ({ ...p, discountPercentage: e.target.value }))} />
            </div>
            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>Max Discount Amount</label>
              <input className="form-input" type="number" placeholder="Leave blank for no cap" value={form.maxDiscountAmount} disabled={!!editingItem} onChange={(e) => setForm((p) => ({ ...p, maxDiscountAmount: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>Valid From *</label>
              <input className="form-input" type="datetime-local" value={form.validFrom} onChange={(e) => setForm((p) => ({ ...p, validFrom: e.target.value }))} />
            </div>
            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>Valid To *</label>
              <input className="form-input" type="datetime-local" value={form.validTo} onChange={(e) => setForm((p) => ({ ...p, validTo: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>Total Usage Limit</label>
            <input className="form-input" type="number" placeholder="Leave blank for unlimited" value={form.totalUsageLimit} onChange={(e) => setForm((p) => ({ ...p, totalUsageLimit: e.target.value }))} />
          </div>
        </div>
      </Modal>
      <AdminConfirmModal confirm={confirm} loading={saving} onClose={() => setConfirm(null)} onConfirm={() => confirm?.onConfirm?.()} />
    </div>
  );
}
