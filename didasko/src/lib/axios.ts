import axios from 'axios';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: '/api', // This will be relative to your Next.js app
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // This is important for handling cookies
});

// Add request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // You can add auth token here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors here
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Request error:', {
        message: 'No response received from server',
        request: error.request,
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error:', {
        message: error.message,
        stack: error.stack,
      });
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
