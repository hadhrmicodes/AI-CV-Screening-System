import axios from 'axios';

// Create axios instance with JWT token auto-included in headers
const apiClient = axios.create({
  baseURL: 'http://localhost:5000',
});

// Interceptor to add JWT token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
