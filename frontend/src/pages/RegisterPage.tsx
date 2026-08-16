import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { useAuth } from '../store/authStore';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, loading: authLoading, login } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const payload: { full_name: string; email: string; password: string; phone?: string } = {
        full_name: fullName.trim(),
        email: email.trim(),
        password,
      };
      if (phone.trim()) {
        payload.phone = phone.trim();
      }

      const res = await apiFetch<{ access_token: string; refresh_token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await login(res.data.access_token, res.data.refresh_token);
      navigate('/dashboard');
    } catch (err: any) {
      const message = err?.message || (typeof err === 'string' ? err : 'Registration failed');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl gold-border shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <h2 className="font-serif text-3xl font-bold gold-gradient-text">Create Host Account</h2>
          <p className="text-slate-400 text-xs">Get 100 Free AI Credits on signup</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-amber-200/80 mb-1">Full Name / Host Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Rohit & Neha Gupta"
              className="w-full px-4 py-3 rounded-xl bg-[#0D0205] border border-amber-500/30 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 text-sm"
            />
          </div>

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
            <label className="block text-xs font-semibold text-amber-200/80 mb-1">WhatsApp / Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
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
            {loading ? 'Creating Account...' : 'Create Host Account'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-amber-400 hover:underline font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
