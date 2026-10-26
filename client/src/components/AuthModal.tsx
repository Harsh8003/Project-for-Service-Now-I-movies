import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { X, Lock, Mail, User, Shield, Film, Headphones } from 'lucide-react';
import { Role } from '../types';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    login,
    register,
    switchDemoRole
  } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (authModalMode === 'login') {
        await login(email, password);
        showToast('Logged in successfully! Welcome to CINEMATIC.', 'success');
      } else {
        await register({ name, email, password, phone });
        showToast('Account created successfully! Welcome aboard.', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Authentication failed. Please check credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSwitch = async (role: Role) => {
    setLoading(true);
    try {
      await switchDemoRole(role);
      showToast(`Switched session to ${role} demo account!`, 'success');
      setAuthModalOpen(false);
    } catch (err: any) {
      showToast('Failed to switch demo account', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-2xl glass-dropdown border border-white/10 shadow-2xl animate-fade-in">
        {/* Close Button */}
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute right-5 top-5 p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#E50914]/20 border border-[#E50914]/40 text-[#E50914] mb-3 shadow-glow">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-white">
            {authModalMode === 'login' ? 'Sign in to CINEMATIC' : 'Join CINEMATIC'}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Access your bookings, stream trailers, and enjoy instant discounts
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {authModalMode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Aarav Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0D0F14] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#E50914]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0D0F14] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#E50914]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0D0F14] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#E50914]"
              />
            </div>
          </div>

          {authModalMode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Phone Number (Optional)</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#0D0F14] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#E50914]"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#E50914] hover:bg-[#FF2E4D] text-white font-bold text-sm tracking-wide shadow-glow transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
          >
            {loading ? 'Processing...' : authModalMode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Switch Login / Register */}
        <div className="mt-4 text-center text-xs text-gray-400">
          {authModalMode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setAuthModalMode('register')}
                className="text-[#E50914] hover:underline font-semibold"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setAuthModalMode('login')}
                className="text-[#E50914] hover:underline font-semibold"
              >
                Sign in
              </button>
            </>
          )}
        </div>

        {/* Quick Demo Switcher Section */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <p className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase text-center mb-3">
            Quick 1-Click Demo Evaluation Roles
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDemoSwitch('CUSTOMER')}
              className="flex items-center gap-2 p-2 rounded-lg bg-[#141720] hover:bg-[#1E2330] border border-white/5 text-xs text-gray-300 hover:text-white transition-colors"
            >
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span>Customer</span>
            </button>
            <button
              onClick={() => handleDemoSwitch('ADMIN')}
              className="flex items-center gap-2 p-2 rounded-lg bg-[#141720] hover:bg-[#1E2330] border border-white/5 text-xs text-gray-300 hover:text-white transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-[#E50914]" />
              <span>Admin (All access)</span>
            </button>
            <button
              onClick={() => handleDemoSwitch('CINEMA_MANAGER')}
              className="flex items-center gap-2 p-2 rounded-lg bg-[#141720] hover:bg-[#1E2330] border border-white/5 text-xs text-gray-300 hover:text-white transition-colors"
            >
              <Film className="w-3.5 h-3.5 text-amber-400" />
              <span>Cinema Manager</span>
            </button>
            <button
              onClick={() => handleDemoSwitch('SUPPORT')}
              className="flex items-center gap-2 p-2 rounded-lg bg-[#141720] hover:bg-[#1E2330] border border-white/5 text-xs text-gray-300 hover:text-white transition-colors"
            >
              <Headphones className="w-3.5 h-3.5 text-emerald-400" />
              <span>Support Specialist</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
