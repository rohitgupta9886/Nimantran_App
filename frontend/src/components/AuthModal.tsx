import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Lock, Mail, User as UserIcon } from 'lucide-react';
import { apiFetch } from '../services/api';
import { useAuth } from '../store/authStore';
import { Modal, Button, Input } from './ui';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'LOGIN' | 'REGISTER';
  initialMode?: 'LOGIN' | 'REGISTER';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode,
  initialMode = 'LOGIN',
}) => {
  const activeInitial = defaultMode || initialMode;
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>(activeInitial);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode || initialMode || 'LOGIN');
      setError(null);
    }
  }, [isOpen, defaultMode, initialMode]);

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      let tokenData: { access_token: string; refresh_token: string; user?: any };

      if (mode === 'REGISTER') {
        const regRes = await apiFetch<{ access_token: string; refresh_token: string; user?: any }>('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            full_name: fullName.trim() || 'Celebration Host',
            email: email.trim(),
            password,
          }),
        });
        tokenData = regRes.data;
      } else {
        const res = await apiFetch<{ access_token: string; refresh_token: string; user?: any }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: email.trim(), password }),
        });
        tokenData = res.data;
      }

      await login(tokenData.access_token, tokenData.refresh_token);
      onClose();
      const isAdm = tokenData.user?.role === 'ADMIN' || tokenData.user?.is_superuser;
      if (isAdm) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const message = err?.message || (typeof err === 'string' ? err : 'Authentication failed. Please check details.');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoHostLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ access_token: string; refresh_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'demo@nimantran.ai', password: 'password123' }),
      });

      await login(res.data.access_token, res.data.refresh_token);
      onClose();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo host login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={
        <div className="flex items-center gap-2">
          <span>{mode === 'LOGIN' ? 'Welcome Back' : 'Create Host Account'}</span>
        </div>
      }
      description={
        mode === 'LOGIN'
          ? 'Sign in to manage your celebrations and invitations'
          : 'Get 100 free AI credits to design royal digital invites'
      }
    >
      <div className="space-y-4">
        {/* Toggle Mode Tabs */}
        <div className="flex rounded-xl bg-canvas p-1 border border-charcoal-200">
          <button
            type="button"
            onClick={() => setMode('LOGIN')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'LOGIN'
                ? 'bg-white text-charcoal-900 shadow-xs'
                : 'text-charcoal-500 hover:text-charcoal-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('REGISTER')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'REGISTER'
                ? 'bg-white text-charcoal-900 shadow-xs'
                : 'text-charcoal-500 hover:text-charcoal-900'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-3.5">
          {mode === 'REGISTER' && (
            <Input
              label="Full Name / Host Name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Rohit & Neha Gupta"
              leftIcon={<UserIcon className="w-4 h-4" />}
            />
          )}

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
            helperText={mode === 'REGISTER' ? 'Minimum 6 characters' : undefined}
          />

          <Button
            type="submit"
            isLoading={loading}
            fullWidth
            size="md"
            variant="primary"
          >
            {mode === 'LOGIN' ? 'Sign In' : 'Create Free Account'}
          </Button>
        </form>

        <div className="pt-2 border-t border-charcoal-100">
          <Button
            type="button"
            onClick={handleDemoHostLogin}
            disabled={loading}
            variant="secondary"
            size="sm"
            fullWidth
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-gold" />}
          >
            Try Instant Demo Host Login
          </Button>
        </div>
      </div>
    </Modal>
  );
};
