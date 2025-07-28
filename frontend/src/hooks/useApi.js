import { useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';

const useApi = () => {
  const { token, logout } = useContext(AuthContext);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

  const apiFetch = useCallback(async (url, options = {}) => {
    const headers = { ...options.headers };
    if (token) { headers['Authorization'] = `Bearer ${token}`; }
    if (!(options.body instanceof FormData)) { headers['Content-Type'] = 'application/json'; }

    const response = await fetch(`${API_URL}${url}`, { ...options, headers });

    if (response.status === 401) {
      logout();
      throw new Error('Unauthorized');
    }
    
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (!response.ok) { throw new Error(data.error || 'Something went wrong'); }
        return data;
    } else {
        if (!response.ok) { const text = await response.text(); throw new Error(text || 'Something went wrong'); }
        return response;
    }
  }, [token, logout, API_URL]);

  return apiFetch;
};

export default useApi;