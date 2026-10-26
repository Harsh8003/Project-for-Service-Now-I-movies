import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useCity } from '../context/CityContext';
import { useToast } from '../context/ToastContext';
import { User, Shield, Film, Headphones, MapPin, Mail, Phone, LogOut } from 'lucide-react';
import { Role } from '../types';

export const ProfilePage: React.FC = () => {
  const { user, logout, switchDemoRole } = useAuth();
  const { selectedCity, setCityModalOpen } = useCity();
  const { showToast } = useToast();

  if (!user) return null;

  const handleRoleChange = async (role: Role) => {
    try {
      await switchDemoRole(role);
      showToast(`Switched active role to ${role}`, 'success');
    } catch {
      showToast('Failed to switch role', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#08090C] text-[#F1F5F9] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="p-8 rounded-3xl bg-[#12151B] border border-white/5 flex flex-col sm:flex-row items-center gap-6 shadow-xl">
          <img
            src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
            alt={user.name}
            className="w-24 h-24 rounded-full object-cover border-2 border-[#E50914] shadow-glow"
          />
          <div className="space-y-1.5 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl font-black text-white">{user.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E50914]/20 border border-[#E50914]/30 text-[#E50914]">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-gray-400 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              <span>{user.email}</span>
            </p>
            {user.phone && (
              <p className="text-xs text-gray-400 flex items-center justify-center sm:justify-start gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                <span>{user.phone}</span>
              </p>
            )}
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Saved Location Preferences */}
        <div className="p-6 rounded-2xl bg-[#12151B] border border-white/5 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#E50914]" />
            <span>City & Cinema Preferences</span>
          </h2>
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#0D0F14] border border-white/5">
            <div>
              <div className="text-xs text-gray-400">Current Default City</div>
              <div className="text-sm font-bold text-white mt-0.5">{selectedCity?.name} ({selectedCity?.state})</div>
            </div>
            <button
              onClick={() => setCityModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
            >
              Change City
            </button>
          </div>
        </div>

        {/* One-Click Role Switcher for Evaluation */}
        <div className="p-6 rounded-2xl bg-[#12151B] border border-white/5 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white">Interactive Evaluation Role Switcher</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Switch roles seamlessly without re-authenticating to test Customer, Support, Manager, and Admin capabilities.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => handleRoleChange('CUSTOMER')}
              className={`p-4 rounded-xl border text-left transition-all ${
                user.role === 'CUSTOMER'
                  ? 'bg-[#E50914]/20 border-[#E50914] text-white shadow-glow'
                  : 'bg-[#151922] border-white/5 text-gray-300 hover:text-white hover:bg-[#1E2432]'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                <User className="w-4 h-4 text-blue-400" />
                <span>CUSTOMER</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Browse movies, select seats with live locks, make mock Razorpay payments, cancel eligible tickets.
              </p>
            </button>

            <button
              onClick={() => handleRoleChange('ADMIN')}
              className={`p-4 rounded-xl border text-left transition-all ${
                user.role === 'ADMIN'
                  ? 'bg-[#E50914]/20 border-[#E50914] text-white shadow-glow'
                  : 'bg-[#151922] border-white/5 text-gray-300 hover:text-white hover:bg-[#1E2432]'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                <Shield className="w-4 h-4 text-[#E50914]" />
                <span>ADMIN (Full Permissions)</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Access Admin Portal, manage movies & showtimes, monitor revenue KPIs, view bookings & audit trails.
              </p>
            </button>

            <button
              onClick={() => handleRoleChange('CINEMA_MANAGER')}
              className={`p-4 rounded-xl border text-left transition-all ${
                user.role === 'CINEMA_MANAGER'
                  ? 'bg-[#E50914]/20 border-[#E50914] text-white shadow-glow'
                  : 'bg-[#151922] border-white/5 text-gray-300 hover:text-white hover:bg-[#1E2432]'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                <Film className="w-4 h-4 text-amber-400" />
                <span>CINEMA MANAGER</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Schedule showtimes, inspect cinema seat occupancy, and manage local screen schedules.
              </p>
            </button>

            <button
              onClick={() => handleRoleChange('SUPPORT')}
              className={`p-4 rounded-xl border text-left transition-all ${
                user.role === 'SUPPORT'
                  ? 'bg-[#E50914]/20 border-[#E50914] text-white shadow-glow'
                  : 'bg-[#151922] border-white/5 text-gray-300 hover:text-white hover:bg-[#1E2432]'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                <Headphones className="w-4 h-4 text-emerald-400" />
                <span>SUPPORT SPECIALIST</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Search user bookings by reference, verify ticket validity, and assist with cancellations.
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
