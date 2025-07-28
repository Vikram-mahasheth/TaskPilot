import { useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const useApi = () => {
  const { token, logout } = useContext(AuthContext);
  const baseURL = import.meta.env.VITE_API_URL;

  const apiCall = useCallback(
    async (endpoint, options = {}) => {
      const { body, ...customConfig } = options;
      const headers = { 'Content-Type': 'application/json' };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const config = {
        method: body ? 'POST' : 'GET',
        ...customConfig,
        headers: {
          ...headers,
          ...customConfig.headers,
        },
      };

      if (body) {
        config.body = JSON.stringify(body);
      }

      try {
        const response = await fetch(`${baseURL}${endpoint}`, config);
        const data = await response.json();
        
        if (!response.ok) {
            if (response.status === 401) {
                logout();
                toast.error("Session expired. Please log in again.");
            }
            throw new Error(data.error || 'An API error occurred');
        }

        return data;

      } catch (error) {
        console.error('API call failed:', error);
        throw error;
      }
    },
    [token, logout, baseURL]
  );
  
  // Add convenience methods
  return {
    get: (endpoint, options) => apiCall(endpoint, { ...options, method: 'GET' }),
    post: (endpoint, body, options) => apiCall(endpoint, { ...options, method: 'POST', body }),
    put: (endpoint, body, options) => apiCall(endpoint, { ...options, method: 'PUT', body }),
    delete: (endpoint, options) => apiCall(endpoint, { ...options, method: 'DELETE' }),
  };
};

export default useApi;