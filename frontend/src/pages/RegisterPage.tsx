import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, User, Mail, Phone, Lock } from 'lucide-react';
import { apiFetch } from '../services/api';
import { useAuth } from '../store/authStore';
import { Button, Input } from '../components/ui';

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
            Create Host Account
          </h2>
          <p className="text-charcoal-500 text-xs sm:text-sm">
            Get started with 100 Free AI Credits for your celebrations
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <Input
            label="Full Name / Host Name"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Rohit & Neha Gupta"
            leftIcon={<User className="w-4 h-4" />}
          />

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
            label="WhatsApp / Phone Number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            leftIcon={<Phone className="w-4 h-4" />}
          />

          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
            helperText="Minimum 6 characters"
          />

          <Button
            type="submit"
            isLoading={loading}
            fullWidth
            size="lg"
            variant="primary"
          >
            Create Free Account
          </Button>
        </form>

        <div className="text-center text-xs text-charcoal-500 pt-1">
          Already have an account?{' '}
          <Link to="/login" className="text-wine font-bold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
