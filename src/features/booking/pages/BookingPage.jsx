import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import BookingHeader from '../components/BookingHeader';
import StepIndicator from '../components/StepIndicator';
import TicketCard from '../components/TicketCard';
import StickyBar from '../components/StickyBar';
import EventSummaryCard from '../components/EventSummaryCard';
import BookingSummaryPanel from '../components/BookingSummaryPanel';
import PaymentSuccessModal from '../components/PaymentSuccessModal';
import PaymentFailureModal from '../components/PaymentFailureModal';
import ParticipantDetailsSection from '../components/ParticipantDetailsSection';
import BookingAlert from '../components/BookingAlert';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { formatMoney } from '../../../utils/formatters';
import { clearBookingDraft, loadBookingDraft, saveBookingDraft } from '../utils/bookingDraft';
import {
  MAX_TICKETS_PER_BOOKING,
  buildCartFromItems,
  buildParticipantRows,
  validateParticipantRows,
} from '../utils/bookingHelpers';
import {
  createBookingPayment,
  fetchBookingPayment,
  fetchBookingStart,
  fetchResumeBooking,
  markPaymentFailed,
  previewBooking,
  retryBookingPayment,
  verifyPayment
} from '../slices/bookingSlice';

export default function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, token } = useSelector((s) => s.auth);
  const { event, tickets } = useSelector((s) => s.booking);

  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('tickets');
  const [cart, setCart] = useState({});
  const [participantsInfo, setParticipantsInfo] = useState([]);
  const [discountCode, setDiscountCode] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [successBookingId, setSuccessBookingId] = useState(null);
  const [failureReason, setFailureReason] = useState('');
  const [currentBookingId, setCurrentBookingId] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [isResuming, setIsResuming] = useState(false);
  const [lockedBooking, setLockedBooking] = useState(false);
  const [resumeMessage, setResumeMessage] = useState('');
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });

  const totalTickets = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const rawTotal = tickets.reduce((sum, ticket) => sum + (cart[ticket.id] || 0) * Number(ticket.price || 0), 0);

  useEffect(() => {
    setParticipantsInfo((prev) => buildParticipantRows(cart, tickets, prev));
  }, [cart, tickets]);

  useEffect(() => {
    if (!token || user?.role !== 'ATTENDEE' || !event) return;

    saveBookingDraft(id, {
      cart,
      participantsInfo,
      discountCode,
      currentBookingId,
      step,
      isResuming,
      lockedBooking,
      paymentInfo,
    });
  }, [id, cart, participantsInfo, discountCode, currentBookingId, step, isResuming, lockedBooking, paymentInfo, token, user, event]);

  useEffect(() => {
    async function init() {
      const draft = loadBookingDraft(id);
      const resumeBookingId = location.state?.resumeBookingId || draft?.currentBookingId;

      try {
        const start = await dispatch(fetchBookingStart(id)).unwrap();
        const ticketList = start.tickets || [];
        setDiscountCode(draft?.discountCode || '');

        if (resumeBookingId) {
          const resume = await dispatch(fetchResumeBooking({ id, resumeBookingId, offerCode: draft?.discountCode })).unwrap();
          const booking = resume.booking;
          const restoredCart = buildCartFromItems(booking.items || []);

          setCart(restoredCart);
          setCurrentBookingId(booking.id);
          setPaymentInfo(resume.payment);
          setIsResuming(true);
          setLockedBooking(true);
          setParticipantsInfo(buildParticipantRows(restoredCart, ticketList, draft?.participantsInfo || []));
          setStep('payment');

          if (resume.payment?.status === 'FAILED') {
            setResumeMessage('Your previous payment failed. Review the summary and try again.');
          } else {
            setResumeMessage('You already have a pending booking for this event. Continue the payment below.');
          }

          setPreview(resume.preview);
        } else if (draft?.cart) {
          setCart(draft.cart);
          setParticipantsInfo(buildParticipantRows(draft.cart, ticketList, draft.participantsInfo || []));
          setStep(draft.step || 'tickets');
        }
      } catch (err) {
      setPreviewError(err || 'Could not load booking.');
      } finally {
        setLoading(false);
      }
    }

    if (token && user?.role === 'ATTENDEE') {
      init();
    } else {
      setLoading(false);
    }
  }, [dispatch, id, location.state, token, user]);

  function resetMessages() {
    setPreviewError('');
    setFailureReason('');
  }

  function getItems() {
    return Object.entries(cart).map(([ticketId, qty]) => ({ ticketId: Number(ticketId), qty }));
  }

  function openInfoModal(title, message) {
    setModal({ isOpen: true, title, message });
  }

  function changeQty(ticketId, delta) {
    if (lockedBooking) return;

    setCart((prev) => {
      const currentQty = prev[ticketId] || 0;
      const totalQty = Object.values(prev).reduce((sum, value) => sum + value, 0);
      const ticket = tickets.find((item) => item.id === ticketId);

      if (delta > 0 && totalQty >= MAX_TICKETS_PER_BOOKING) {
        openInfoModal('Ticket Limit Reached', `You can only book up to ${MAX_TICKETS_PER_BOOKING} tickets in one booking.`);
        return prev;
      }

      if (delta > 0 && ticket && currentQty >= Number(ticket.availableQuantity || 0)) {
        openInfoModal('Not Enough Tickets', `Only ${ticket.availableQuantity} tickets are available for ${ticket.name}.`);
        return prev;
      }

      const nextQty = Math.max(0, currentQty + delta);
      const updated = { ...prev };

      if (nextQty === 0) {
        delete updated[ticketId];
      } else {
        updated[ticketId] = nextQty;
      }

      return updated;
    });

    setPreview(null);
    resetMessages();
  }

  function validateCart() {
    const expiredNames = [];
    const unavailableNames = [];
    const now = new Date();
    const updatedCart = { ...cart };

    Object.entries(cart).forEach(([ticketId, qty]) => {
      const ticket = tickets.find((item) => item.id === Number(ticketId));
      if (!ticket) return;

      const saleStart = ticket.saleStartTime ? new Date(ticket.saleStartTime) : null;
      const saleEnd = ticket.saleEndTime ? new Date(ticket.saleEndTime) : null;

      if ((saleStart && now < saleStart) || (saleEnd && now > saleEnd)) {
        expiredNames.push(ticket.name);
        delete updatedCart[ticketId];
      } else if (qty > Number(ticket.availableQuantity || 0)) {
        unavailableNames.push(ticket.name);
        updatedCart[ticketId] = Number(ticket.availableQuantity || 0);
        if (updatedCart[ticketId] <= 0) delete updatedCart[ticketId];
      }
    });

    if (expiredNames.length || unavailableNames.length) {
      setCart(updatedCart);
      setPreview(null);
      setStep('tickets');

      if (expiredNames.length) {
        setPreviewError(`The sale period is not active for: ${expiredNames.join(', ')}.`);
      } else {
        setPreviewError(`Ticket availability changed for: ${unavailableNames.join(', ')}.`);
      }

      return false;
    }

    return true;
  }

  async function requestPreview(nextOfferCode) {
    const data = await dispatch(previewBooking({
      eventId: Number(id),
      items: getItems(),
      offerCode: nextOfferCode,
    })).unwrap();
    setPreview(data);
    return data;
  }

  async function handleProceed() {
    if (totalTickets === 0) return;
    resetMessages();
    if (!validateCart()) return;
    setStep('participants');
  }

  async function applyDiscount() {
    if (!discountCode.trim()) return;

    setPreviewLoading(true);
    setPreviewError('');

    try {
      await requestPreview(discountCode.trim());
    } catch (err) {
      setPreviewError(err.response?.data?.message || 'Invalid discount code.');
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleProceedToPayment() {
    resetMessages();

    if (!lockedBooking) {
      const participantError = validateParticipantRows(participantsInfo);
      if (participantError) {
        setPreviewError(participantError);
        return;
      }
    }

    setPreviewLoading(true);

    try {
      await requestPreview(discountCode.trim() || null);
      setStep('payment'); 
    } catch (err) {
      setPreviewError(err.response?.data?.message || 'Could not get booking preview. Please try again.');
    } finally {
      setPreviewLoading(false);
    }
  }

  async function markFailed(bookingId, orderId) {
    if (!bookingId || !orderId) return;

    try {
      await dispatch(markPaymentFailed({ bookingId, razorpayOrderId: orderId })).unwrap();
      setPaymentInfo((prev) => ({ ...prev, status: 'FAILED', razorpayOrderId: orderId }));
    } catch {
      return;
    }
  }

  function openRazorpay(bookingId, orderId, amount) {
    if (!window.Razorpay) {
      setFailureReason('Payment window could not be opened. Please refresh the page and try again.');
      setBookingLoading(false);
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: Math.round(Number(amount || 0) * 100),
      currency: 'INR',
      name: 'SyncEvent',
      description: event?.title || 'Event Booking',
      order_id: orderId,
      handler: async (response) => {
        try {
          await dispatch(verifyPayment({
            bookingId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          })).unwrap();

          clearBookingDraft(id);
          setSuccessBookingId(bookingId);
        } catch (verifyErr) {
          const message = (verifyErr.response?.data?.message || '').toLowerCase();

          if (message.includes('expired') || message.includes('invalid') || message.includes('not found')) {
            clearBookingDraft(id);
            setFailureReason('Your booking session expired. Please start again from the event page.');
          } else {
            await markFailed(bookingId, orderId);
            setFailureReason('Payment verification failed. Please try again.');
          }
        }

        setBookingLoading(false);
      },
      prefill: { email: user?.email || '' },
      modal: {
        ondismiss: async () => {
          await markFailed(bookingId, orderId);
          setFailureReason('You closed the payment window before completing the payment.');
          setBookingLoading(false);
        },
      },
      theme: { color: '#17B978' },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.on('payment.failed', async (response) => {
      await markFailed(bookingId, orderId);
      setFailureReason(response.error?.description || 'Payment failed.');
      setBookingLoading(false);
    });
    razorpay.open();
  }

  async function handlePayNow() {
    resetMessages();
    setBookingLoading(true);

    if (!lockedBooking && !validateCart()) {
      setBookingLoading(false);
      return;
    }

    let freshBookingId = null;
    let freshOrderId = null;

    try {
      let bookingId = currentBookingId;
      let orderId = paymentInfo?.razorpayOrderId || '';
      let amount = preview?.totalAmount || rawTotal;

      if (!bookingId) {
        const created = await dispatch(createBookingPayment({
          eventId: Number(id),
          items: getItems(),
          offerCode: discountCode.trim() || null,
          participantsInfo,
        })).unwrap();

        bookingId = created.bookingId;
        orderId = created.orderId;
        amount = created.amount;
        freshBookingId = bookingId;
        freshOrderId = orderId;

        setCurrentBookingId(bookingId);
        setPaymentInfo(created.payment);
        setIsResuming(true);
        setLockedBooking(true);
      } else if (paymentInfo?.status === 'FAILED') {
        orderId = await dispatch(retryBookingPayment(bookingId)).unwrap();
        setPaymentInfo((prev) => ({ ...prev, razorpayOrderId: orderId, status: 'PENDING' }));
      } else if (!orderId) {
        const payment = await dispatch(fetchBookingPayment(bookingId)).unwrap();
        orderId = payment?.razorpayOrderId || '';
        amount = payment?.amount || amount;
        setPaymentInfo(payment);
      }

      openRazorpay(bookingId, orderId, amount);
    } catch (err) {
      if (freshBookingId && freshOrderId) {
        await markFailed(freshBookingId, freshOrderId);
      }

      const serverMsg = err.message || err || 'Failed to complete booking. Please try again.';
      const lowerMessage = serverMsg.toLowerCase();

      if (lowerMessage.includes('ticket sale has ended') || lowerMessage.includes('not enough tickets available')) {
        setStep('tickets');
        setPreview(null);
      }

      setPreviewError(serverMsg);
      setBookingLoading(false);
    }
  }

  async function handleRetry() {
    if (!currentBookingId) return;
    setFailureReason('');
    await handlePayNow();
  }

  async function handleCancelBooking() {
    setFailureReason('');

    if (currentBookingId && paymentInfo?.status === 'PENDING' && paymentInfo?.razorpayOrderId) {
      await markFailed(currentBookingId, paymentInfo.razorpayOrderId);
    }

    clearBookingDraft(id);
    navigate(`/events/${id}`);
  }

  function updateParticipant(index, field, value) {
    setParticipantsInfo((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  if (loading) return <div className="detail-status">Loading...</div>;
  if (!event) return <div className="detail-status">Event not found.</div>;

  if (!token || user?.role !== 'ATTENDEE') {
    return (
      <main style={{ padding: '32px 0 64px' }}>
        <div className="detail-container">
          <div style={{ maxWidth: 520, margin: '60px auto', textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            </div>
            <h3 style={{ fontFamily: 'DM Sans', fontWeight: 700, marginBottom: 8 }}>Login Required</h3>
            <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginBottom: 24 }}>You need to be logged in as an attendee to book tickets.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => navigate(-1)} style={{ padding: '10px 22px', border: '1px solid var(--neutral-100)', borderRadius: 20, background: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Go Back</button>
              <Link to="/login" state={{ from: location.pathname }} style={{ padding: '10px 22px', background: 'var(--neutral-900)', color: 'white', borderRadius: 20, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Login Now</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ paddingBottom: 80 }}>
      <BookingHeader event={event} onBack={() => navigate(-1)} />
      <StepIndicator step={step} />

      {step === 'tickets' && (
        <div className="detail-container" style={{ maxWidth: 800, paddingTop: 28 }}>
          <h3 style={{ fontFamily: 'DM Sans', textAlign: 'center', marginBottom: 24 }}>Select Tickets</h3>
          <BookingAlert message={previewError} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                qty={cart[ticket.id] || 0}
                onAdd={() => changeQty(ticket.id, 1)}
                onIncrease={() => changeQty(ticket.id, 1)}
                onDecrease={() => changeQty(ticket.id, -1)}
              />
            ))}
          </div>
        </div>
      )}

      {step === 'participants' && (
        <ParticipantDetailsSection
          participants={participantsInfo}
          error={previewError}
          locked={lockedBooking}
          loading={previewLoading}
          onBack={() => {
            if (lockedBooking) {
              navigate(`/events/${id}`);
            } else {
              setStep('tickets');
            }
          }}
          onChange={updateParticipant}
          onContinue={handleProceedToPayment}
        />
      )}

      {step === 'payment' && (
        <div className="detail-container" style={{ paddingTop: 28 }}>
          <div className="booking-payment-grid">
            <div>
              <button
                onClick={() => setStep('participants')}
                style={{ background: 'none', border: 'none', color: 'var(--neutral-400)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 20, padding: 0 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                Back to Participants
              </button>

              <h3 style={{ fontFamily: 'DM Sans', fontWeight: 700, marginBottom: 20 }}>Complete Booking</h3>
              <hr style={{ border: 'none', borderTop: '1px solid var(--neutral-100)', marginBottom: 20 }} />

              {resumeMessage && <BookingAlert message={resumeMessage} type="success" />}
              <BookingAlert message={previewError} />

              <EventSummaryCard event={event} />

              <h5 style={{ fontFamily: 'DM Sans', fontWeight: 700, marginBottom: 14 }}>Items Summary</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {tickets.filter((ticket) => cart[ticket.id]).map((ticket) => (
                  <div key={ticket.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', border: '1px solid var(--neutral-100)', borderRadius: 10 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{ticket.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--neutral-400)' }}>{formatMoney(ticket.price)} x {cart[ticket.id]}</div>
                    </div>
                    <div style={{ fontWeight: 700 }}>{formatMoney(Number(ticket.price || 0) * cart[ticket.id])}</div>
                  </div>
                ))}
              </div>
            </div>

            <BookingSummaryPanel
              tickets={tickets}
              cart={cart}
              preview={preview}
              discountCode={discountCode}
              setDiscountCode={setDiscountCode}
              onApplyDiscount={applyDiscount}
              onPayNow={handlePayNow}
              previewLoading={previewLoading}
              bookingLoading={bookingLoading}
              previewError={previewError}
              disableDiscount={lockedBooking}
            />
          </div>
        </div>
      )}

      {totalTickets > 0 && step === 'tickets' && !lockedBooking && (
        <StickyBar total={rawTotal} count={totalTickets} loading={previewLoading} onProceed={handleProceed} />
      )}

      <PaymentSuccessModal
        bookingId={successBookingId}
        onGoHome={() => {
          clearBookingDraft(id);
          navigate('/dashboard/registrations');
        }}
      />

      <PaymentFailureModal reason={failureReason} onRetry={handleRetry} onCancel={handleCancelBooking} />

      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        onClose={() => setModal({ isOpen: false, title: '', message: '' })}
        actions={<Button onClick={() => setModal({ isOpen: false, title: '', message: '' })}>Close</Button>}
      >
        {modal.message}
      </Modal>
    </main>
  );
}
