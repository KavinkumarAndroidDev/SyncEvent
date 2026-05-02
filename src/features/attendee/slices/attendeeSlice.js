import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../../lib/axios';

export const fetchAttendeeBookings = createAsyncThunk('attendee/fetchBookings', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/bookings?size=200');
    return res.data.content || [];
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load registrations');
  }
});

export const fetchBookingDetails = createAsyncThunk('attendee/fetchBookingDetails', async (id, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(`/bookings/${id}`);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load pass details.');
  }
});

export const cancelAttendeeBooking = createAsyncThunk('attendee/cancelBooking', async (id, { rejectWithValue }) => {
  try {
    await axiosInstance.patch(`/bookings/${id}/status`, { status: 'CANCELLED' });
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to cancel booking.');
  }
});

export const fetchCancelEvent = createAsyncThunk('attendee/fetchCancelEvent', async (eventId) => {
  try {
    const res = await axiosInstance.get(`/events/${eventId}`);
    return res.data;
  } catch {
    return { error: true };
  }
});

export const fetchAttendeePayments = createAsyncThunk('attendee/fetchPayments', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/payments/my-payments?size=200');
    return res.data.content || [];
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load payments');
  }
});

export const fetchAttendeeOverview = createAsyncThunk('attendee/fetchOverview', async (_, { rejectWithValue }) => {
  try {
    const [bookRes, payRes] = await Promise.all([
      axiosInstance.get('/bookings?size=100'),
      axiosInstance.get('/payments/my-payments?size=10')
    ]);
    return {
      bookings: bookRes.data.content || [],
      payments: payRes.data.content || [],
    };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load dashboard');
  }
});

export const fetchAttendeeNotifications = createAsyncThunk('attendee/fetchNotifications', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/notifications?size=200');
    return res.data?.content || [];
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load notifications');
  }
});

export const markNotificationRead = createAsyncThunk('attendee/markNotificationRead', async (item, { rejectWithValue }) => {
  try {
    await axiosInstance.patch(`/notifications/${item.id}/status`, { isRead: true });
    return item.id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to mark notification');
  }
});

export const markAllNotificationsRead = createAsyncThunk('attendee/markAllNotificationsRead', async (_, { rejectWithValue }) => {
  try {
    await axiosInstance.post('/notifications/read-all');
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to mark notifications');
  }
});

export const fetchPastAttendeeEvents = createAsyncThunk('attendee/fetchPastEvents', async (user, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/bookings?size=200');
    const past = (res.data.content || []).filter(b =>
      b.status === 'CONFIRMED' && b.eventStartTime && new Date(b.eventStartTime) < new Date()
    );
    const uniqueEvents = [];
    const seen = new Set();
    past.forEach(b => {
      if (!seen.has(b.eventId)) {
        seen.add(b.eventId);
        uniqueEvents.push(b);
      }
    });
    const submitted = [];
    const events = await Promise.all(uniqueEvents.map(async (item) => {
      let currentItem = item;
      if (!item.venueName && !item.eventLocation && !item.city) {
        try {
          const eventRes = await axiosInstance.get(`/events/${item.eventId}`);
          currentItem = {
            ...item,
            venueName: eventRes.data?.venueName,
            eventLocation: eventRes.data?.address,
            city: eventRes.data?.city,
          };
        } catch {
          currentItem = item;
        }
      }
      try {
        const feedbackRes = await axiosInstance.get(`/events/${item.eventId}/feedbacks?size=100`);
        const feedbacks = feedbackRes.data?.content || [];
        const hasFeedback = feedbacks.some(f =>
          f.userId === user?.id ||
          f.attendeeId === user?.id ||
          f.userEmail === user?.email ||
          f.email === user?.email ||
          f.userName === user?.fullName
        );
        if (hasFeedback) submitted.push(item.eventId);
      } catch {
        return currentItem;
      }
      return currentItem;
    }));
    return { events, submitted };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load past events');
  }
});

export const submitAttendeeFeedback = createAsyncThunk('attendee/submitFeedback', async ({ eventId, rating, comment }, { rejectWithValue }) => {
  try {
    await axiosInstance.post(`/events/${eventId}/feedbacks`, {
      rating: Number(rating),
      comment,
    });
    return eventId;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to submit feedback.');
  }
});

const attendeeSlice = createSlice({
  name: 'attendee',
  initialState: {
    bookings: [],
    selectedBooking: null,
    eventForCancel: null,
    payments: [],
    overviewBookings: [],
    overviewPayments: [],
    notifications: [],
    pastEvents: [],
    submittedFeedbacks: [],
    bookingsLoading: true,
    bookingDetailsLoading: false,
    checkingDeadline: false,
    paymentsLoading: true,
    overviewLoading: true,
    notificationsLoading: true,
    markingNotifications: false,
    pastEventsLoading: true,
    feedbackSubmitting: false,
    error: null,
  },
  reducers: {
    clearSelectedBooking(state) {
      state.selectedBooking = null;
    },
    clearCancelEvent(state) {
      state.eventForCancel = null;
    },
    clearAttendeeError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendeeBookings.pending, (state) => { state.bookingsLoading = true; state.error = null; })
      .addCase(fetchAttendeeBookings.fulfilled, (state, action) => {
        state.bookingsLoading = false;
        state.bookings = action.payload;
      })
      .addCase(fetchAttendeeBookings.rejected, (state, action) => {
        state.bookingsLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchBookingDetails.pending, (state) => { state.bookingDetailsLoading = true; state.error = null; })
      .addCase(fetchBookingDetails.fulfilled, (state, action) => {
        state.bookingDetailsLoading = false;
        state.selectedBooking = action.payload;
      })
      .addCase(fetchBookingDetails.rejected, (state, action) => {
        state.bookingDetailsLoading = false;
        state.error = action.payload;
      })
      .addCase(cancelAttendeeBooking.fulfilled, (state, action) => {
        state.bookings = state.bookings.map(item => item.id === action.payload ? { ...item, status: 'CANCELLED' } : item);
      })
      .addCase(cancelAttendeeBooking.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(fetchCancelEvent.pending, (state) => { state.checkingDeadline = true; })
      .addCase(fetchCancelEvent.fulfilled, (state, action) => {
        state.checkingDeadline = false;
        state.eventForCancel = action.payload;
      })
      .addCase(fetchCancelEvent.rejected, (state) => {
        state.checkingDeadline = false;
        state.eventForCancel = { error: true };
      })
      .addCase(fetchAttendeePayments.pending, (state) => { state.paymentsLoading = true; state.error = null; })
      .addCase(fetchAttendeePayments.fulfilled, (state, action) => {
        state.paymentsLoading = false;
        state.payments = action.payload;
      })
      .addCase(fetchAttendeePayments.rejected, (state, action) => {
        state.paymentsLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchAttendeeOverview.pending, (state) => { state.overviewLoading = true; state.error = null; })
      .addCase(fetchAttendeeOverview.fulfilled, (state, action) => {
        state.overviewLoading = false;
        state.overviewBookings = action.payload.bookings;
        state.overviewPayments = action.payload.payments;
      })
      .addCase(fetchAttendeeOverview.rejected, (state, action) => {
        state.overviewLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchAttendeeNotifications.pending, (state) => { state.notificationsLoading = true; state.error = null; })
      .addCase(fetchAttendeeNotifications.fulfilled, (state, action) => {
        state.notificationsLoading = false;
        state.notifications = action.payload;
      })
      .addCase(fetchAttendeeNotifications.rejected, (state, action) => {
        state.notificationsLoading = false;
        state.error = action.payload;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        state.notifications = state.notifications.map(n => n.id === action.payload ? { ...n, isRead: true } : n);
      })
      .addCase(markAllNotificationsRead.pending, (state) => { state.markingNotifications = true; })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.markingNotifications = false;
        state.notifications = state.notifications.map(n => ({ ...n, isRead: true }));
      })
      .addCase(markAllNotificationsRead.rejected, (state, action) => {
        state.markingNotifications = false;
        state.error = action.payload;
      })
      .addCase(fetchPastAttendeeEvents.pending, (state) => { state.pastEventsLoading = true; state.error = null; })
      .addCase(fetchPastAttendeeEvents.fulfilled, (state, action) => {
        state.pastEventsLoading = false;
        state.pastEvents = action.payload.events;
        state.submittedFeedbacks = action.payload.submitted;
      })
      .addCase(fetchPastAttendeeEvents.rejected, (state, action) => {
        state.pastEventsLoading = false;
        state.error = action.payload;
      })
      .addCase(submitAttendeeFeedback.pending, (state) => { state.feedbackSubmitting = true; state.error = null; })
      .addCase(submitAttendeeFeedback.fulfilled, (state, action) => {
        state.feedbackSubmitting = false;
        if (!state.submittedFeedbacks.includes(action.payload)) state.submittedFeedbacks.push(action.payload);
      })
      .addCase(submitAttendeeFeedback.rejected, (state, action) => {
        state.feedbackSubmitting = false;
        state.error = action.payload;
      });
  },
});

export const { clearSelectedBooking, clearCancelEvent, clearAttendeeError } = attendeeSlice.actions;
export default attendeeSlice.reducer;
