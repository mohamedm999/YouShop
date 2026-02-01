import axios from 'axios';

// Create an Axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  withCredentials: true, // Important for cookies (refresh token)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach access token if available
api.interceptors.request.use(
  (config) => {
    // We will handle token injection via the store or local storage if needed.
    // However, usually referencing the store directly here can be circular or tricky outside components.
    // A common pattern is to just let the store handle setting the header, or read from localStorage.
    // For now, let's assume the auth store will configure the header or we read from localStorage.
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for 401 handling (Refresh Token Flow)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call refresh endpoint
        // Note: The backend expects the refresh token in an HTTP-only cookie
        await api.post('/auth/refresh');
        
        // If successful, the new refresh token is set in cookie automatically.
        // If the backend also returns a new access token, we needs to grab it.
        // But wait, the refresh endpoint in backend returns { accessToken, user }.
        // We need to capture that response to update the local access token.
        
        // Firing a pure fetch to avoid infinite loop if this api instance is used
        const refreshResponse = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data.data.accessToken;
        
        // Update local storage
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', newAccessToken);
        }
        
        // Update header for the retry
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
