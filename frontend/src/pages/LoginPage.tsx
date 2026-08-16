import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Shield } from 'lucide-react';
import { apiFetch } from '../services/api';
import { useAuth } from '../store/authStore';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, loading: authLoading, login } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'ADMIN' || user.is_superuser) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch<{ access_token: string; refresh_token: string; user?: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      await login(res.data.access_token, res.data.refresh_token);
      const isAdm = res.data.user?.role === 'ADMIN' || res.data.user?.is_superuser;
      if (isAdm) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const message = err?.message || (typeof err === 'string' ? err : 'Login failed');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('demo@nimantran.ai');
    setPassword('password123');
    setLoading(true);
    try {
      const res = await apiFetch<{ access_token: string; refresh_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'demo@nimantran.ai', password: 'password123' }),
      });
      await login(res.data.access_token, res.data.refresh_token);
      navigate('/dashboard');
    } catch (err: any) {
      const message = err?.message || (typeof err === 'string' ? err : 'Demo login failed');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminQuickLogin = async () => {
    setEmail('rohitgupta9886@gmail.com');
    setPassword('AdminSecurePass2026!');
    setLoading(true);
    try {
      const res = await apiFetch<{ access_token: string; refresh_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'rohitgupta9886@gmail.com', password: 'AdminSecurePass2026!' }),
      });
      await login(res.data.access_token, res.data.refresh_token);
      navigate('/admin');
    } catch (err: any) {
      const message = err?.message || (typeof err === 'string' ? err : 'Admin login failed');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl gold-border shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center font-serif font-bold text-xl">
            N
          </div>
          <h2 className="font-serif text-3xl font-bold gold-gradient-text">Welcome Back</h2>
          <p className="text-slate-400 text-xs">Sign in to manage your digital invitations & event guest CRM</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-amber-200/80 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="host@example.com"
              className="w-full px-4 py-3 rounded-xl bg-[#0D0205] border border-amber-500/30 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-amber-200/80 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-[#0D0205] border border-amber-500/30 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-black font-bold text-sm shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-transform disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-amber-500/20" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#1A0006] px-3 text-slate-500">OR QUICK START</span>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleAdminQuickLogin}
            className="w-full py-3 rounded-xl bg-purple-950/60 border border-purple-400 text-purple-200 font-bold text-xs hover:bg-purple-900/80 transition-colors flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4 text-amber-300" /> Sign In as Master Admin (rohitgupta9886@gmail.com)
          </button>

          <button
            onClick={handleDemoLogin}
            className="w-full py-3 rounded-xl glass-panel border-amber-500/40 text-amber-300 font-semibold text-xs hover:bg-amber-500/10 transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-400" /> Sign In with Pre-seeded Demo Host Account
          </button>
        </div>

        <p className="text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-amber-400 hover:underline font-semibold">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
};
