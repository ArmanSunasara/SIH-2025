import axios from 'axios';
import config from '../config';
import DOMPurify from 'dompurify';

// Create axios instances with improved configuration
const backendAPI = axios.create({
  baseURL: config.apiUrl,
  timeout: config.httpTimeout,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
});

const mlAPI = axios.create({
  baseURL: config.mlApiUrl,
  timeout: config.httpTimeout,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
});

// Token management utilities
const tokenManager = {
  getToken: () => localStorage.getItem('token'),
  setToken: (token) => localStorage.setItem('token', token),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  setRefreshToken: (token) => localStorage.setItem('refreshToken', token),
  clearTokens: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }
};

// Request interceptor for authentication
backendAPI.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Sanitize request data
    if (config.data && typeof config.data === 'object') {
      config.data = sanitizeInput(config.data);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh and error handling
backendAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = tokenManager.getRefreshToken();
        if (refreshToken) {
          const response = await backendAPI.post('/auth/refresh-token', {
            refreshToken
          });
          
          const { token, refreshToken: newRefreshToken } = response.data.data;
          tokenManager.setToken(token);
          tokenManager.setRefreshToken(newRefreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return backendAPI(originalRequest);
        }
      } catch (refreshError) {
        tokenManager.clearTokens();
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Input sanitization function
function sanitizeInput(data) {
  if (typeof data === 'string') {
    return DOMPurify.sanitize(data, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [] 
    });
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeInput);
  }
  
  if (data && typeof data === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return data;
}

// Enhanced error handling
const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        throw new Error(data.message || 'Invalid request');
      case 401:
        tokenManager.clearTokens();
        throw new Error('Authentication required');
      case 403:
        throw new Error('Access denied');
      case 404:
        throw new Error('Resource not found');
      case 429:
        throw new Error('Too many requests. Please try again later.');
      case 500:
        throw new Error('Server error. Please try again later.');
      default:
        throw new Error(data.message || `Request failed with status ${status}`);
    }
  } else if (error.request) {
    // Request made but no response received
    throw new Error('Network error. Please check your connection.');
  } else {
    // Something else happened
    throw new Error(error.message || 'An unexpected error occurred');
  }
};

// Auth API with enhanced functionality
export const authAPI = {
  register: async (email, password) => {
    try {
      const response = await backendAPI.post('/auth/register', { email, password });
      const { token, refreshToken, user } = response.data.data;
      
      tokenManager.setToken(token);
      tokenManager.setRefreshToken(refreshToken);
      
      return { token, refreshToken, user };
    } catch (error) {
      handleApiError(error);
    }
  },
  
  login: async (email, password) => {
    try {
      const response = await backendAPI.post('/auth/login', { email, password });
      const { token, refreshToken, user } = response.data.data;
      
      tokenManager.setToken(token);
      tokenManager.setRefreshToken(refreshToken);
      
      return { token, refreshToken, user };
    } catch (error) {
      handleApiError(error);
    }
  },
  
  logout: async () => {
    try {
      const refreshToken = tokenManager.getRefreshToken();
      if (refreshToken) {
        await backendAPI.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.warn('Logout request failed:', error.message);
    } finally {
      tokenManager.clearTokens();
    }
  },
  
  getProfile: async () => {
    try {
      const response = await backendAPI.get('/auth/profile');
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },
  
  refreshToken: async () => {
    try {
      const refreshToken = tokenManager.getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token available');
      
      const response = await backendAPI.post('/auth/refresh-token', { refreshToken });
      const { token, refreshToken: newRefreshToken } = response.data.data;
      
      tokenManager.setToken(token);
      tokenManager.setRefreshToken(newRefreshToken);
      
      return { token, refreshToken: newRefreshToken };
    } catch (error) {
      tokenManager.clearTokens();
      handleApiError(error);
    }
  }
};

// Predictions API with enhanced functionality
export const predictionsAPI = {
  save: async (predictionData) => {
    try {
      const response = await backendAPI.post('/predictions/save', predictionData);
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },
  
  getHistory: async (page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc') => {
    try {
      const response = await backendAPI.get('/predictions/history', {
        params: { page, limit, sortBy, sortOrder }
      });
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },
  
  getStats: async () => {
    try {
      const response = await backendAPI.get('/predictions/stats');
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },
  
  getById: async (id) => {
    try {
      const response = await backendAPI.get(`/predictions/${id}`);
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  },
  
  delete: async (id) => {
    try {
      const response = await backendAPI.delete(`/predictions/${id}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  }
};

// ML API with retry logic
export const mlAPI_service = {
  predict: async (features, retries = config.httpRetries) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await mlAPI.post('/predict', { features });
        return response.data;
      } catch (error) {
        if (attempt === retries) {
          handleApiError(error);
        }
        
        // Exponential backoff for retries
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  },
  
  health: async () => {
    try {
      const response = await mlAPI.get('/health');
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  }
};

// Health check utilities
export const healthAPI = {
  checkBackend: async () => {
    try {
      const response = await backendAPI.get('/health');
      return { status: 'healthy', data: response.data };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  },
  
  checkML: async () => {
    try {
      const response = await mlAPI.get('/health');
      return { status: 'healthy', data: response.data };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  },
  
  checkAll: async () => {
    const [backend, ml] = await Promise.allSettled([
      healthAPI.checkBackend(),
      healthAPI.checkML()
    ]);
    
    return {
      backend: backend.status === 'fulfilled' ? backend.value : { status: 'unhealthy', error: backend.reason?.message },
      ml: ml.status === 'fulfilled' ? ml.value : { status: 'unhealthy', error: ml.reason?.message }
    };
  }
};

// Export consolidated API service
const apiService = {
  auth: authAPI,
  predictions: predictionsAPI,
  ml: mlAPI_service,
  health: healthAPI,
  utils: {
    sanitizeInput,
    tokenManager
  }
};

export default apiService;