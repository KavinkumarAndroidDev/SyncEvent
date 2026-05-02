import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../../lib/axios';

export const fetchEvents = createAsyncThunk('events/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.get('/events', {
      params: { status: 'PUBLISHED', size: 12, ...params },
    });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch events');
  }
});

export const fetchEventDetail = createAsyncThunk('events/fetchDetail', async ({ id, token, user }, { rejectWithValue }) => {
  try {
    const eventRes = await axiosInstance.get(`/events/${id}`);
    let activeBooking = null;
    if (token && user?.role === 'ATTENDEE') {
      activeBooking = await axiosInstance.get(`/bookings/event/${id}/active`)
        .then(res => res.data)
        .catch(() => null);
    }
    return { event: eventRes.data, activeBooking };
  } catch {
    return rejectWithValue('Could not load event details.');
  }
});

const eventsSlice = createSlice({
  name: 'events',
  initialState: {
    list: [],
    totalPages: 0,
    totalElements: 0,
    detail: null,
    activeBooking: null,
    detailLoading: false,
    detailError: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.content || [];
        state.totalPages = action.payload.totalPages || 0;
        state.totalElements = action.payload.totalElements || 0;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchEventDetail.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
        state.detail = null;
        state.activeBooking = null;
      })
      .addCase(fetchEventDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.detail = action.payload.event;
        state.activeBooking = action.payload.activeBooking;
      })
      .addCase(fetchEventDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload;
      });
  },
});

export default eventsSlice.reducer;
