import { useContext, useCallback, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const useApi = () => {
  const { token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const baseURL = import.meta.env.VITE_API_URL;

  const request = useCallback(async (endpoint, options = {}) => {
    const headers = { ...options.headers };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(`${baseURL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate('/login');
          toast.error("Session expired. Please log in again.");
        }
        throw new Error(data.error || 'An API error occurred');
      }
      return data;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }, [token, logout, navigate, baseURL]);
  
  return useMemo(() => ({
      get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
      post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
      put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
      delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
      request
  }), [request]);
};

export default useApi;
