import { useContext, useCallback } from 'react';
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
  
  // Convenience methods
  const get = useCallback((endpoint, options) => request(endpoint, { ...options, method: 'GET' }), [request]);
  const post = useCallback((endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }), [request]);
  const put = useCallback((endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }), [request]);
  const del = useCallback((endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }), [request]);

  return { get, post, put, delete: del, request };
};

export default useApi;