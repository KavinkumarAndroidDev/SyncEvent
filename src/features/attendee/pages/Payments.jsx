import { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../lib/axios';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { formatDate, formatDateTime, formatMoney } from '../../../utils/formatters';
import { openPdfDocument } from '../../../utils/documentPrint';
import Spinner from '../../../components/common/Spinner';

const PAGE_SIZE = 10;

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(0);

  const fetchPayments = async () => {
    try {
      const res = await axiosInstance.get('/payments/my-payments?size=200');
      setPayments(res.data.content || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = useMemo(() => {
    const result = payments.filter((payment) => {
      const refId = `REF-${payment.id}`.toLowerCase();
      const gatewayId = payment.razorpayPaymentId?.toLowerCase() || '';
      const searchTerm = search.toLowerCase();
      const matchesSearch = refId.includes(searchTerm) || gatewayId.includes(searchTerm);
      const matchesStatus = statusFilter === 'ALL' || payment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    if (sortBy === 'newest') result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sortBy === 'oldest') result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sortBy === 'amount-high') result.sort((a, b) => Number(b.amount) - Number(a.amount));
    if (sortBy === 'amount-low') result.sort((a, b) => Number(a.amount) - Number(b.amount));

    return result;
  }, [payments, search, statusFilter, sortBy]);

  const totalPages = Math.ceil(filteredPayments.length / PAGE_SIZE);
  const pagedPayments = filteredPayments.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const printInvoice = () => {
    if (!selectedInvoice) return;
    const statusLine = selectedInvoice.status === 'SUCCESS'
      ? 'This payment was completed successfully.'
      : selectedInvoice.status === 'FAILED'
        ? 'This payment failed. If money was deducted, the bank or gateway will reverse it as per policy.'
        : 'This transaction is pending confirmation.';

    openPdfDocument(`Invoice REF-${selectedInvoice.id}`, `
      <div class="header">
        <div>
          <h1 class="brand">SyncEvent Invoice</h1>
          <p class="muted">Transaction Reference REF-${selectedInvoice.id}</p>
        </div>
        <span class="badge">${selectedInvoice.status}</span>
      </div>
      <div style="display:flex;justify-content:space-between;gap:24px;align-items:flex-start;">
        <div style="flex:1;">
          <div class="grid">
            <div class="box"><div class="label">Booking</div><div class="value">#${selectedInvoice.registrationId}</div></div>
            <div class="box"><div class="label">Created</div><div class="value">${formatDateTime(selectedInvoice.createdAt)}</div></div>
            <div class="box"><div class="label">Paid At</div><div class="value">${formatDateTime(selectedInvoice.paidAt)}</div></div>
            <div class="box"><div class="label">Gateway</div><div class="value">${selectedInvoice.paymentMode || 'Razorpay'}</div></div>
          </div>
        </div>
      </div>
      <div class="row"><span>Event Registration Fee</span><strong>${formatMoney(selectedInvoice.amount)}</strong></div>
      <div class="total">Total: ${formatMoney(selectedInvoice.amount)}</div>
      <p class="note">${statusLine}</p>
    `);
  };

  if (loading) return <Spinner label="Loading payments..." />;

  return (
    <div className="view-container">
      <header className="view-header">
        <h2 className="view-title">Transaction History</h2>
        <p style={{ color: 'var(--neutral-400)', fontSize: 14 }}>Keep track of your event bookings and payments.</p>
      </header>

      <div className="dashboard-filter-bar" style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by reference or payment ID..."
          className="form-input"
          style={{ flex: 1, minWidth: 240 }}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
        />
        <select
          className="form-input"
          style={{ width: 150 }}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
        >
          <option value="ALL">All Status</option>
          <option value="SUCCESS">Success</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>
        <select
          className="form-input"
          style={{ width: 150 }}
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setPage(0);
          }}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="amount-high">Amount: High-Low</option>
          <option value="amount-low">Amount: Low-High</option>
        </select>
      </div>

      <div className="table-responsive">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedPayments.map((payment, index) => (
              <tr key={payment.id}>
                <td style={{ color: 'var(--neutral-400)', width: 40 }}>{page * PAGE_SIZE + index + 1}</td>
                <td>{formatDate(payment.createdAt)}</td>
                <td style={{ fontWeight: 700 }}>{formatMoney(payment.amount)}</td>
                <td>{payment.paymentMode || 'Razorpay'}</td>
                <td>
                  <span className={`badge badge-${payment.status?.toLowerCase()}`}>{payment.status}</span>
                </td>
                <td>
                  <Button variant="table" onClick={() => setSelectedInvoice(payment)}>View Invoice</Button>
                </td>
              </tr>
            ))}
            {pagedPayments.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: 48, color: 'var(--neutral-400)' }}>
                  {payments.length === 0 ? 'No transactions found.' : 'No transactions match your search criteria.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination" style={{ marginTop: 24 }}>
          <button className="page-btn" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>Prev</button>
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              className={`page-btn ${page === index ? 'page-btn-active' : ''}`}
              onClick={() => setPage(index)}
            >
              {index + 1}
            </button>
          ))}
          <button className="page-btn" disabled={page === totalPages - 1} onClick={() => setPage((value) => value + 1)}>Next</button>
        </div>
      )}

      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          title="Payment Invoice"
          onClose={() => setSelectedInvoice(null)}
          actions={
            <div style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setSelectedInvoice(null)}>Close</Button>
              <Button onClick={printInvoice}>Generate PDF</Button>
            </div>
          }
        >
          <div className="invoice-receipt">
            <div className="receipt-header">
              <div>
                <h4 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--neutral-900)' }}>SyncEvent</h4>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--neutral-400)' }}>Official Receipt</p>
              </div>
              <div className={`receipt-status-badge status-${selectedInvoice.status?.toLowerCase()}`}>
                {selectedInvoice.status}
              </div>
            </div>

            <div className="receipt-body">
              <div className="receipt-row">
                <span className="label">Reference ID</span>
                <span className="value">REF-{selectedInvoice.id}</span>
              </div>
              <div className="receipt-row">
                <span className="label">Payment Date</span>
                <span className="value">{formatDateTime(selectedInvoice.createdAt)}</span>
              </div>
              {selectedInvoice.razorpayPaymentId && (
                <div className="receipt-row">
                  <span className="label">Transaction ID</span>
                  <span className="value">{selectedInvoice.razorpayPaymentId}</span>
                </div>
              )}
              <div className="receipt-row">
                <span className="label">Method</span>
                <span className="value">{selectedInvoice.paymentMode || 'Razorpay Gateway'}</span>
              </div>

              <div className="receipt-divider"></div>

              <div className="receipt-item-row header">
                <span>Description</span>
                <span>Amount</span>
              </div>
              <div className="receipt-item-row">
                <span>Event Registration Fee (Booking #{selectedInvoice.registrationId})</span>
                <span style={{ fontWeight: 600 }}>{formatMoney(selectedInvoice.amount)}</span>
              </div>

              <div className="receipt-total">
                <span className="total-label">
                  {selectedInvoice.status === 'FAILED' ? 'Payable Amount' : 'Total Amount Paid'}
                </span>
                <span className="total-value">{formatMoney(selectedInvoice.amount)}</span>
              </div>

              {selectedInvoice.status === 'FAILED' && (
                <p style={{ marginTop: 16, fontSize: 12, color: '#dc2626', textAlign: 'right', fontWeight: 600 }}>
                  The transaction could not be processed. If funds were deducted, they will be reversed according to bank policy.
                </p>
              )}
            </div>

            <div className="receipt-footer">
              <p>Digital receipt generated by SyncEvent EMS Platform.</p>
              <div className="footer-ty">
                {selectedInvoice.status === 'FAILED' 
                  ? 'Your payment could not be processed. Please try again.' 
                  : 'We look forward to seeing you at the event!'}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
