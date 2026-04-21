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

const eventsSlice = createSlice({
  name: 'events',
  initialState: {
    list: [],
    totalPages: 0,
    totalElements: 0,
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
      });
  },
});

export default eventsSlice.reducer;
