import axios from 'axios';
import { clearAuthTokens, getAccessToken, getRefreshToken, setAuthTokens } from './authStorage';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8082/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise = null;

axiosInstance.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    const requestUrl = originalRequest?.url || '';
    const isAuthEndpoint = requestUrl.includes('/auth/');
    const isRefreshEndpoint = requestUrl.includes('/auth/refresh');

    if (err.response?.status === 401 && !isAuthEndpoint && !isRefreshEndpoint && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token available');

        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${axiosInstance.defaults.baseURL}/auth/refresh`, { refreshToken })
            .then((response) => {
              const { accessToken, refreshToken: newRefreshToken } = response.data;
              setAuthTokens(accessToken, newRefreshToken);
              return accessToken;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const accessToken = await refreshPromise;

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshErr) {
        clearAuthTokens();
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(err);
  }
);

export default axiosInstance;
