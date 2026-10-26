import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCity } from '../context/CityContext';
import { api } from '../services/api';
import { Movie } from '../types';
import { 
  Film, 
  MapPin, 
  Search, 
  Ticket, 
  Tag, 
  Shield, 
  User as UserIcon, 
  ChevronDown, 
  LogOut, 
  Menu, 
  X,
  Sparkles
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, setAuthModalOpen, setAuthModalMode, switchDemoRole } = useAuth();
  const { selectedCity, setCityModalOpen } = useCity();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Search debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.getMovies({ search: searchQuery });
        if (res.success) {
          setSearchResults(res.data.slice(0, 5));
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectMovie = (slug: string) => {
    setSearchQuery('');
    setSearchResults([]);
    navigate(`/movie/${slug}`);
  };

  const isAdminOrStaff = user && ['ADMIN', 'CINEMA_MANAGER', 'SUPPORT'].includes(user.role);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/5 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo & City Selector */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E50914] to-[#FF4B2B] flex items-center justify-center text-white shadow-glow group-hover:scale-105 transition-transform">
                <Film className="w-5 h-5" />
              </div>
              <span className="font-display font-black text-2xl tracking-wider text-white">
                CINEMATIC<span className="text-[#E50914]">.</span>
              </span>
            </Link>

            {/* City Selector Pill */}
            <button
              onClick={() => setCityModalOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#151922] hover:bg-[#1E2432] border border-white/10 text-xs font-semibold text-gray-200 transition-all shadow-sm"
              title="Change your city"
            >
              <MapPin className="w-3.5 h-3.5 text-[#E50914]" />
              <span>{selectedCity?.name || 'Select City'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>

          {/* Search Bar with Autocomplete Dropdown */}
          <div ref={searchRef} className="relative flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search movies, genres, or directors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0F1218] border border-white/10 text-white placeholder-gray-400 text-xs focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] transition-all"
              />
              {isSearching && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-gray-400 border-t-[#E50914] rounded-full animate-spin" />
              )}
            </div>

            {/* Autocomplete Popup */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 p-2 rounded-xl glass-dropdown shadow-2xl border border-white/10 z-50 animate-fade-in">
                {searchResults.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSelectMovie(m.slug)}
                    className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                  >
                    <img
                      src={m.posterUrl}
                      alt={m.title}
                      className="w-10 h-14 object-cover rounded-md bg-gray-800 shrink-0"
                    />
                    <div className="truncate">
                      <div className="text-sm font-bold text-white truncate">{m.title}</div>
                      <div className="text-xs text-gray-400">
                        {m.language} • {m.genres.slice(0, 2).join(', ')} • ★ {m.rating}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Links & User Profile */}
          <div className="hidden lg:flex items-center gap-6">
            <Link
              to="/movies"
              className="text-xs font-semibold text-gray-300 hover:text-white transition-colors"
            >
              Movies
            </Link>
            <Link
              to="/offers"
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 hover:text-white transition-colors"
            >
              <Tag className="w-3.5 h-3.5 text-[#E50914]" />
              <span>Offers</span>
            </Link>
            <Link
              to="/my-bookings"
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 hover:text-white transition-colors"
            >
              <Ticket className="w-3.5 h-3.5 text-[#E50914]" />
              <span>My Bookings</span>
            </Link>

            {isAdminOrStaff && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Portal</span>
              </Link>
            )}

            {/* User Dropdown or Sign In */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <img
                    src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-[#E50914]"
                  />
                  <div className="text-left text-xs hidden xl:block">
                    <div className="font-bold text-white truncate max-w-[120px]">{user.name.split(' ')[0]}</div>
                    <div className="text-[10px] text-[#E50914] font-medium tracking-wider">{user.role}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 p-3 rounded-2xl glass-dropdown shadow-2xl border border-white/10 z-50 animate-fade-in">
                    <div className="px-3 py-2 border-b border-white/10 mb-2">
                      <div className="font-bold text-sm text-white truncate">{user.name}</div>
                      <div className="text-xs text-gray-400 truncate">{user.email}</div>
                      <div className="mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/30 uppercase">
                        Role: {user.role}
                      </div>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-gray-400" />
                      <span>Account Settings</span>
                    </Link>

                    <Link
                      to="/my-bookings"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Ticket className="w-4 h-4 text-[#E50914]" />
                      <span>My Tickets & Orders</span>
                    </Link>

                    {/* Quick Demo Switcher in Dropdown */}
                    <div className="my-2 pt-2 border-t border-white/10">
                      <div className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Switch Evaluation Role:</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 px-1">
                        <button
                          onClick={() => { switchDemoRole('CUSTOMER'); setIsProfileOpen(false); }}
                          className={`text-left px-2 py-1 rounded text-[11px] ${user.role === 'CUSTOMER' ? 'bg-[#E50914]/20 text-white font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                          Customer
                        </button>
                        <button
                          onClick={() => { switchDemoRole('ADMIN'); setIsProfileOpen(false); }}
                          className={`text-left px-2 py-1 rounded text-[11px] ${user.role === 'ADMIN' ? 'bg-[#E50914]/20 text-white font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                          Admin
                        </button>
                        <button
                          onClick={() => { switchDemoRole('CINEMA_MANAGER'); setIsProfileOpen(false); }}
                          className={`text-left px-2 py-1 rounded text-[11px] ${user.role === 'CINEMA_MANAGER' ? 'bg-[#E50914]/20 text-white font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                          Manager
                        </button>
                        <button
                          onClick={() => { switchDemoRole('SUPPORT'); setIsProfileOpen(false); }}
                          className={`text-left px-2 py-1 rounded text-[11px] ${user.role === 'SUPPORT' ? 'bg-[#E50914]/20 text-white font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                          Support
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        logout();
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthModalMode('login');
                  setAuthModalOpen(true);
                }}
                className="px-5 py-2 rounded-xl bg-[#E50914] hover:bg-[#FF2E4D] text-white text-xs font-bold tracking-wide shadow-glow transition-all active:scale-95"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setCityModalOpen(true)}
              className="p-2 text-gray-300 hover:text-white"
              title="Select City"
            >
              <MapPin className="w-5 h-5 text-[#E50914]" />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-300 hover:text-white"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden px-4 pt-2 pb-6 space-y-3 bg-[#0D0F14] border-t border-white/10 animate-fade-in">
          <Link
            to="/movies"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5"
          >
            Movies
          </Link>
          <Link
            to="/offers"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5"
          >
            Exclusive Offers
          </Link>
          <Link
            to="/my-bookings"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5"
          >
            My Bookings
          </Link>

          {isAdminOrStaff && (
            <Link
              to="/admin"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-amber-400 bg-amber-500/10"
            >
              Admin Dashboard
            </Link>
          )}

          {user ? (
            <div className="pt-2 border-t border-white/10">
              <div className="px-3 py-1 text-xs text-gray-400">Signed in as {user.name} ({user.role})</div>
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-rose-400 font-semibold"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setAuthModalOpen(true);
              }}
              className="w-full mt-2 py-2.5 rounded-xl bg-[#E50914] text-white font-bold text-center text-sm shadow-glow"
            >
              Sign In
            </button>
          )}
        </div>
      )}
    </header>
  );
};
