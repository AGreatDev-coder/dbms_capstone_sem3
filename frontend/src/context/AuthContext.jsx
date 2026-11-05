import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('lifelink_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('lifelink_token'));
  const [loading, setLoading] = useState(true);
  const [isMySQLConnected, setIsMySQLConnected] = useState(false);

  useEffect(() => {
    checkHealthAndSession();
  }, []);

  const checkHealthAndSession = async () => {
    try {
      const res = await api.get('/health');
      if (res.data) {
        setIsMySQLConnected(res.data.mysql_connected);
      }

      if (token) {
        const meRes = await api.get('/auth/me');
        if (meRes.data && meRes.data.success) {
          setUser(meRes.data.user);
          localStorage.setItem('lifelink_user', JSON.stringify(meRes.data.user));
          if (meRes.data.isMySQLConnected !== undefined) {
            setIsMySQLConnected(meRes.data.isMySQLConnected);
          }
        }
      }
    } catch (err) {
      console.warn('Session verification fallback:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password = 'Password@123') => {
    try {
      const res = await api.post('/auth/login', { username, password });
      if (res.data && res.data.success) {
        const { token: jwtToken, user: userData } = res.data;
        setToken(jwtToken);
        setUser(userData);
        localStorage.setItem('lifelink_token', jwtToken);
        localStorage.setItem('lifelink_user', JSON.stringify(userData));
        return { success: true };
      }
      return { success: false, message: res.data.message || 'Login failed' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || 'Login connection failed',
      };
    }
  };

  const quickLogin = async (username) => {
    return await login(username, 'Password@123');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('lifelink_token');
    localStorage.removeItem('lifelink_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isMySQLConnected,
        login,
        quickLogin,
        logout,
        checkHealthAndSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

