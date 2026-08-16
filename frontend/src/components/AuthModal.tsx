import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, X, Lock, Mail, User as UserIcon, CheckCircle2, ShieldCheck } from 'lucide-react';
import { apiFetch } from '../services/api';
import { useAuth } from '../store/authStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'LOGIN' | 'REGISTER';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'LOGIN',
}) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

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
        // Login to obtain JWT token
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

  const handleGoogleLogin = async () => {
    // Simulated Google OAuth Flow with automatic demo host token
    await handleDemoHostLogin();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-floating-card border border-yellow-400/40 rounded-3xl max-w-md w-full p-6 sm:p-8 text-white shadow-2xl relative space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar my-auto">
        
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER BRAND BADGE */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-400 via-amber-300 to-amber-500 p-0.5 shadow-lg shadow-yellow-500/20 mx-auto">
            <div className="w-full h-full bg-[#0D0004] rounded-2xl flex items-center justify-center">
              <span className="font-serif font-bold text-2xl gold-gradient-text">N</span>
            </div>
          </div>
          <h3 className="font-serif text-2xl font-bold gold-gradient-text">
            {mode === 'LOGIN' ? 'Welcome Back to NIMANTRAN' : 'Create Your NIMANTRAN Account'}
          </h3>
          <p className="text-xs text-slate-300">
            {mode === 'LOGIN'
              ? 'Sign in to manage your celebrations & invitations'
              : 'Start creating beautiful digital invitations in seconds'}
          </p>
        </div>

        {/* MODE TABS */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-black/60 border border-yellow-500/30 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode('LOGIN')}
            className={`py-2 rounded-xl transition-all ${mode === 'LOGIN' ? 'bg-yellow-400 text-black font-bold shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Sign In 👋
          </button>
          <button
            type="button"
            onClick={() => setMode('REGISTER')}
            className={`py-2 rounded-xl transition-all ${mode === 'REGISTER' ? 'bg-yellow-400 text-black font-bold shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Sign Up ✨
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs text-center font-semibold">
            {error}
          </div>
        )}

        {/* 1. CONTINUE WITH GOOGLE */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-3 border border-slate-300"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="relative flex items-center justify-center my-1">
          <div className="w-full border-t border-yellow-500/20" />
          <span className="bg-[#0B0003] px-3 text-[10px] font-mono text-slate-500 uppercase font-bold absolute">OR EMAIL</span>
        </div>

        {/* 2. EMAIL & PASSWORD FORM */}
        <form onSubmit={handleEmailAuth} className="space-y-3.5">
          {mode === 'REGISTER' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-yellow-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Rahul Sharma"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#090003] border border-yellow-500/30 text-white text-xs placeholder:text-slate-600 focus:border-yellow-400 outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-yellow-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="host@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#090003] border border-yellow-500/30 text-white text-xs placeholder:text-slate-600 focus:border-yellow-400 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-yellow-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#090003] border border-yellow-500/30 text-white text-xs placeholder:text-slate-600 focus:border-yellow-400 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-amber-500 text-black font-bold text-xs shadow-xl hover:scale-[1.01] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : mode === 'LOGIN' ? 'Sign In to Dashboard' : 'Create Free Account'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 3. ONE-TAP DEMO HOST LOGIN BUTTON */}
        <button
          type="button"
          onClick={handleDemoHostLogin}
          disabled={loading}
          className="w-full py-3 rounded-2xl bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <span>1-Tap Sign In as Pre-seeded Demo Host</span>
        </button>

      </div>
    </div>
  );
};
