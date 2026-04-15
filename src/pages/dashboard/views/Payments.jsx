import { useEffect, useState, useMemo } from 'react';
import axiosInstance from '../../../api/axiosInstance';
import Modal from '../../../components/Modal';
import Button from '../../../components/Button';

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
    let result = payments.filter(p => {
      const refId = `REF-${p.id}`.toLowerCase();
      const gatewayId = (p.razorpayPaymentId?.toLowerCase() || '');
      const searchTerm = search.toLowerCase();
      const matchesSearch = refId.includes(searchTerm) || gatewayId.includes(searchTerm);
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    if (sortBy === 'newest') result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sortBy === 'oldest') result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sortBy === 'amount-high') result.sort((a, b) => b.amount - a.amount);
    if (sortBy === 'amount-low') result.sort((a, b) => a.amount - b.amount);

    return result;
  }, [payments, search, statusFilter, sortBy]);

  const totalPages = Math.ceil(filteredPayments.length / PAGE_SIZE);
  const pagedPayments = filteredPayments.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (loading) return <div className="p-4">Loading payments...</div>;

  return (
    <div className="view-container">
      <header className="view-header">
        <h2 className="view-title">Transaction History</h2>
        <p style={{ color: 'var(--neutral-400)', fontSize: '14px' }}>Keep track of your event bookings and payments.</p>
      </header>

      {/* Filter Bar */}
      <div className="dashboard-filter-bar" style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by Reference or Payment ID..."
          className="form-input"
          style={{ flex: 1, minWidth: '240px' }}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        />
        <select
          className="form-input"
          style={{ width: '150px' }}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
        >
          <option value="ALL">All Status</option>
          <option value="COMPLETED">Completed</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>
        <select
          className="form-input"
          style={{ width: '150px' }}
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value); setPage(0); }}
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
              {pagedPayments.map((p, idx) => (
              <tr key={p.id}>
                <td style={{ color: 'var(--neutral-400)', width: 40 }}>{page * PAGE_SIZE + idx + 1}</td>
                <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                <td style={{ fontWeight: 700 }}>₹{p.amount}</td>
                <td>{p.paymentMode || 'Razorpay'}</td>
                <td>
                  <span className={`badge badge-${p.status?.toLowerCase()}`}>{p.status}</span>
                </td>
                <td>
                  <Button variant="table" onClick={() => setSelectedInvoice(p)}>View Invoice</Button>
                </td>
              </tr>
            ))}
            {pagedPayments.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: 'var(--neutral-400)' }}>
                  {payments.length === 0 ? 'No transactions found.' : 'No transactions match your search criteria.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination" style={{ marginTop: '24px' }}>
          <button className="page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={`page-btn ${page === i ? 'page-btn-active' : ''}`}
              onClick={() => setPage(i)}
            >{i + 1}</button>
          ))}
          <button className="page-btn" disabled={page === totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      {/* Invoice Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          title="Payment Invoice"
          onClose={() => setSelectedInvoice(null)}
          actions={
            <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setSelectedInvoice(null)}>Close</Button>
              <Button onClick={() => window.print()}>Print / Download</Button>
            </div>
          }
        >
          <div className="invoice-receipt">
            <div className="receipt-header">
              <div>
                <h4 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--neutral-900)' }}>SyncEvent</h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--neutral-400)' }}>Official Receipt</p>
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
                <span className="value">{new Date(selectedInvoice.createdAt).toLocaleString()}</span>
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
                <span>Event Registration Fee (Booking #{selectedInvoice.bookingId})</span>
                <span style={{ fontWeight: 600 }}>₹{selectedInvoice.amount}</span>
              </div>

              <div className="receipt-total">
                <span className="total-label">
                  {selectedInvoice.status === 'FAILED' ? 'Payable Amount' : 'Total Amount Paid'}
                </span>
                <span className="total-value">₹{selectedInvoice.amount}</span>
              </div>

              {selectedInvoice.status === 'FAILED' && (
                <p style={{ marginTop: '16px', fontSize: '12px', color: '#dc2626', textAlign: 'right', fontWeight: 600 }}>
                  The transaction could not be processed. If funds were deducted, they will be reversed according to bank policy.
                </p>
              )}
            </div>

            <div className="receipt-footer">
              <p>Digital receipt generated by SyncEvent EMS Platform.</p>
              <div className="footer-ty">We look forward to seeing you at the event!</div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
