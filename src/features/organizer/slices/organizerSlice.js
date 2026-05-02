import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../../lib/axios';

const getMessage = (err, fallback) => err.response?.data?.message || fallback;

function dateRange(period) {
  const to = new Date();
  const from = new Date();
  let groupBy = 'month';
  if (period === '7D') { from.setDate(to.getDate() - 7); groupBy = 'day'; }
  else if (period === '1M') { from.setDate(to.getDate() - 30); groupBy = 'week'; }
  else if (period === '1Y') { from.setFullYear(to.getFullYear() - 1); groupBy = 'month'; }
  else { from.setFullYear(2022); groupBy = 'month'; }
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);
  const format = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  return { from, to, fromStr: format(from), toStr: format(to), groupBy };
}

export const fetchOrganizerOverview = createAsyncThunk('organizer/fetchOverview', async (_, { rejectWithValue }) => {
  try {
    const [summaryRes, reportsRes, notifRes] = await Promise.all([
      axiosInstance.get('/reports/summary').catch(() => ({ data: {} })),
      axiosInstance.get('/reports/events?size=500').catch(() => ({ data: { content: [] } })),
      axiosInstance.get('/notifications?size=5').catch(() => ({ data: { content: [] } })),
    ]);
    const summaryData = summaryRes.data || {};
    const eventReports = reportsRes.data?.content || [];
    const notifications = notifRes.data?.content || [];
    const agg = eventReports.reduce((acc, r) => ({
      revenue: acc.revenue + Number(r.netRevenue || 0),
      tickets: acc.tickets + Number(r.confirmedRegistrations || 0),
      totalAttendance: acc.totalAttendance + Number(r.attendanceRate || 0),
      count: acc.count + 1,
    }), { revenue: 0, tickets: 0, totalAttendance: 0, count: 0 });
    return {
      stats: {
        totalRevenue: Number(summaryData.totalRevenue) || agg.revenue,
        totalTickets: Number(summaryData.confirmedRegistrations) || agg.tickets,
        totalEvents: Number(summaryData.totalEvents) || agg.count,
        avgAttendance: Math.min(agg.count ? (agg.totalAttendance / agg.count) : 0, 100),
      },
      recentEvents: [...eventReports].sort((a, b) => new Date(b.startTime) - new Date(a.startTime)).slice(0, 5),
      notifications: notifications.slice(0, 5),
      unreadCount: notifications.filter(n => !n.isRead).length,
    };
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Dashboard load error'));
  }
});

export const fetchOrganizerRevenueChart = createAsyncThunk('organizer/fetchRevenueChart', async (period, { rejectWithValue }) => {
  try {
    const { fromStr, toStr, groupBy } = dateRange(period);
    const res = await axiosInstance.get(`/reports/revenue?from=${fromStr}&to=${toStr}&groupBy=${groupBy}`);
    const points = Array.isArray(res.data) ? res.data : [];
    return {
      period,
      points: points.map(p => ({ date: p.period, revenue: Number(p.revenue || 0), tickets: Number(p.registrations || 0) })),
      periodStats: {
        totalRevenue: points.reduce((s, p) => s + Number(p.revenue || 0), 0),
        totalTickets: points.reduce((s, p) => s + Number(p.registrations || 0), 0),
      },
    };
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Could not load chart data'));
  }
});

export const fetchOrganizerMetadata = createAsyncThunk('organizer/fetchMetadata', async (_, { rejectWithValue }) => {
  try {
    const [categoriesRes, venuesRes] = await Promise.all([
      axiosInstance.get('/categories'),
      axiosInstance.get('/venues'),
    ]);
    return {
      categories: categoriesRes.data?.content || categoriesRes.data || [],
      venues: venuesRes.data?.content || venuesRes.data || [],
    };
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to load form data.'));
  }
});

export const createOrganizerEvent = createAsyncThunk('organizer/createEvent', async (payload, { rejectWithValue }) => {
  try {
    await axiosInstance.post('/events', payload);
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to create event.'));
  }
});

export const fetchOrganizerEditEvent = createAsyncThunk('organizer/fetchEditEvent', async (id, { rejectWithValue }) => {
  try {
    const [categoriesRes, venuesRes, eventRes, ticketsRes] = await Promise.all([
      axiosInstance.get('/categories'),
      axiosInstance.get('/venues'),
      axiosInstance.get(`/events/${id}`),
      axiosInstance.get(`/events/${id}/tickets`).catch(() => ({ data: [] })),
    ]);
    return {
      categories: categoriesRes.data?.content || categoriesRes.data || [],
      venues: venuesRes.data?.content || venuesRes.data || [],
      event: eventRes.data,
      tickets: Array.isArray(ticketsRes.data) ? ticketsRes.data : (ticketsRes.data?.content || []),
    };
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to load event data.'));
  }
});

export const updateOrganizerEvent = createAsyncThunk('organizer/updateEvent', async ({ id, payload }, { rejectWithValue }) => {
  try {
    await axiosInstance.put(`/events/${id}`, payload);
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to update event.'));
  }
});

export const fetchOrganizerEvents = createAsyncThunk('organizer/fetchEvents', async ({ statusFilter = 'ALL', sortFilter = 'startTime,desc', size = 500 } = {}, { rejectWithValue }) => {
  try {
    let query = `/events?size=${size}&sort=${sortFilter}`;
    if (statusFilter !== 'ALL') query += `&status=${statusFilter}`;
    const [eventsRes, reportsRes] = await Promise.all([
      axiosInstance.get(query),
      axiosInstance.get('/reports/events?size=500').catch(() => ({ data: { content: [] } }))
    ]);
    const reportsMap = {};
    (reportsRes.data?.content || []).forEach(r => { reportsMap[r.eventId] = r; });
    return { events: eventsRes.data.content || [], eventReports: reportsMap };
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to load events.'));
  }
});

export const updateOrganizerEventStatus = createAsyncThunk('organizer/updateEventStatus', async ({ id, status }, { rejectWithValue }) => {
  try {
    await axiosInstance.patch(`/events/${id}/status`, { status });
    return { id, status };
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to update event status.'));
  }
});

export const fetchOrganizerHub = createAsyncThunk('organizer/fetchHub', async (eventId, { rejectWithValue }) => {
  try {
    const [partsRes, ticketsRes, feedbacksRes, reportRes] = await Promise.all([
      axiosInstance.get(`/events/${eventId}/participants?size=200`).catch(() => ({ data: { content: [] } })),
      axiosInstance.get(`/events/${eventId}/tickets`).catch(() => ({ data: [] })),
      axiosInstance.get(`/events/${eventId}/feedbacks?size=100`).catch(() => ({ data: { content: [] } })),
      axiosInstance.get(`/reports/events/${eventId}`).catch(() => ({ data: null })),
    ]);
    return {
      participants: partsRes.data?.content || (Array.isArray(partsRes.data) ? partsRes.data : []),
      tickets: Array.isArray(ticketsRes.data) ? ticketsRes.data : (ticketsRes.data?.content || []),
      feedbacks: feedbacksRes.data?.content || (Array.isArray(feedbacksRes.data) ? feedbacksRes.data : []),
      report: reportRes.data,
    };
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Some event data could not be loaded.'));
  }
});

export const sendOrganizerAnnouncement = createAsyncThunk('organizer/sendAnnouncement', async ({ eventId, subject, message }, { rejectWithValue }) => {
  try {
    await axiosInstance.post(`/events/${eventId}/notifications`, { subject, message, isSystem: false });
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to send the update. Please try again.'));
  }
});

export const checkInOrganizerParticipant = createAsyncThunk('organizer/checkInParticipant', async (participantId, { rejectWithValue }) => {
  try {
    await axiosInstance.patch(`/participants/${participantId}/status`, { status: 'CHECKED_IN' });
    return participantId;
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Check-in failed. Please try again.'));
  }
});

export const fetchOrganizerTicketsEvents = createAsyncThunk('organizer/fetchTicketEvents', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/events?size=200&sort=startTime,desc');
    return res.data?.content || [];
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to load events.'));
  }
});

export const fetchOrganizerTickets = createAsyncThunk('organizer/fetchTickets', async (eventId, { rejectWithValue }) => {
  try {
    if (!eventId) return [];
    const res = await axiosInstance.get(`/events/${eventId}/tickets`);
    return res.data || [];
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to load tickets.'));
  }
});

export const saveOrganizerTicket = createAsyncThunk('organizer/saveTicket', async ({ eventId, editingTicket, form, quantityLocked = false }, { rejectWithValue }) => {
  try {
    if (editingTicket) {
      const res = await axiosInstance.put(`/tickets/${editingTicket.id}`, {
        name: form.name || editingTicket.name,
        price: Number(form.price),
        totalQuantity: quantityLocked ? Number(editingTicket.totalQuantity) : Number(form.totalQuantity),
        saleStartTime: form.saleStartTime,
        saleEndTime: form.saleEndTime,
      });
      return res.data;
    }
    const res = await axiosInstance.post(`/events/${eventId}/tickets`, {
      name: form.name,
      price: Number(form.price),
      totalQuantity: Number(form.totalQuantity),
      saleStartTime: form.saleStartTime,
      saleEndTime: form.saleEndTime,
    });
    return res.data;
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to save ticket.'));
  }
});

export const updateOrganizerTicketStatus = createAsyncThunk('organizer/updateTicketStatus', async (item, { rejectWithValue }) => {
  try {
    const nextStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const res = await axiosInstance.patch(`/tickets/${item.id}/status`, { status: nextStatus });
    return res.data;
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to update ticket status.'));
  }
});

export const fetchOrganizerParticipantsEvents = createAsyncThunk('organizer/fetchParticipantsEvents', async (_, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.get('/events?size=100&sort=startTime,desc');
    return data.content || [];
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to load events'));
  }
});

export const fetchOrganizerParticipants = createAsyncThunk('organizer/fetchParticipants', async (eventId, { rejectWithValue }) => {
  try {
    if (!eventId) return [];
    const { data } = await axiosInstance.get(`/events/${eventId}/participants?size=500`);
    return data.content || [];
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to load participants'));
  }
});

export const fetchOrganizerReviewsEvents = createAsyncThunk('organizer/fetchReviewEvents', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/reports/events?size=200');
    return res.data?.content || [];
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to load events.'));
  }
});

export const fetchOrganizerReviews = createAsyncThunk('organizer/fetchReviews', async (eventId, { rejectWithValue }) => {
  try {
    if (!eventId) return [];
    const res = await axiosInstance.get(`/events/${eventId}/feedbacks?size=100`);
    return res.data?.content || [];
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to load reviews.'));
  }
});

export const fetchOrganizerReports = createAsyncThunk('organizer/fetchReports', async (_, { rejectWithValue }) => {
  try {
    const [summaryRes, reportsRes] = await Promise.all([
      axiosInstance.get('/reports/summary'),
      axiosInstance.get('/reports/events?size=500'),
    ]);
    return { summary: summaryRes.data || {}, items: reportsRes.data?.content || [] };
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to load reports.'));
  }
});

export const fetchOrganizerReportDetails = createAsyncThunk('organizer/fetchReportDetails', async (eventId, { rejectWithValue }) => {
  try {
    const [reportRes, revenueRes, ticketsRes] = await Promise.all([
      axiosInstance.get(`/reports/events/${eventId}`),
      axiosInstance.get(`/reports/events/${eventId}/revenue`),
      axiosInstance.get(`/reports/events/${eventId}/tickets`),
    ]);
    return { report: reportRes.data, revenue: revenueRes.data, tickets: ticketsRes.data || [] };
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to load event report.'));
  }
});

export const fetchOrganizerPayments = createAsyncThunk('organizer/fetchPayments', async (period, { rejectWithValue }) => {
  try {
    const { fromStr, toStr, groupBy } = dateRange(period);
    const [eventsRes, revenueRes] = await Promise.all([
      axiosInstance.get('/reports/events?size=500'),
      axiosInstance.get(`/reports/revenue?from=${fromStr}&to=${toStr}&groupBy=${groupBy}`).catch(() => ({ data: [] })),
    ]);
    return {
      items: eventsRes.data?.content || [],
      revenuePoints: (revenueRes.data || []).map(p => ({
        name: p.period || 'Unknown',
        revenue: Number(p.revenue || 0),
        tickets: Number(p.registrations || 0),
      })),
    };
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to load financial data.'));
  }
});

export const fetchOrganizerNotifications = createAsyncThunk('organizer/fetchNotifications', async (_, { rejectWithValue }) => {
  try {
    const notificationsRes = await axiosInstance.get('/notifications?size=200');
    const allNotifs = notificationsRes.data?.content || [];
    return {
      inbox: allNotifs.filter(n => n.isSystem !== false),
      sent: allNotifs.filter(n => n.isSystem === false),
    };
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to load notification center.'));
  }
});

export const markOrganizerNotificationRead = createAsyncThunk('organizer/markNotificationRead', async (id, { rejectWithValue }) => {
  try {
    await axiosInstance.patch(`/notifications/${id}/status`, { isRead: true });
    return id;
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to mark notification.'));
  }
});

export const markAllOrganizerNotificationsRead = createAsyncThunk('organizer/markAllNotificationsRead', async (ids, { rejectWithValue }) => {
  try {
    await Promise.all(ids.map(id => axiosInstance.patch(`/notifications/${id}/status`, { isRead: true }).catch(() => {})));
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Some notifications could not be marked.'));
  }
});

export const fetchOrganizerProfile = createAsyncThunk('organizer/fetchProfile', async (userId, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.get(`/users/${userId}/organizer-profile`);
    return data;
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to load organization profile.'));
  }
});

export const updateOrganizerProfile = createAsyncThunk('organizer/updateProfile', async ({ userId, editData, confirmPassword }, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.put(`/users/${userId}/organizer-profile`, {
      ...editData,
      currentPassword: confirmPassword,
    });
    return data;
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to save. Check your password.'));
  }
});

const organizerSlice = createSlice({
  name: 'organizer',
  initialState: {
    overview: {
      stats: { totalRevenue: 0, totalTickets: 0, totalEvents: 0, avgAttendance: 0 },
      recentEvents: [],
      chartData: [],
      notifications: [],
      unreadCount: 0,
      chartError: false,
    },
    categories: [],
    venues: [],
    events: [],
    eventReports: {},
    hubData: { participants: [], tickets: [], feedbacks: [], report: null },
    ticketEvents: [],
    tickets: [],
    participantEvents: [],
    participants: [],
    reviewEvents: [],
    reviews: [],
    reportsSummary: {},
    reportsItems: [],
    selectedReport: null,
    selectedRevenue: null,
    selectedTickets: [],
    paymentItems: [],
    revenuePoints: [],
    inbox: [],
    sent: [],
    profile: null,
    loading: false,
    chartLoading: false,
    hubLoading: false,
    ticketLoading: false,
    participantLoading: false,
    modalLoading: false,
    saving: false,
    error: null,
  },
  reducers: {
    clearOrganizerReportModal(state) {
      state.selectedReport = null;
      state.selectedRevenue = null;
      state.selectedTickets = [];
    },
    setOrganizerHubData(state, action) {
      state.hubData = action.payload;
    },
  },
  extraReducers: (builder) => {
    const pending = (state) => { state.loading = true; state.error = null; };
    const rejected = (state, action) => { state.loading = false; state.saving = false; state.error = action.payload; };
    const savePending = (state) => { state.saving = true; state.error = null; };
    const saveRejected = (state, action) => { state.saving = false; state.error = action.payload; };
    builder
      .addCase(fetchOrganizerOverview.pending, pending)
      .addCase(fetchOrganizerOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.overview = { ...state.overview, ...action.payload };
      })
      .addCase(fetchOrganizerOverview.rejected, rejected)
      .addCase(fetchOrganizerRevenueChart.pending, (state) => { state.chartLoading = true; state.overview.chartError = false; })
      .addCase(fetchOrganizerRevenueChart.fulfilled, (state, action) => {
        state.chartLoading = false;
        state.overview.chartData = action.payload.points;
        if (action.payload.period !== 'ALL' && action.payload.points.length > 0) {
          state.overview.stats.totalRevenue = action.payload.periodStats.totalRevenue;
          state.overview.stats.totalTickets = action.payload.periodStats.totalTickets;
        }
      })
      .addCase(fetchOrganizerRevenueChart.rejected, (state) => {
        state.chartLoading = false;
        state.overview.chartError = true;
        state.overview.chartData = [];
      })
      .addCase(fetchOrganizerMetadata.fulfilled, (state, action) => {
        state.categories = action.payload.categories;
        state.venues = action.payload.venues;
      })
      .addCase(fetchOrganizerEditEvent.pending, pending)
      .addCase(fetchOrganizerEditEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload.categories;
        state.venues = action.payload.venues;
        state.tickets = action.payload.tickets;
      })
      .addCase(fetchOrganizerEditEvent.rejected, rejected)
      .addCase(createOrganizerEvent.pending, savePending)
      .addCase(createOrganizerEvent.fulfilled, (state) => { state.saving = false; })
      .addCase(createOrganizerEvent.rejected, saveRejected)
      .addCase(updateOrganizerEvent.pending, savePending)
      .addCase(updateOrganizerEvent.fulfilled, (state) => { state.saving = false; })
      .addCase(updateOrganizerEvent.rejected, saveRejected)
      .addCase(fetchOrganizerEvents.pending, pending)
      .addCase(fetchOrganizerEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload.events;
        state.eventReports = action.payload.eventReports;
      })
      .addCase(fetchOrganizerEvents.rejected, rejected)
      .addCase(updateOrganizerEventStatus.pending, savePending)
      .addCase(updateOrganizerEventStatus.fulfilled, (state, action) => {
        state.saving = false;
        state.events = state.events.map(e => e.id === action.payload.id ? { ...e, status: action.payload.status } : e);
      })
      .addCase(updateOrganizerEventStatus.rejected, saveRejected)
      .addCase(fetchOrganizerHub.pending, (state) => { state.hubLoading = true; state.error = null; })
      .addCase(fetchOrganizerHub.fulfilled, (state, action) => {
        state.hubLoading = false;
        state.hubData = action.payload;
      })
      .addCase(fetchOrganizerHub.rejected, (state, action) => { state.hubLoading = false; state.error = action.payload; })
      .addCase(sendOrganizerAnnouncement.pending, savePending)
      .addCase(sendOrganizerAnnouncement.fulfilled, (state) => { state.saving = false; })
      .addCase(sendOrganizerAnnouncement.rejected, saveRejected)
      .addCase(checkInOrganizerParticipant.pending, savePending)
      .addCase(checkInOrganizerParticipant.fulfilled, (state, action) => {
        state.saving = false;
        state.participants = state.participants.map(p => p.id === action.payload ? { ...p, status: 'CHECKED_IN' } : p);
        state.hubData.participants = state.hubData.participants.map(p => p.id === action.payload ? { ...p, status: 'CHECKED_IN' } : p);
      })
      .addCase(checkInOrganizerParticipant.rejected, saveRejected)
      .addCase(fetchOrganizerTicketsEvents.pending, pending)
      .addCase(fetchOrganizerTicketsEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.ticketEvents = action.payload;
      })
      .addCase(fetchOrganizerTicketsEvents.rejected, rejected)
      .addCase(fetchOrganizerTickets.pending, (state) => { state.ticketLoading = true; state.error = null; })
      .addCase(fetchOrganizerTickets.fulfilled, (state, action) => {
        state.ticketLoading = false;
        state.tickets = action.payload;
      })
      .addCase(fetchOrganizerTickets.rejected, (state, action) => { state.ticketLoading = false; state.error = action.payload; })
      .addCase(saveOrganizerTicket.pending, savePending)
      .addCase(saveOrganizerTicket.fulfilled, (state, action) => {
        state.saving = false;
        const exists = state.tickets.some(t => t.id === action.payload.id);
        state.tickets = exists ? state.tickets.map(t => t.id === action.payload.id ? action.payload : t) : [...state.tickets, action.payload];
        const hubExists = state.hubData.tickets.some(t => t.id === action.payload.id);
        state.hubData.tickets = hubExists ? state.hubData.tickets.map(t => t.id === action.payload.id ? action.payload : t) : [...state.hubData.tickets, action.payload];
      })
      .addCase(saveOrganizerTicket.rejected, saveRejected)
      .addCase(updateOrganizerTicketStatus.pending, savePending)
      .addCase(updateOrganizerTicketStatus.fulfilled, (state, action) => {
        state.saving = false;
        state.tickets = state.tickets.map(t => t.id === action.payload.id ? action.payload : t);
        state.hubData.tickets = state.hubData.tickets.map(t => t.id === action.payload.id ? action.payload : t);
      })
      .addCase(updateOrganizerTicketStatus.rejected, saveRejected)
      .addCase(fetchOrganizerParticipantsEvents.pending, pending)
      .addCase(fetchOrganizerParticipantsEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.participantEvents = action.payload;
      })
      .addCase(fetchOrganizerParticipantsEvents.rejected, rejected)
      .addCase(fetchOrganizerParticipants.pending, (state) => { state.participantLoading = true; state.error = null; })
      .addCase(fetchOrganizerParticipants.fulfilled, (state, action) => {
        state.participantLoading = false;
        state.participants = action.payload;
      })
      .addCase(fetchOrganizerParticipants.rejected, (state, action) => { state.participantLoading = false; state.participants = []; state.error = action.payload; })
      .addCase(fetchOrganizerReviewsEvents.pending, pending)
      .addCase(fetchOrganizerReviewsEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.reviewEvents = action.payload;
      })
      .addCase(fetchOrganizerReviewsEvents.rejected, rejected)
      .addCase(fetchOrganizerReviews.pending, pending)
      .addCase(fetchOrganizerReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload;
      })
      .addCase(fetchOrganizerReviews.rejected, rejected)
      .addCase(fetchOrganizerReports.pending, pending)
      .addCase(fetchOrganizerReports.fulfilled, (state, action) => {
        state.loading = false;
        state.reportsSummary = action.payload.summary;
        state.reportsItems = action.payload.items;
      })
      .addCase(fetchOrganizerReports.rejected, rejected)
      .addCase(fetchOrganizerReportDetails.pending, (state) => { state.modalLoading = true; state.error = null; })
      .addCase(fetchOrganizerReportDetails.fulfilled, (state, action) => {
        state.modalLoading = false;
        state.selectedReport = action.payload.report;
        state.selectedRevenue = action.payload.revenue;
        state.selectedTickets = action.payload.tickets;
      })
      .addCase(fetchOrganizerReportDetails.rejected, (state, action) => { state.modalLoading = false; state.error = action.payload; })
      .addCase(fetchOrganizerPayments.pending, pending)
      .addCase(fetchOrganizerPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentItems = action.payload.items;
        state.revenuePoints = action.payload.revenuePoints;
      })
      .addCase(fetchOrganizerPayments.rejected, rejected)
      .addCase(fetchOrganizerNotifications.pending, pending)
      .addCase(fetchOrganizerNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.inbox = action.payload.inbox;
        state.sent = action.payload.sent;
      })
      .addCase(fetchOrganizerNotifications.rejected, rejected)
      .addCase(markOrganizerNotificationRead.fulfilled, (state, action) => {
        state.inbox = state.inbox.map(i => i.id === action.payload ? { ...i, isRead: true } : i);
      })
      .addCase(markAllOrganizerNotificationsRead.pending, savePending)
      .addCase(markAllOrganizerNotificationsRead.fulfilled, (state) => {
        state.saving = false;
        state.inbox = state.inbox.map(i => ({ ...i, isRead: true }));
      })
      .addCase(markAllOrganizerNotificationsRead.rejected, saveRejected)
      .addCase(fetchOrganizerProfile.pending, pending)
      .addCase(fetchOrganizerProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchOrganizerProfile.rejected, rejected)
      .addCase(updateOrganizerProfile.pending, savePending)
      .addCase(updateOrganizerProfile.fulfilled, (state, action) => {
        state.saving = false;
        state.profile = action.payload;
      })
      .addCase(updateOrganizerProfile.rejected, saveRejected);
  },
});

export const { clearOrganizerReportModal, setOrganizerHubData } = organizerSlice.actions;
export default organizerSlice.reducer;
