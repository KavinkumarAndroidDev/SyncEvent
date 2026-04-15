import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axiosInstance from '../api/axiosInstance';
import BookingHeader from '../components/booking/BookingHeader';
import StepIndicator from '../components/booking/StepIndicator';
import TicketCard from '../components/booking/TicketCard';
import StickyBar from '../components/booking/StickyBar';
import EventSummaryCard from '../components/booking/EventSummaryCard';
import BookingSummaryPanel from '../components/booking/BookingSummaryPanel';
import PaymentSuccessModal from '../components/booking/PaymentSuccessModal';
import PaymentFailureModal from '../components/booking/PaymentFailureModal';
import Modal from '../components/Modal';
import Button from '../components/Button';

const MAX_TICKETS_PER_BOOKING = 10;

export default function BookingPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, token } = useSelector((s) => s.auth);

    const [event, setEvent] = useState(null);
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
    const [tickets, setTickets] = useState([]);
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });
    const [isResuming, setIsResuming] = useState(false);

    function buildCartFromItems(items = []) {
        return items.reduce((acc, item) => {
            acc[item.ticketId] = item.quantity;
            return acc;
        }, {});
    }

    function resetMessageState() {
        setPreviewError('');
        setFailureReason('');
    }

    useEffect(() => {
        const resumeId = location.state?.resumeBookingId;

        const init = async () => {
            try {
                const [evtRes, tktRes] = await Promise.all([
                    axiosInstance.get(`/events/${id}`),
                    axiosInstance.get(`/events/${id}/tickets`)
                ]);

                setEvent(evtRes.data);
                setTickets(tktRes.data);

                if (resumeId) {
                    setIsResuming(true);
                    setCurrentBookingId(resumeId);

                    const bookRes = await axiosInstance.get(`/bookings/${resumeId}`);
                    const booking = bookRes.data;
                    setCart(buildCartFromItems(booking.items));

                    const prevRes = await axiosInstance.post('/bookings/preview', {
                        eventId: Number(id),
                        items: booking.items.map((item) => ({ ticketId: item.ticketId, qty: item.quantity })),
                        offerCode: null,
                    });

                    setPreview(prevRes.data);
                    setStep('payment');
                }
            } catch (err) {
                console.error('Init failed', err);
            } finally {
                setLoading(false);
            }
        };

        if (token && user?.role === 'ATTENDEE') {
            init();
        } else {
            setLoading(false);
        }
    }, [id, location.state, token, user]);

    function totalTickets() {
        return Object.values(cart).reduce((a, b) => a + b, 0);
    }

    function rawTotal() {
        if (!tickets.length) return 0;
        return tickets.reduce((sum, ticket) => sum + (cart[ticket.id] || 0) * ticket.price, 0);
    }

    function changeQty(ticketId, delta) {
        setCart((prev) => {
            const currentQty = prev[ticketId] || 0;
            const overallTotal = Object.values(prev).reduce((a, b) => a + b, 0);

            if (delta > 0 && overallTotal >= MAX_TICKETS_PER_BOOKING) {
                setModal({
                    isOpen: true,
                    title: 'Ticket Limit Reached',
                    message: `You can only book up to ${MAX_TICKETS_PER_BOOKING} tickets in one booking.`,
                });
                return prev;
            }

            const next = Math.max(0, currentQty + delta);
            const updated = { ...prev };

            if (next === 0) {
                delete updated[ticketId];
            } else {
                updated[ticketId] = next;
            }

            return updated;
        });

        setPreview(null);
        resetMessageState();
    }

    function getItems() {
        return Object.entries(cart).map(([ticketId, qty]) => ({ ticketId: Number(ticketId), qty }));
    }

    useEffect(() => {
        setParticipantsInfo((prev) => {
            const next = [];

            Object.entries(cart).forEach(([ticketId, qty]) => {
                for (let i = 0; i < qty; i += 1) {
                    const previousEntry = prev[next.length];
                    const sameTicket = previousEntry?.ticketId === Number(ticketId);

                    next.push({
                        ticketId: Number(ticketId),
                        ticketName: tickets.find((ticket) => ticket.id === Number(ticketId))?.name || 'Ticket',
                        name: sameTicket ? previousEntry.name : '',
                        email: sameTicket ? previousEntry.email : '',
                        phone: sameTicket ? previousEntry.phone : '',
                        gender: sameTicket ? previousEntry.gender : 'OTHER',
                    });
                }
            });

            return next;
        });
    }, [cart, tickets]);

    function validateCartSalePeriods() {
        const now = new Date();
        const expiredNames = [];
        const updatedCart = { ...cart };

        Object.entries(cart).forEach(([ticketId]) => {
            const ticket = tickets.find((item) => item.id === Number(ticketId));
            if (!ticket) return;

            const saleEnd = ticket.saleEndTime ? new Date(ticket.saleEndTime) : null;
            const saleStart = ticket.saleStartTime ? new Date(ticket.saleStartTime) : null;

            if ((saleEnd && now > saleEnd) || (saleStart && now < saleStart)) {
                expiredNames.push(ticket.name);
                delete updatedCart[ticketId];
            }
        });

        if (expiredNames.length > 0) {
            setCart(updatedCart);
            setPreview(null);
            setPreviewError(`The sale period is not active for: ${expiredNames.join(', ')}. Please review your selection.`);
            setStep('tickets');
            return false;
        }

        return true;
    }

    async function handleProceed() {
        if (totalTickets() === 0) return;
        resetMessageState();

        if (!validateCartSalePeriods()) return;
        setStep('participants');
    }

    async function applyDiscount() {
        if (!discountCode.trim()) return;

        setPreviewLoading(true);
        setPreviewError('');

        try {
            const res = await axiosInstance.post('/bookings/preview', {
                eventId: Number(id),
                items: getItems(),
                offerCode: discountCode.trim(),
            });
            setPreview(res.data);
        } catch (err) {
            setPreviewError(err.response?.data?.message || 'Invalid discount code.');
        } finally {
            setPreviewLoading(false);
        }
    }

    async function handleProceedToPayment() {
        resetMessageState();

        const incomplete = participantsInfo.some((participant) => !participant.name || !participant.email || !participant.phone);
        if (incomplete) {
            setPreviewError('Please fill in all participant details.');
            return;
        }

        const hasInvalidEmail = participantsInfo.some((participant) => !/\S+@\S+\.\S+/.test(participant.email.trim()));
        if (hasInvalidEmail) {
            setPreviewError('Please enter valid email addresses for all participants.');
            return;
        }

        const hasInvalidPhone = participantsInfo.some((participant) => !/^\d{10}$/.test(participant.phone.replace(/\D/g, '')));
        if (hasInvalidPhone) {
            setPreviewError('Please enter valid 10-digit phone numbers for all participants.');
            return;
        }

        const emails = participantsInfo.map((participant) => participant.email.toLowerCase().trim());
        if (new Set(emails).size !== emails.length) {
            setPreviewError('Each participant must have a unique email address.');
            return;
        }

        setPreviewLoading(true);

        try {
            const res = await axiosInstance.post('/bookings/preview', {
                eventId: Number(id),
                items: getItems(),
                offerCode: discountCode.trim() || null,
            });
            setPreview(res.data);
            setStep('payment');
        } catch (err) {
            setPreviewError(err.response?.data?.message || 'Could not get booking preview. Please try again.');
        } finally {
            setPreviewLoading(false);
        }
    }

    async function markFailed(bookingId, orderId) {
        try {
            await axiosInstance.post('/payments/fail', { bookingId, razorpayOrderId: orderId });
        } catch {
            // Keep the UI simple even if the fail endpoint cannot be reached.
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
                    await axiosInstance.post('/payments/verify', {
                        bookingId,
                        razorpayOrderId: response.razorpay_order_id,
                        razorpayPaymentId: response.razorpay_payment_id,
                        razorpaySignature: response.razorpay_signature,
                    });

                    setSuccessBookingId(bookingId);
                } catch (verifyErr) {
                    const message = (verifyErr.response?.data?.message || '').toLowerCase();

                    if (message.includes('expired') || message.includes('invalid') || message.includes('not found')) {
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
        setBookingLoading(true);
        setPreviewError('');

        if (!validateCartSalePeriods()) {
            setBookingLoading(false);
            return;
        }

        try {
            let bookingId = currentBookingId;
            let razorpayOrderId;
            let amount = preview?.totalAmount || rawTotal();

            if (isResuming) {
                const retryRes = await axiosInstance.post('/payments/retry', { bookingId });
                razorpayOrderId = retryRes.data.razorpayOrderId;
            } else {
                const bookRes = await axiosInstance.post('/bookings', {
                    eventId: Number(id),
                    items: getItems(),
                    offerCode: discountCode.trim() || null,
                });

                bookingId = bookRes.data.bookingId;
                razorpayOrderId = bookRes.data.razorpayOrderId;
                amount = bookRes.data.amount;
                setCurrentBookingId(bookingId);

                const detailRes = await axiosInstance.get(`/bookings/${bookingId}`);
                const itemsFromDb = detailRes.data.items || [];
                const finalParticipants = [];
                let participantIndex = 0;

                itemsFromDb.forEach((item) => {
                    for (let i = 0; i < item.quantity; i += 1) {
                        const participant = participantsInfo[participantIndex];
                        if (participant) {
                            finalParticipants.push({
                                registrationItemId: item.id,
                                eventId: Number(id),
                                name: participant.name.trim(),
                                email: participant.email.trim(),
                                phone: participant.phone.replace(/\D/g, ''),
                                gender: participant.gender,
                            });
                        }
                        participantIndex += 1;
                    }
                });

                await axiosInstance.post('/participants', finalParticipants);
            }

            openRazorpay(bookingId, razorpayOrderId, amount);
        } catch (err) {
            const serverMsg = err.response?.data?.message || err.message || '';
            const lowerMessage = serverMsg.toLowerCase();

            if (lowerMessage.includes('active booking')) {
                try {
                    const activeRes = await axiosInstance.get(`/bookings/event/${id}/active`);
                    const existingBooking = activeRes.data;

                    if (existingBooking?.id) {
                        setIsResuming(true);
                        setCurrentBookingId(existingBooking.id);
                        setCart(buildCartFromItems(existingBooking.items));

                        const prevRes = await axiosInstance.post('/bookings/preview', {
                            eventId: Number(id),
                            items: existingBooking.items?.map((item) => ({ ticketId: item.ticketId, qty: item.quantity })) || [],
                            offerCode: null,
                        });

                        setPreview(prevRes.data);
                        setStep('payment');
                        setPreviewError('You already have a pending booking for this event. Click Pay Now to continue.');
                    } else {
                        setPreviewError('You already have a confirmed registration for this event.');
                    }
                } catch {
                    setPreviewError('You already have a booking for this event. Please check your dashboard.');
                }

                setBookingLoading(false);
                return;
            }

            if (lowerMessage.includes('ticket sale has ended') || lowerMessage.includes('sale has ended')) {
                const ticketName = serverMsg.includes(':') ? serverMsg.split(':').slice(1).join(':').trim() : '';
                const expiredTicket = tickets.find((ticket) => ticketName && ticket.name === ticketName);

                if (expiredTicket) {
                    setCart((prev) => {
                        const updated = { ...prev };
                        delete updated[expiredTicket.id];
                        return updated;
                    });
                }

                setStep('tickets');
                setPreview(null);
                setPreviewError(
                    ticketName
                        ? `The sale period for "${ticketName}" has ended. It has been removed from your cart.`
                        : 'One or more selected tickets are no longer available. Please review your cart.'
                );
                setBookingLoading(false);
                return;
            }

            setPreviewError(serverMsg || 'Failed to complete booking. Please try again.');
            setBookingLoading(false);
        }
    }

    async function handleRetry() {
        if (!currentBookingId) return;

        setFailureReason('');
        setPreviewError('');
        setBookingLoading(true);

        try {
            const res = await axiosInstance.post('/payments/retry', { bookingId: currentBookingId });
            openRazorpay(currentBookingId, res.data.razorpayOrderId, preview?.totalAmount || rawTotal());
        } catch (err) {
            setPreviewError(err.response?.data?.message || 'Retry failed.');
            setBookingLoading(false);
        }
    }

    async function handleCancelBooking() {
        setFailureReason('');

        if (currentBookingId) {
            try {
                await axiosInstance.patch(`/bookings/${currentBookingId}/status`, { status: 'CANCELLED' });
            } catch {
                // If backend rejects cancellation for pending bookings, still move the user out of checkout.
            }
        }

        navigate(`/events/${id}`);
    }

    const updateParticipant = (index, field, value) => {
        setParticipantsInfo((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

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
                    {previewError && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 14, padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>
                            {previewError}
                        </div>
                    )}
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
                <div className="detail-container" style={{ maxWidth: 700, paddingTop: 28 }}>
                    <button onClick={() => setStep('tickets')} style={{ background: 'none', border: 'none', color: 'var(--neutral-400)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 20, padding: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg> Back to Tickets
                    </button>
                    <h3 style={{ fontFamily: 'DM Sans', textAlign: 'center', marginBottom: 24 }}>Participant Details</h3>
                    {previewError && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 14, padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>
                            {previewError}
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {participantsInfo.map((participant, index) => (
                            <div key={`${participant.ticketId}-${index}`} style={{ padding: 20, border: '1px solid var(--neutral-100)', borderRadius: 12, background: 'white' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <h5 style={{ fontFamily: 'DM Sans', fontWeight: 600 }}>Attendee {index + 1}</h5>
                                    <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>{participant.ticketName}</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Full Name</label>
                                        <input className="form-input" type="text" value={participant.name} onChange={(e) => updateParticipant(index, 'name', e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email</label>
                                        <input className="form-input" type="email" value={participant.email} onChange={(e) => updateParticipant(index, 'email', e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phone</label>
                                        <input className="form-input" type="text" value={participant.phone} onChange={(e) => updateParticipant(index, 'phone', e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Gender</label>
                                        <select className="form-input" value={participant.gender} onChange={(e) => updateParticipant(index, 'gender', e.target.value)}>
                                            <option value="MALE">Male</option>
                                            <option value="FEMALE">Female</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {step === 'payment' && (
                <div className="detail-container" style={{ paddingTop: 28 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 40, alignItems: 'start' }}>
                        <div>
                            <button onClick={() => setStep('participants')} style={{ background: 'none', border: 'none', color: 'var(--neutral-400)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 20, padding: 0 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg> Back to Participants
                            </button>
                            <h3 style={{ fontFamily: 'DM Sans', fontWeight: 700, marginBottom: 20 }}>Complete Booking</h3>
                            <hr style={{ border: 'none', borderTop: '1px solid var(--neutral-100)', marginBottom: 20 }} />

                            <EventSummaryCard event={event} />

                            <h5 style={{ fontFamily: 'DM Sans', fontWeight: 700, marginBottom: 14 }}>Items Summary</h5>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {tickets.filter((ticket) => cart[ticket.id]).map((ticket) => (
                                    <div key={ticket.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', border: '1px solid var(--neutral-100)', borderRadius: 10 }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 15 }}>{ticket.name}</div>
                                            <div style={{ fontSize: 13, color: 'var(--neutral-400)' }}>Rs. {ticket.price} x {cart[ticket.id]}</div>
                                        </div>
                                        <div style={{ fontWeight: 700 }}>Rs. {ticket.price * cart[ticket.id]}</div>
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
                        />
                    </div>
                </div>
            )}

            {totalTickets() > 0 && step === 'tickets' && (
                <StickyBar total={rawTotal()} count={totalTickets()} loading={previewLoading} onProceed={handleProceed} />
            )}

            {step === 'participants' && (
                <div style={{ position: 'sticky', bottom: 0, background: 'white', borderTop: '1px solid var(--neutral-100)', padding: '16px 0', zIndex: 90 }}>
                    <div className="detail-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: 13, color: 'var(--neutral-400)' }}>Next step</div>
                            <div style={{ fontWeight: 700 }}>Payment Summary</div>
                        </div>
                        <button onClick={handleProceedToPayment} disabled={previewLoading} style={{ padding: '12px 32px', background: 'var(--neutral-900)', color: 'white', borderRadius: 20, border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                            {previewLoading ? 'Loading...' : 'Continue to Payment'}
                        </button>
                    </div>
                </div>
            )}

            <PaymentSuccessModal bookingId={successBookingId} onGoHome={() => navigate('/dashboard/registrations')} />

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
