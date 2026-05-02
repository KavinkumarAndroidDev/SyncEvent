import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../../lib/axios';

const getMessage = (err, fallback) => err.response?.data?.message || fallback;

export const fetchBookingStart = createAsyncThunk('booking/fetchStart', async (id, { rejectWithValue }) => {
  try {
    const [eventRes, ticketsRes] = await Promise.all([
      axiosInstance.get(`/events/${id}`),
      axiosInstance.get(`/events/${id}/tickets`),
    ]);
    return { event: eventRes.data, tickets: ticketsRes.data || [] };
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to load booking.'));
  }
});

export const fetchResumeBooking = createAsyncThunk('booking/fetchResume', async ({ id, resumeBookingId, offerCode }, { rejectWithValue }) => {
  try {
    const bookingRes = await axiosInstance.get(`/bookings/${resumeBookingId}`);
    const paymentRes = await axiosInstance.get(`/payments/${resumeBookingId}`).catch(() => ({ data: null }));
    let preview = null;
    const booking = bookingRes.data;
    if ((booking.items || []).length > 0) {
      const previewRes = await axiosInstance.post('/bookings/preview', {
        eventId: Number(id),
        items: (booking.items || []).map((item) => ({ ticketId: item.ticketId, qty: item.quantity })),
        offerCode: offerCode?.trim() || null,
      });
      preview = previewRes.data;
    }
    return { booking, payment: paymentRes.data, preview };
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to resume booking.'));
  }
});

export const previewBooking = createAsyncThunk('booking/preview', async ({ eventId, items, offerCode }, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post('/bookings/preview', {
      eventId: Number(eventId),
      items,
      offerCode,
    });
    return res.data;
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Could not get booking preview. Please try again.'));
  }
});

export const markPaymentFailed = createAsyncThunk('booking/markFailed', async ({ bookingId, razorpayOrderId }, { rejectWithValue }) => {
  try {
    await axiosInstance.post('/payments/fail', { bookingId, razorpayOrderId });
    return { bookingId, razorpayOrderId };
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to mark payment failed.'));
  }
});

export const verifyPayment = createAsyncThunk('booking/verifyPayment', async (payload, { rejectWithValue }) => {
  try {
    await axiosInstance.post('/payments/verify', payload);
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Payment verification failed. Please try again.'));
  }
});

export const createBookingPayment = createAsyncThunk('booking/createPayment', async ({ eventId, items, offerCode, participantsInfo }, { rejectWithValue }) => {
  try {
    const bookingRes = await axiosInstance.post('/bookings', {
      eventId: Number(eventId),
      items,
      offerCode,
    });

    const bookingId = bookingRes.data.bookingId;
    const orderId = bookingRes.data.razorpayOrderId;
    const amount = bookingRes.data.amount;
    const detailsRes = await axiosInstance.get(`/bookings/${bookingId}`);
    const participantPayload = [];
    let participantIndex = 0;

    (detailsRes.data.items || []).forEach((item) => {
      for (let i = 0; i < item.quantity; i += 1) {
        const participant = participantsInfo[participantIndex];
        participantIndex += 1;
        if (!participant) continue;
        participantPayload.push({
          registrationItemId: item.id,
          eventId: Number(eventId),
          name: participant.name.trim(),
          email: participant.email.trim(),
          phone: participant.phone.replace(/\D/g, ''),
          gender: participant.gender,
        });
      }
    });

    if (participantPayload.length) {
      await axiosInstance.post('/participants', participantPayload);
    }

    const paymentRes = await axiosInstance.get(`/payments/${bookingId}`).catch(() => ({ data: null }));
    return {
      bookingId,
      orderId,
      amount,
      payment: paymentRes.data || { razorpayOrderId: orderId, status: 'PENDING', amount },
    };
  } catch (err) {
    return rejectWithValue({
      message: getMessage(err, 'Failed to complete booking. Please try again.'),
      data: err.response?.data,
    });
  }
});

export const retryBookingPayment = createAsyncThunk('booking/retryPayment', async (bookingId, { rejectWithValue }) => {
  try {
    const retryRes = await axiosInstance.post('/payments/retry', { bookingId });
    return retryRes.data.razorpayOrderId;
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to retry payment.'));
  }
});

export const fetchBookingPayment = createAsyncThunk('booking/fetchPayment', async (bookingId, { rejectWithValue }) => {
  try {
    const paymentRes = await axiosInstance.get(`/payments/${bookingId}`);
    return paymentRes.data;
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to load payment.'));
  }
});

const bookingSlice = createSlice({
  name: 'booking',
  initialState: {
    event: null,
    tickets: [],
    loading: true,
    preview: null,
    paymentInfo: null,
    error: null,
  },
  reducers: {
    clearBookingState(state) {
      state.event = null;
      state.tickets = [];
      state.preview = null;
      state.paymentInfo = null;
      state.loading = true;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookingStart.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchBookingStart.fulfilled, (state, action) => {
        state.loading = false;
        state.event = action.payload.event;
        state.tickets = action.payload.tickets;
      })
      .addCase(fetchBookingStart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(previewBooking.fulfilled, (state, action) => { state.preview = action.payload; })
      .addCase(fetchResumeBooking.fulfilled, (state, action) => {
        state.preview = action.payload.preview;
        state.paymentInfo = action.payload.payment;
      })
      .addCase(markPaymentFailed.fulfilled, (state, action) => {
        state.paymentInfo = { ...(state.paymentInfo || {}), status: 'FAILED', razorpayOrderId: action.payload.razorpayOrderId };
      });
  },
});

export const { clearBookingState } = bookingSlice.actions;
export default bookingSlice.reducer;
