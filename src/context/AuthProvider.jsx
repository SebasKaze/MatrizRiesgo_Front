import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { authService } from '../services/authService';
import { api } from '../services/api';

export function AuthProvider({ children }) {
  const initialSession = authService.getSession();
  const [user, setUser] = useState(initialSession.user);
  const [token, setToken] = useState(initialSession.token);
  const [isLoading, setIsLoading] = useState(false);
  const [authSource, setAuthSource] = useState(initialSession.source);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking' | 'connected' | 'offline'

  const checkBackend = useCallback(async () => {
    setBackendStatus('checking');
    try {
      const isOnline = await api.checkHealth();
      setBackendStatus(isOnline ? 'connected' : 'offline');
      return isOnline;
    } catch {
      setBackendStatus('offline');
      return false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    api.checkHealth().then((isOnline) => {
      if (isMounted) {
        setBackendStatus(isOnline ? 'connected' : 'offline');
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async ({ correo, email, password }) => {
    setIsLoading(true);
    try {
      const result = await authService.login({ correo, email, password });
      setUser(result.user);
      setToken(result.token);
      setAuthSource(result.source);
      if (result.source === 'DATABASE_API') {
        setBackendStatus('connected');
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
    setAuthSource(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    authSource,
    backendStatus,
    apiBaseUrl: api.baseUrl,
    login,
    logout,
    checkBackend,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
