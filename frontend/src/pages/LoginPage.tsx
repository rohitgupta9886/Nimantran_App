import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Shield, Mail, Lock } from 'lucide-react';
import { apiFetch } from '../services/api';
import { useAuth } from '../store/authStore';
import { Button, Input, Card } from '../components/ui';

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
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-canvas">
      <div className="w-full max-w-md bg-white border border-charcoal-200/80 p-8 rounded-3xl shadow-lg space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-wine via-wine-700 to-gold p-0.5 shadow-sm mx-auto flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                <span className="font-serif font-extrabold text-2xl text-wine">N</span>
              </div>
            </div>
          </Link>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight">
            Welcome Back
          </h2>
          <p className="text-charcoal-500 text-xs sm:text-sm">
            Sign in to continue planning your celebrations
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="host@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
          />

          <Button
            type="submit"
            isLoading={loading}
            fullWidth
            size="lg"
            variant="primary"
          >
            Sign In
          </Button>
        </form>

        {/* Quick Demo Access Buttons */}
        <div className="space-y-2 pt-2 border-t border-charcoal-100">
          <Button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            variant="secondary"
            size="sm"
            fullWidth
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-gold" />}
          >
            Instant Demo Host Sign In
          </Button>

          <Button
            type="button"
            onClick={handleAdminQuickLogin}
            disabled={loading}
            variant="ghost"
            size="sm"
            fullWidth
            leftIcon={<Shield className="w-3.5 h-3.5 text-purple-700" />}
          >
            Admin Quick Sign In
          </Button>
        </div>

        <div className="text-center text-xs text-charcoal-500 pt-1">
          Don't have an account?{' '}
          <Link to="/register" className="text-wine font-bold hover:underline">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
};
