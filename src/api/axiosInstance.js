import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';
import { getToken, removeToken } from '../utils/tokenUtils';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token to every request automatically
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Only force-logout when there is genuinely no valid token.
// Spring Security can return 401 for @PreAuthorize failures even when
// the token is present — treat those as component-level errors, not logouts.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const token = getToken();
      if (!token) {
        removeToken();
        window.location.href = '/login';
      }
      // token exists → 401 is a permission/role error, not an expired session
      // let the calling component handle it via toast
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
