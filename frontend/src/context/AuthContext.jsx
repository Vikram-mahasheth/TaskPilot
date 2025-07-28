import { createContext, useState, useEffect, useCallback } from 'react';
import jwt_decode from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  
  const logout = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  }, []);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwt_decode(token);
        if (decoded.exp * 1000 < Date.now()) {
          logout();
        } else {
          const userData = JSON.parse(localStorage.getItem('user'));
          setUser(userData);
        }
      } catch (error) {
        console.error("Invalid token:", error);
        logout();
      }
    }
  }, [token, logout]);

  const login = (userData, authToken) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
    setUser(userData);
    setToken(authToken);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
