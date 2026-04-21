import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../../lib/axios';
import { clearAuthTokens, getAccessToken, setAuthTokens } from '../services/authStorage';

const getValidToken = () => {
  return getAccessToken();
};

const buildUserWithOrganizerStatus = async (data) => {
  const user = {
    id: data.id,
    fullName: data.fullName,
    email: data.email,
    role: data.role,
  };

  if (data.role === 'ORGANIZER') {
    try {
      const profileRes = await axiosInstance.get(`/users/${data.id}/organizer-profile`);
      user.verified = profileRes.data?.verified ?? false;
    } catch {
      user.verified = false;
    }
  }

  return user;
};

export const fetchCurrentUser = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.get('/users/me');
    return await buildUserWithOrganizerStatus(data);
  } catch {
    return rejectWithValue('Session expired');
  }
});

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.post('/auth/login', credentials);
    setAuthTokens(data.accessToken, data.refreshToken);
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: await buildUserWithOrganizerStatus(data),
    };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const registerUser = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.post('/auth/register', userData);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const sendOtp = createAsyncThunk('auth/sendOtp', async (identifier, { rejectWithValue }) => {
  try {
    await axiosInstance.post('/auth/send-otp', { identifier });
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to send OTP');
  }
});

export const verifyOtp = createAsyncThunk('auth/verifyOtp', async ({ identifier, otp }, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.post('/auth/verify-otp', { identifier, otp });
    setAuthTokens(data.accessToken, data.refreshToken);
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: await buildUserWithOrganizerStatus(data),
    };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Invalid OTP');
  }
});

export const logoutUser = createAsyncThunk('auth/logoutUser', async (_, { rejectWithValue }) => {
  try {
    await axiosInstance.post('/auth/logout');
    clearAuthTokens();
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Logout failed');
  }
});

const validToken = getValidToken();

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: validToken,
    loading: false,
    otpSent: false,
    error: null,
    registerSuccess: false,
    initialized: !validToken,
  },
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearRegisterSuccess(state) {
      state.registerSuccess = false;
    },
    resetOtp(state) {
      state.otpSent = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.initialized = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.initialized = true;
        clearAuthTokens();
      })
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.accessToken;
        state.user = action.payload.user;
        state.initialized = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.registerSuccess = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(sendOtp.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(sendOtp.fulfilled, (state) => {
        state.loading = false;
        state.otpSent = true;
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(verifyOtp.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.accessToken;
        state.user = action.payload.user;
        state.initialized = true;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.otpSent = false;
        state.initialized = true;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.otpSent = false;
        state.initialized = true;
        clearAuthTokens();
      });
  },
});

export const { clearError, clearRegisterSuccess, resetOtp } = authSlice.actions;
export default authSlice.reducer;
