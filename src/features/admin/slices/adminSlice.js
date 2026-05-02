import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../../lib/axios';

const getMessage = (err, fallback) => err.response?.data?.message || fallback;

export const fetchAdminCounts = createAsyncThunk('admin/fetchCounts', async () => {
  try {
    const [organizersRes, eventsRes, notificationsRes] = await Promise.all([
      axiosInstance.get('/organizer-profiles?status=PENDING&size=1'),
      axiosInstance.get('/events?status=PENDING_APPROVAL&size=1'),
      axiosInstance.get('/notifications/unread-count'),
    ]);
    return {
      organizerApprovals: organizersRes.data?.totalElements || 0,
      eventApprovals: eventsRes.data?.totalElements || 0,
      notifications: notificationsRes.data?.unreadCount || 0,
    };
  } catch {
    return { organizerApprovals: 0, eventApprovals: 0, notifications: 0 };
  }
});

export const fetchAdminOverview = createAsyncThunk('admin/fetchOverview', async (_, { rejectWithValue }) => {
  try {
    const [summaryRes, eventsRes, paymentsRes, organizersRes, revenueRes] = await Promise.all([
      axiosInstance.get('/reports/summary'),
      axiosInstance.get('/reports/events?size=5'),
      axiosInstance.get('/payments?size=5'),
      axiosInstance.get('/organizer-profiles?status=PENDING&size=5'),
      axiosInstance.get('/reports/revenue?groupBy=month'),
    ]);
    return {
      summary: summaryRes.data,
      recentEvents: eventsRes.data.content || [],
      recentPayments: paymentsRes.data.content || [],
      pendingOrganizers: organizersRes.data.content || [],
      revenueData: revenueRes.data || [],
    };
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to load dashboard.'));
  }
});

export const fetchAdminReports = createAsyncThunk('admin/fetchReports', async (timeRange, { rejectWithValue }) => {
  try {
    const now = new Date();
    let from = new Date();
    let groupBy = 'month';

    if (timeRange === '7d') { from.setDate(now.getDate() - 7); groupBy = 'day'; }
    else if (timeRange === '30d') { from.setDate(now.getDate() - 30); groupBy = 'day'; }
    else if (timeRange === '6m') { from.setMonth(now.getMonth() - 6); groupBy = 'month'; }
    else { from.setFullYear(now.getFullYear() - 1); groupBy = 'month'; }

    const fromStr = from.toISOString().split('T')[0];
    const toStr = now.toISOString().split('T')[0];

    const [summaryRes, revenueRes, organizerRes, eventsRes] = await Promise.all([
      axiosInstance.get('/reports/summary'),
      axiosInstance.get(`/reports/revenue?from=${fromStr}&to=${toStr}&groupBy=${groupBy}`),
      axiosInstance.get('/reports/organizers?size=100'),
      axiosInstance.get('/events?size=500')
    ]);

    const catMap = {};
    (eventsRes.data.content || []).forEach(e => {
      const cat = e.categoryName || 'Uncategorized';
      catMap[cat] = (catMap[cat] || 0) + 1;
    });

    return {
      summary: summaryRes.data,
      revenue: revenueRes.data || [],
      organizers: organizerRes.data.content || [],
      categoryData: Object.entries(catMap).map(([name, value]) => ({ name, value })),
    };
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to load reports.'));
  }
});

export const fetchAdminCategories = createAsyncThunk('admin/fetchCategories', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/categories');
    return res.data || [];
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to load categories.'));
  }
});

export const saveAdminCategory = createAsyncThunk('admin/saveCategory', async ({ editingItem, form }, { rejectWithValue }) => {
  try {
    if (editingItem) {
      await axiosInstance.put(`/categories/${editingItem.id}`, { categoryName: form.categoryName.trim() });
      return 'Category updated.';
    }
    await axiosInstance.post('/categories', { categoryName: form.categoryName.trim() });
    return 'Category created.';
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Operation failed.'));
  }
});

export const updateAdminCategoryStatus = createAsyncThunk('admin/updateCategoryStatus', async (item, { rejectWithValue }) => {
  try {
    const nextStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await axiosInstance.patch(`/categories/${item.id}/status`, { status: nextStatus });
    return `Category status updated to ${nextStatus}.`;
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Status update failed.'));
  }
});

export const fetchAdminVenues = createAsyncThunk('admin/fetchVenues', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/venues');
    return res.data || [];
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to load venues.'));
  }
});

export const saveAdminVenue = createAsyncThunk('admin/saveVenue', async ({ editingItem, payload }, { rejectWithValue }) => {
  try {
    if (editingItem) {
      await axiosInstance.put(`/venues/${editingItem.id}`, payload);
      return 'Venue updated successfully.';
    }
    await axiosInstance.post('/venues', payload);
    return 'Venue created successfully.';
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Unable to save venue.'));
  }
});

export const updateAdminVenueStatus = createAsyncThunk('admin/updateVenueStatus', async (item, { rejectWithValue }) => {
  try {
    const nextStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await axiosInstance.patch(`/venues/${item.id}/status`, { status: nextStatus });
    return `Venue marked as ${nextStatus.toLowerCase()}.`;
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Unable to update venue status.'));
  }
});

export const fetchAdminUsers = createAsyncThunk('admin/fetchUsers', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/users?size=200');
    return res.data.content || [];
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to load users.'));
  }
});

export const updateAdminUserStatus = createAsyncThunk('admin/updateUserStatus', async ({ userId, status }, { rejectWithValue }) => {
  try {
    await axiosInstance.patch(`/users/${userId}/status`, { status });
    return `User status updated to ${status}.`;
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Update failed.'));
  }
});

export const fetchAdminPayments = createAsyncThunk('admin/fetchPayments', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/payments?size=200');
    return res.data.content || [];
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to load payments.'));
  }
});

export const fetchAdminEventsStats = createAsyncThunk('admin/fetchEventsStats', async () => {
  const [summaryRes, pendingRes, cancelledRes] = await Promise.all([
    axiosInstance.get('/reports/summary').catch(() => ({ data: {} })),
    axiosInstance.get('/events?status=PENDING_APPROVAL&size=1').catch(() => ({ data: { totalElements: 0 } })),
    axiosInstance.get('/events?status=CANCELLED&size=1').catch(() => ({ data: { totalElements: 0 } }))
  ]);
  const summary = summaryRes.data || {};
  return {
    total: summary.totalEvents || 0,
    published: summary.publishedEvents || 0,
    pending: pendingRes.data?.totalElements || 0,
    cancelled: cancelledRes.data?.totalElements || 0
  };
});

export const fetchAdminEvents = createAsyncThunk('admin/fetchEvents', async ({ statusFilter, sortBy }, { rejectWithValue }) => {
  try {
    let sortParam = 'startTime,desc';
    if (sortBy === 'oldest') sortParam = 'startTime,asc';
    else if (sortBy === 'title-asc') sortParam = 'title,asc';
    else if (sortBy === 'status') sortParam = 'status,asc';

    let query = `/events?size=200&sort=${sortParam}`;
    if (statusFilter !== 'ALL') query += `&status=${statusFilter}`;

    const res = await axiosInstance.get(query);
    return res.data.content || [];
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to load events.'));
  }
});

export const fetchAdminEventDetails = createAsyncThunk('admin/fetchEventDetails', async ({ id, statusFilter }, { rejectWithValue }) => {
  try {
    const [res, ticketRes] = await Promise.all([
      axiosInstance.get(`/events/${id}`),
      axiosInstance.get(`/events/${id}/tickets`).catch(() => ({ data: [] })),
    ]);
    return {
      event: { ...res.data, status: res.data.status || statusFilter },
      tickets: ticketRes.data || [],
    };
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Could not load event details.'));
  }
});

export const updateAdminEventStatus = createAsyncThunk('admin/updateEventStatus', async ({ id, status }, { rejectWithValue }) => {
  try {
    await axiosInstance.patch(`/events/${id}/status`, { status });
    return `Event marked as ${status}.`;
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to update status'));
  }
});

export const fetchAdminOrganizerApprovals = createAsyncThunk('admin/fetchOrganizerApprovals', async (statusFilter, { rejectWithValue }) => {
  try {
    const query = statusFilter === 'ALL' ? '/organizer-profiles?size=200' : `/organizer-profiles?status=${statusFilter}&size=200`;
    const res = await axiosInstance.get(query);
    return res.data.content || [];
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to load requests.'));
  }
});

export const fetchAdminPendingOrganizerCount = createAsyncThunk('admin/fetchPendingOrganizerCount', async () => {
  try {
    const res = await axiosInstance.get('/organizer-profiles?status=PENDING&size=1');
    return res.data.totalElements || 0;
  } catch {
    return 0;
  }
});

export const updateAdminOrganizerStatus = createAsyncThunk('admin/updateOrganizerStatus', async ({ id, status }, { rejectWithValue }) => {
  try {
    await axiosInstance.patch(`/organizer-profiles/${id}/status`, { status });
    return `Organizer marked as ${status}.`;
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Update failed.'));
  }
});

export const fetchAdminOfferEvents = createAsyncThunk('admin/fetchOfferEvents', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/events?size=200');
    const now = new Date();
    return (res.data.content || []).filter(e => new Date(e.endTime || e.startTime) > now);
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to load events.'));
  }
});

export const fetchAdminOffers = createAsyncThunk('admin/fetchOffers', async (eventId, { rejectWithValue }) => {
  try {
    if (!eventId) return [];
    const res = await axiosInstance.get(`/events/${eventId}/offers`);
    return res.data || [];
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to load offers.'));
  }
});

export const saveAdminOffer = createAsyncThunk('admin/saveOffer', async ({ eventId, editingItem, form }, { rejectWithValue }) => {
  try {
    if (editingItem) {
      await axiosInstance.put(`/offers/${editingItem.id}`, {
        validFrom: form.validFrom,
        validTo: form.validTo,
        totalUsageLimit: form.totalUsageLimit ? Number(form.totalUsageLimit) : null,
      });
      return 'Offer updated successfully.';
    }
    await axiosInstance.post(`/events/${eventId}/offers`, {
      code: form.code.trim(),
      discountPercentage: Number(form.discountPercentage),
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
      validFrom: form.validFrom,
      validTo: form.validTo,
      totalUsageLimit: form.totalUsageLimit ? Number(form.totalUsageLimit) : null,
    });
    return 'Offer created successfully.';
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Unable to save offer.'));
  }
});

export const updateAdminOfferStatus = createAsyncThunk('admin/updateOfferStatus', async ({ item, status }, { rejectWithValue }) => {
  try {
    await axiosInstance.patch(`/offers/${item.id}/status`, { status });
    return `Offer marked as ${status}.`;
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Unable to update offer status.'));
  }
});

export const fetchAdminBroadcasts = createAsyncThunk('admin/fetchBroadcasts', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/notifications/broadcast-history?size=200');
    return res.data.content || [];
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to load history.'));
  }
});

export const fetchAdminInbox = createAsyncThunk('admin/fetchInbox', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/notifications?size=50');
    return res.data.content || [];
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to load inbox.'));
  }
});

export const markAdminNotificationRead = createAsyncThunk('admin/markNotificationRead', async (id, { rejectWithValue }) => {
  try {
    await axiosInstance.patch(`/notifications/${id}/status`, { isRead: true });
    return id;
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to update notification.'));
  }
});

export const markAllAdminNotificationsRead = createAsyncThunk('admin/markAllNotificationsRead', async (_, { rejectWithValue }) => {
  try {
    await axiosInstance.post('/notifications/read-all');
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to update notifications.'));
  }
});

export const sendAdminBroadcast = createAsyncThunk('admin/sendBroadcast', async (form, { rejectWithValue }) => {
  try {
    await axiosInstance.post('/notifications/broadcast', {
      title: form.title.trim(),
      message: form.message.trim(),
      targetRole: form.targetRole || null,
    });
    return 'Broadcast sent.';
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Dispatch failed.'));
  }
});

export const fetchAdminTicketsEvents = createAsyncThunk('admin/fetchTicketsEvents', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/reports/events?size=200');
    return res.data.content || [];
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to load reports.'));
  }
});

export const fetchAdminTicketSales = createAsyncThunk('admin/fetchTicketSales', async (eventId, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(`/reports/events/${eventId}/tickets`);
    return res.data || [];
  } catch (err) {
    return rejectWithValue(getMessage(err, 'Failed to load ticket data.'));
  }
});

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    counts: { organizerApprovals: 0, eventApprovals: 0, notifications: 0 },
    overview: { summary: null, recentEvents: [], recentPayments: [], pendingOrganizers: [], revenueData: [] },
    reports: { summary: null, revenue: [], organizers: [], categoryData: [] },
    categories: [],
    venues: [],
    users: [],
    payments: [],
    events: [],
    eventsStats: { total: 0, published: 0, pending: 0, cancelled: 0 },
    selectedEvent: null,
    selectedTickets: [],
    organizerApprovals: [],
    pendingOrganizerCount: 0,
    offerEvents: [],
    offers: [],
    broadcasts: [],
    inbox: [],
    ticketsEvents: [],
    ticketSales: [],
    loading: false,
    detailLoading: false,
    saving: false,
    message: '',
    messageType: 'success',
    error: null,
  },
  reducers: {
    clearAdminMessage(state) {
      state.message = '';
      state.error = null;
    },
    clearAdminSelectedEvent(state) {
      state.selectedEvent = null;
      state.selectedTickets = [];
    },
    clearAdminOffers(state) {
      state.offers = [];
    },
  },
  extraReducers: (builder) => {
    const pending = (state) => { state.loading = true; state.error = null; };
    const rejected = (state, action) => {
      state.loading = false;
      state.saving = false;
      state.detailLoading = false;
      state.error = action.payload;
      state.message = action.payload || '';
      state.messageType = 'error';
    };
    const savePending = (state) => { state.saving = true; state.error = null; };
    const saveFulfilled = (state, action) => {
      state.saving = false;
      state.message = action.payload || '';
      state.messageType = 'success';
    };

    builder
      .addCase(fetchAdminCounts.fulfilled, (state, action) => { state.counts = action.payload; })
      .addCase(fetchAdminOverview.pending, pending)
      .addCase(fetchAdminOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.overview = action.payload;
      })
      .addCase(fetchAdminOverview.rejected, rejected)
      .addCase(fetchAdminReports.pending, pending)
      .addCase(fetchAdminReports.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = action.payload;
      })
      .addCase(fetchAdminReports.rejected, rejected)
      .addCase(fetchAdminCategories.pending, pending)
      .addCase(fetchAdminCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchAdminCategories.rejected, rejected)
      .addCase(saveAdminCategory.pending, savePending)
      .addCase(saveAdminCategory.fulfilled, saveFulfilled)
      .addCase(saveAdminCategory.rejected, rejected)
      .addCase(updateAdminCategoryStatus.pending, savePending)
      .addCase(updateAdminCategoryStatus.fulfilled, saveFulfilled)
      .addCase(updateAdminCategoryStatus.rejected, rejected)
      .addCase(fetchAdminVenues.pending, pending)
      .addCase(fetchAdminVenues.fulfilled, (state, action) => {
        state.loading = false;
        state.venues = action.payload;
      })
      .addCase(fetchAdminVenues.rejected, rejected)
      .addCase(saveAdminVenue.pending, savePending)
      .addCase(saveAdminVenue.fulfilled, saveFulfilled)
      .addCase(saveAdminVenue.rejected, rejected)
      .addCase(updateAdminVenueStatus.pending, savePending)
      .addCase(updateAdminVenueStatus.fulfilled, saveFulfilled)
      .addCase(updateAdminVenueStatus.rejected, rejected)
      .addCase(fetchAdminUsers.pending, pending)
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchAdminUsers.rejected, rejected)
      .addCase(updateAdminUserStatus.pending, savePending)
      .addCase(updateAdminUserStatus.fulfilled, saveFulfilled)
      .addCase(updateAdminUserStatus.rejected, rejected)
      .addCase(fetchAdminPayments.pending, pending)
      .addCase(fetchAdminPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload;
      })
      .addCase(fetchAdminPayments.rejected, rejected)
      .addCase(fetchAdminEventsStats.fulfilled, (state, action) => { state.eventsStats = action.payload; })
      .addCase(fetchAdminEvents.pending, pending)
      .addCase(fetchAdminEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload;
      })
      .addCase(fetchAdminEvents.rejected, rejected)
      .addCase(fetchAdminEventDetails.pending, (state) => { state.detailLoading = true; state.error = null; })
      .addCase(fetchAdminEventDetails.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedEvent = action.payload.event;
        state.selectedTickets = action.payload.tickets;
      })
      .addCase(fetchAdminEventDetails.rejected, rejected)
      .addCase(updateAdminEventStatus.pending, savePending)
      .addCase(updateAdminEventStatus.fulfilled, saveFulfilled)
      .addCase(updateAdminEventStatus.rejected, rejected)
      .addCase(fetchAdminOrganizerApprovals.pending, pending)
      .addCase(fetchAdminOrganizerApprovals.fulfilled, (state, action) => {
        state.loading = false;
        state.organizerApprovals = action.payload;
      })
      .addCase(fetchAdminOrganizerApprovals.rejected, rejected)
      .addCase(fetchAdminPendingOrganizerCount.fulfilled, (state, action) => { state.pendingOrganizerCount = action.payload; })
      .addCase(updateAdminOrganizerStatus.pending, savePending)
      .addCase(updateAdminOrganizerStatus.fulfilled, saveFulfilled)
      .addCase(updateAdminOrganizerStatus.rejected, rejected)
      .addCase(fetchAdminOfferEvents.pending, pending)
      .addCase(fetchAdminOfferEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.offerEvents = action.payload;
      })
      .addCase(fetchAdminOfferEvents.rejected, rejected)
      .addCase(fetchAdminOffers.pending, pending)
      .addCase(fetchAdminOffers.fulfilled, (state, action) => {
        state.loading = false;
        state.offers = action.payload;
      })
      .addCase(fetchAdminOffers.rejected, rejected)
      .addCase(saveAdminOffer.pending, savePending)
      .addCase(saveAdminOffer.fulfilled, saveFulfilled)
      .addCase(saveAdminOffer.rejected, rejected)
      .addCase(updateAdminOfferStatus.pending, savePending)
      .addCase(updateAdminOfferStatus.fulfilled, saveFulfilled)
      .addCase(updateAdminOfferStatus.rejected, rejected)
      .addCase(fetchAdminBroadcasts.pending, pending)
      .addCase(fetchAdminBroadcasts.fulfilled, (state, action) => {
        state.loading = false;
        state.broadcasts = action.payload;
      })
      .addCase(fetchAdminBroadcasts.rejected, rejected)
      .addCase(fetchAdminInbox.fulfilled, (state, action) => { state.inbox = action.payload; })
      .addCase(markAdminNotificationRead.fulfilled, (state, action) => {
        state.inbox = state.inbox.map(n => n.id === action.payload ? { ...n, read: true } : n);
      })
      .addCase(markAllAdminNotificationsRead.fulfilled, (state) => {
        state.inbox = state.inbox.map(n => ({ ...n, read: true }));
      })
      .addCase(sendAdminBroadcast.pending, savePending)
      .addCase(sendAdminBroadcast.fulfilled, saveFulfilled)
      .addCase(sendAdminBroadcast.rejected, rejected)
      .addCase(fetchAdminTicketsEvents.pending, pending)
      .addCase(fetchAdminTicketsEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.ticketsEvents = action.payload;
      })
      .addCase(fetchAdminTicketsEvents.rejected, rejected)
      .addCase(fetchAdminTicketSales.pending, (state) => { state.detailLoading = true; state.error = null; })
      .addCase(fetchAdminTicketSales.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.ticketSales = action.payload;
      })
      .addCase(fetchAdminTicketSales.rejected, (state) => {
        state.detailLoading = false;
        state.ticketSales = [];
      });
  },
});

export const { clearAdminMessage, clearAdminSelectedEvent, clearAdminOffers } = adminSlice.actions;
export default adminSlice.reducer;
