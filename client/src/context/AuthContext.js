import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const res = await authApi.me();
      if (res?.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await authApi.login({ email, password });
      if (res?.data?.sessionId) {
        localStorage.setItem('arena_session_id', res.data.sessionId);
      }
      setUser(res.data.user);
      return res.data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const signup = async ({ name, email, password, timezone }) => {
    setError(null);
    try {
      const res = await authApi.signup({ name, email, password, timezone });
      if (res?.data?.sessionId) {
        localStorage.setItem('arena_session_id', res.data.sessionId);
      }
      setUser(res.data.user);
      return res.data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout warning', err);
    } finally {
      localStorage.removeItem('arena_session_id');
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await authApi.me();
      if (res?.data?.user) {
        setUser(res.data.user);
      }
    } catch (err) {
      // ignore
    }
  };

  return React.createElement(
    AuthContext.Provider,
    { value: { user, loading, error, login, signup, logout, refreshUser } },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
