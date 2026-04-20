import { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../../api/axiosInstance';
import Modal from '../../../../components/Modal';
import Button from '../../../../components/Button';
import Pagination from '../../../../components/Pagination';

const PAGE_SIZE = 10;

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);

  useEffect(() => {
    async function loadPayments() {
      try {
        const res = await axiosInstance.get('/payments?size=200');
        setPayments(res.data.content || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadPayments();
  }, []);

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

  const totalPages = Math.ceil(filteredPayments.length / PAGE_SIZE);
  const pagedPayments = filteredPayments.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div style={{ padding: 40 }}>
      <div className="view-header">
        <h2 className="view-title">Payments & Revenue</h2>
        <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>Monitor all payment records across the platform.</p>
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
      </div>

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
                <td>{page * PAGE_SIZE + index + 1}</td>
                <td>REF-{payment.id}</td>
                <td>#{payment.registrationId || '-'}</td>
                <td>{payment.createdAt ? new Date(payment.createdAt).toLocaleString() : '-'}</td>
                <td style={{ fontWeight: 700 }}>Rs. {Number(payment.amount || 0).toLocaleString()}</td>
                <td><span className={`badge badge-${String(payment.status || '').toLowerCase()}`}>{payment.status}</span></td>
                <td><Button variant="table" onClick={() => setSelectedInvoice(payment)}>View</Button></td>
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
            <div className="receipt-row"><span className="label">Created</span><span className="value">{selectedInvoice.createdAt ? new Date(selectedInvoice.createdAt).toLocaleString() : '-'}</span></div>
            <div className="receipt-row"><span className="label">Paid At</span><span className="value">{selectedInvoice.paidAt ? new Date(selectedInvoice.paidAt).toLocaleString() : '-'}</span></div>
            <div className="receipt-row"><span className="label">Gateway</span><span className="value">{selectedInvoice.gateway || 'Razorpay'}</span></div>
            <div className="receipt-row"><span className="label">Order ID</span><span className="value">{selectedInvoice.razorpayOrderId || '-'}</span></div>
            <div className="receipt-row"><span className="label">Payment ID</span><span className="value">{selectedInvoice.razorpayPaymentId || '-'}</span></div>
            <div className="receipt-total">
              <span className="total-label">Amount</span>
              <span className="total-value">Rs. {Number(selectedInvoice.amount || 0).toLocaleString()}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
