import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

export const fetchMetadata = createAsyncThunk('metadata/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const [catRes, venRes] = await Promise.all([
      axiosInstance.get('/categories'),
      axiosInstance.get('/venues')
    ]);
    return {
      categories: catRes.data,
      venues: venRes.data
    };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch metadata');
  }
});

const metadataSlice = createSlice({
  name: 'metadata',
  initialState: {
    categories: [],
    venues: [],
    loading: false,
    loaded: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMetadata.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMetadata.fulfilled, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.categories = action.payload.categories;
        state.venues = action.payload.venues;
      })
      .addCase(fetchMetadata.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default metadataSlice.reducer;
