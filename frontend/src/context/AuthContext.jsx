import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token'));
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('admin_token'));

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setAdmin(null);
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/admin/me')
      .then((res) => setAdmin(res.data))
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [token, logout]);

  const login = useCallback(async (username, password) => {
    const res = await api.post('/admin/login', { username, password });
    localStorage.setItem('admin_token', res.data.token);
    setToken(res.data.token);
    setAdmin({ username: res.data.username });
  }, []);

  return (
    <AuthContext.Provider value={{ token, admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
