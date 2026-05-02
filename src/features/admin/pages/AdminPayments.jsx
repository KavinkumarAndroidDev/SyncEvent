import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Pagination from '../../../components/ui/Pagination';
import { formatDateTime, formatMoney } from '../../../utils/formatters';
import { fetchAdminPayments } from '../slices/adminSlice';

export default function AdminPayments() {
  const dispatch = useDispatch();
  const { payments, loading } = useSelector((s) => s.admin);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    dispatch(fetchAdminPayments());
  }, [dispatch]);

  const stats = useMemo(() => {
    const successful = payments.filter(p => p.status === 'SUCCESS');
    const failed = payments.filter(p => p.status === 'FAILED');
    const pending = payments.filter(p => p.status === 'PENDING');
    const totalRevenue = successful.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return {
      totalRevenue,
      successCount: successful.length,
      failedCount: failed.length,
      pendingCount: pending.length,
    };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const refId = `REF-${payment.id}`.toLowerCase();
      const bookingId = `BOOK-${payment.registrationId || ''}`.toLowerCase();
      const searchTerm = search.toLowerCase();
      const matchesSearch = refId.includes(searchTerm) || bookingId.includes(searchTerm) || (payment.razorpayPaymentId || '').toLowerCase().includes(searchTerm);
      const matchesStatus = statusFilter === 'ALL' || payment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [payments, search, statusFilter]);

  const totalPages = Math.ceil(filteredPayments.length / pageSize);
  const pagedPayments = filteredPayments.slice(page * pageSize, (page + 1) * pageSize);

  function exportPayments() {
    const rows = [
      ['ID', 'Booking', 'Created', 'Amount', 'Status', 'Gateway Payment ID'],
      ...filteredPayments.map((p) => [p.id, p.registrationId, p.createdAt, p.amount, p.status, p.razorpayPaymentId || '']),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'payments.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ padding: 40 }}>
      <div className="view-header">
        <h2 className="view-title">Transactions & Revenue</h2>
        <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>Monitor all payment records across the platform.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div style={{ background: 'var(--white)', padding: '20px', borderRadius: '12px', border: '1px solid var(--neutral-100)' }}>
          <div style={{ fontSize: 13, color: 'var(--neutral-400)', marginBottom: 4 }}>Total Revenue</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary)' }}>{formatMoney(stats.totalRevenue)}</div>
          <div style={{ fontSize: 12, color: 'var(--neutral-400)', marginTop: 4 }}>from successful payments</div>
        </div>
        <div
          style={{ background: 'var(--white)', padding: '20px', borderRadius: '12px', border: '1px solid var(--neutral-100)', cursor: 'pointer' }}
          onClick={() => { setStatusFilter('SUCCESS'); setPage(0); }}
        >
          <div style={{ fontSize: 13, color: 'var(--neutral-400)', marginBottom: 4 }}>Successful</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#16a34a' }}>{stats.successCount}</div>
        </div>
        <div
          style={{ background: 'var(--white)', padding: '20px', borderRadius: '12px', border: '1px solid var(--neutral-100)', cursor: 'pointer' }}
          onClick={() => { setStatusFilter('PENDING'); setPage(0); }}
        >
          <div style={{ fontSize: 13, color: 'var(--neutral-400)', marginBottom: 4 }}>Pending</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#eab308' }}>{stats.pendingCount}</div>
        </div>
        <div
          style={{ background: 'var(--white)', padding: '20px', borderRadius: '12px', border: '1px solid var(--neutral-100)', cursor: 'pointer' }}
          onClick={() => { setStatusFilter('FAILED'); setPage(0); }}
        >
          <div style={{ fontSize: 13, color: 'var(--neutral-400)', marginBottom: 4 }}>Failed</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#ef4444' }}>{stats.failedCount}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <input
          className="form-input"
          style={{ flex: 1, minWidth: 220 }}
          placeholder="Search by payment, booking or gateway ID..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
        />
        <select className="form-input" style={{ width: 180 }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
          <option value="ALL">All Status</option>
          <option value="SUCCESS">Success</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>
        <select className="form-input" style={{ width: 150 }} value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}>
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
        <Button variant="secondary" onClick={exportPayments}>Export Data</Button>
      </div>

      {statusFilter !== 'ALL' && (
        <div style={{ fontSize: 13, color: 'var(--neutral-400)', marginBottom: 12 }}>
          Showing {filteredPayments.length} {statusFilter.toLowerCase()} payments ·{' '}
          <button
            onClick={() => { setStatusFilter('ALL'); setPage(0); }}
            style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
          >
            Show all
          </button>
        </div>
      )}

      <div className="table-responsive">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Reference</th>
              <th>Booking</th>
              <th>Created</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && pagedPayments.map((payment, index) => (
              <tr key={payment.id}>
                <td>{page * pageSize + index + 1}</td>
                <td>REF-{payment.id}</td>
                <td>#{payment.registrationId || '-'}</td>
                <td>{formatDateTime(payment.createdAt)}</td>
                <td style={{ fontWeight: 700 }}>{formatMoney(payment.amount)}</td>
                <td><span className={`badge badge-${String(payment.status || '').toLowerCase()}`}>{payment.status}</span></td>
                <td><Button variant="table" onClick={() => setSelectedInvoice(payment)}>Review</Button></td>
              </tr>
            ))}
            {!loading && pagedPayments.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--neutral-400)' }}>
                  No payments found.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--neutral-400)' }}>
                  Loading payments...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          title="Payment Record"
          onClose={() => setSelectedInvoice(null)}
          actions={<Button variant="table" onClick={() => setSelectedInvoice(null)}>Close</Button>}
        >
          <div className="invoice-receipt">
            <div className="receipt-row"><span className="label">Reference</span><span className="value">REF-{selectedInvoice.id}</span></div>
            <div className="receipt-row"><span className="label">Booking</span><span className="value">#{selectedInvoice.registrationId}</span></div>
            <div className="receipt-row"><span className="label">Created</span><span className="value">{formatDateTime(selectedInvoice.createdAt)}</span></div>
            <div className="receipt-row"><span className="label">Paid At</span><span className="value">{formatDateTime(selectedInvoice.paidAt)}</span></div>
            <div className="receipt-row"><span className="label">Gateway</span><span className="value">{selectedInvoice.gateway || 'Razorpay'}</span></div>
            <div className="receipt-row"><span className="label">Order ID</span><span className="value">{selectedInvoice.razorpayOrderId || '-'}</span></div>
            <div className="receipt-row"><span className="label">Payment ID</span><span className="value">{selectedInvoice.razorpayPaymentId || '-'}</span></div>
            <div className="receipt-row"><span className="label">Status</span><span className="value"><span className={`badge badge-${String(selectedInvoice.status || '').toLowerCase()}`}>{selectedInvoice.status}</span></span></div>
            <div className="receipt-total">
              <span className="total-label">Amount</span>
              <span className="total-value">{formatMoney(selectedInvoice.amount)}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
