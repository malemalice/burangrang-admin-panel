import axios from 'axios';

// Helper functions for token management
const getAccessToken = () => localStorage.getItem('access_token');
const setAccessToken = (token: string) => localStorage.setItem('access_token', token);
const getRefreshToken = () => localStorage.getItem('refresh_token');
const setRefreshToken = (token: string) => localStorage.setItem('refresh_token', token);
const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

// Function to decode JWT token without a library dependency
const decodeJwt = (token: string): { exp?: number } | null => {
  try {
    // JWT structure: header.payload.signature
    const base64Payload = token.split('.')[1];
    const payload = JSON.parse(atob(base64Payload));
    return payload;
  } catch (e) {
    console.error('Error decoding JWT', e);
    return null;
  }
};

// Check if the token is expired or will expire soon (with 60s buffer)
const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  
  const decodedToken = decodeJwt(token);
  if (!decodedToken || !decodedToken.exp) return true;
  
  // Add a buffer time of 60 seconds before actual expiration
  const expirationTime = decodedToken.exp * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  
  // Return true if token is expired or will expire in the next 60 seconds
  return expirationTime < (currentTime + 60000);
};

// Create an axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      // Debug logging for settings requests
      if (config.url?.includes('/settings/')) {
        console.log('Sending authenticated request to:', config.url);
      }
    } else {
      // Debug logging for unauthenticated requests
      if (config.url?.includes('/settings/')) {
        console.warn('Sending UNAUTHENTICATED request to:', config.url);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token refresh and prevent infinite loops
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loops by checking if we've already retried this request
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Handle 401 errors (unauthorized) - try to refresh token
    if (error.response?.status === 401 && getRefreshToken()) {
      originalRequest._retry = true;

      try {
        // Use the refresh token to get a new access token
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/refresh`,
          { refreshToken: getRefreshToken() }
        );

        // Update tokens
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        setAccessToken(accessToken);
        setRefreshToken(newRefreshToken);

        // Update the Authorization header
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        clearTokens();
        // Clear theme loading flag so it can be retried on next login
        sessionStorage.removeItem('theme-loaded');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 errors (forbidden) - don't retry, just reject
    if (error.response?.status === 403) {
      console.warn('403 Forbidden error:', error.response.config.url);
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// Auth service
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = response.data;
    
    // Store both tokens in localStorage
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    
    return { user };
  },
  
  logout: async () => {
    try {
      // Call the server logout endpoint to invalidate the refresh token
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Always clear tokens regardless of API success
      clearTokens();
      // Clear theme loading flag for next login
      sessionStorage.removeItem('theme-loaded');
    }
  },
  
  // Check if the current access token is valid; refresh only if needed
  checkAndRefreshAuth: async (): Promise<{ user: any } | null> => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();
    
    // If no tokens, user is not authenticated
    if (!accessToken || !refreshToken) {
      return null;
    }
    
    // If access token is still valid, use it without refreshing
    if (!isTokenExpired(accessToken)) {
      try {
        // Make a lightweight request to get user info without refreshing token
        const response = await api.get('/users/me');
        
        // Ensure the role is formatted consistently before returning
        const user = response.data;
        if (user && user.role) {
          // Normalize role to string format for consistency
          if (typeof user.role === 'object' && 'name' in user.role) {
            user.role = user.role.name;
          } else if (typeof user.role !== 'string') {
            // Fallback: convert any non-string role to string
            user.role = String(user.role);
          }
        }
        
        return { user };
      } catch (error) {
        console.warn('Error validating token with /users/me endpoint:', error);
        // If there's an error (like 401), proceed to refresh the token
      }
    } else {
      console.log('Access token expired or will expire soon, refreshing...');
    }
    
    // If we got here, we need to refresh the token
    try {
      const result = await authApi.refreshToken();
      
      // Ensure role format is consistent 
      if (result.user && result.user.role) {
        // Normalize role to string format for consistency
        if (typeof result.user.role === 'object' && 'name' in result.user.role) {
          result.user.role = result.user.role.name;
        } else if (typeof result.user.role !== 'string') {
          // Fallback: convert any non-string role to string
          result.user.role = String(result.user.role);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      clearTokens(); // Clear invalid tokens
      return null;
    }
  },
  
  refreshToken: async () => {
    const currentRefreshToken = getRefreshToken();
    if (!currentRefreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await api.post('/auth/refresh', { refreshToken: currentRefreshToken });
    const { accessToken, refreshToken: newRefreshToken, user } = response.data;
    
    // Update tokens
    setAccessToken(accessToken);
    setRefreshToken(newRefreshToken);
    
    return { user };
  },
  
  // Helper method to check if we have a refresh token
  hasRefreshToken: () => {
    return !!getRefreshToken();
  },
  
  // Helper method to check if the stored access token is still valid
  hasValidAccessToken: () => {
    const token = getAccessToken();
    return token ? !isTokenExpired(token) : false;
  }
};

export default api; 