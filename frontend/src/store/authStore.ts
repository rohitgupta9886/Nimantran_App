import { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  is_superuser: boolean;
}

let globalUser: User | null = null;
let globalLoading = true;
let listeners: Array<() => void> = [];

function notifyListeners() {
  listeners.forEach((l) => l());
}

// Initial fetch if token exists
const initialToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
if (initialToken) {
  apiFetch<User>('/auth/me')
    .then((res) => {
      globalUser = res.data;
    })
    .catch(() => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      globalUser = null;
    })
    .finally(() => {
      globalLoading = false;
      notifyListeners();
    });
} else {
  globalLoading = false;
}

export function useAuth() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleChange = () => setTick((t) => t + 1);
    listeners.push(handleChange);

    // If token exists but user is not fetched yet, re-trigger fetch
    const token = localStorage.getItem('access_token');
    if (token && !globalUser && !globalLoading) {
      globalLoading = true;
      notifyListeners();
      apiFetch<User>('/auth/me')
        .then((res) => {
          globalUser = res.data;
        })
        .catch(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          globalUser = null;
        })
        .finally(() => {
          globalLoading = false;
          notifyListeners();
        });
    }

    return () => {
      listeners = listeners.filter((l) => l !== handleChange);
    };
  }, []);

  const login = async (accessToken: string, refreshToken: string) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    globalLoading = true;
    notifyListeners();
    try {
      const res = await apiFetch<User>('/auth/me');
      globalUser = res.data;
      return res.data;
    } finally {
      globalLoading = false;
      notifyListeners();
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    globalUser = null;
    globalLoading = false;
    notifyListeners();
  };

  return { user: globalUser, loading: globalLoading, login, logout };
}

