import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Shield, 
  DollarSign, 
  Ticket, 
  Users, 
  Film, 
  Calendar, 
  Trash2, 
  Plus, 
  History, 
  Clock,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Movie, Booking } from '../types';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'kpis' | 'bookings' | 'movies' | 'scheduler' | 'audit'>('kpis');
  const [kpis, setKpis] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Movie Form State
  const [newMovie, setNewMovie] = useState({
    title: '',
    synopsis: '',
    posterUrl: '',
    backdropUrl: '',
    trailerYoutubeKey: '',
    runtimeMinutes: 150,
    certification: 'UA',
    releaseDate: new Date().toISOString().split('T')[0],
    language: 'Hindi',
    genres: 'Action, Drama',
    rating: 8.5
  });

  // New Showtime Form State
  const [newShowtime, setNewShowtime] = useState({
    movieId: '',
    screenId: 'scr_cin_1_1',
    startTime: '',
    endTime: '',
    basePriceMinorUnits: 35000
  });

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [kpiRes, bookRes, movRes, auditRes] = await Promise.all([
        api.getAdminKPIs(),
        api.getAdminBookings(),
        api.getMovies(),
        api.getAuditLogs()
      ]);

      if (kpiRes.success) setKpis(kpiRes.data);
      if (bookRes.success) setBookings(bookRes.data);
      if (movRes.success) {
        setMovies(movRes.data);
        if (movRes.data.length > 0) {
          setNewShowtime(prev => ({ ...prev, movieId: movRes.data[0].id }));
        }
      }
      if (auditRes.success) setAuditLogs(auditRes.data);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      showToast(err.message || 'Failed to load admin dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && ['ADMIN', 'CINEMA_MANAGER', 'SUPPORT'].includes(user.role)) {
      loadAdminData();
    }
  }, [user]);

  const handleCreateMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...newMovie,
        genres: newMovie.genres.split(',').map(g => g.trim()),
        runtimeMinutes: Number(newMovie.runtimeMinutes),
        rating: Number(newMovie.rating),
        isFeatured: true,
        isNowShowing: true
      };

      const res = await api.createMovie(payload);
      if (res.success) {
        showToast(`Movie "${newMovie.title}" added to listings!`, 'success');
        setNewMovie({
          title: '',
          synopsis: '',
          posterUrl: '',
          backdropUrl: '',
          trailerYoutubeKey: '',
          runtimeMinutes: 150,
          certification: 'UA',
          releaseDate: new Date().toISOString().split('T')[0],
          language: 'Hindi',
          genres: 'Action, Drama',
          rating: 8.5
        });
        loadAdminData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to add movie', 'error');
    }
  };

  const handleDeleteMovie = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete listing for "${title}"?`)) return;
    try {
      const res = await api.deleteMovie(id);
      if (res.success) {
        showToast(`Movie deleted.`, 'success');
        loadAdminData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete movie', 'error');
    }
  };

  const handleCreateShowtime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShowtime.startTime) {
      showToast('Please select start date and time', 'error');
      return;
    }

    try {
      const start = new Date(newShowtime.startTime);
      const end = new Date(start.getTime() + 180 * 60 * 1000);

      const res = await api.createShowtime({
        movieId: newShowtime.movieId,
        screenId: newShowtime.screenId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        basePriceMinorUnits: Number(newShowtime.basePriceMinorUnits)
      });

      if (res.success) {
        showToast('Showtime scheduled successfully!', 'success');
        loadAdminData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to schedule showtime', 'error');
    }
  };

  if (!user || !['ADMIN', 'CINEMA_MANAGER', 'SUPPORT'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-[#08090C] text-[#F1F5F9] py-20 text-center">
        <Shield className="w-12 h-12 text-[#E50914] mx-auto mb-3" />
        <h2 className="text-2xl font-black text-white">Restricted Access</h2>
        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
          This dashboard requires Administrator, Cinema Manager, or Support permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08090C] text-[#F1F5F9] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#E50914]/20 border border-[#E50914]/40 text-[#E50914]">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Operations & Admin Portal</h1>
              <p className="text-xs text-gray-400">
                Logged in as <strong className="text-white">{user.name}</strong> ({user.role})
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'kpis', label: 'Overview & KPIs' },
              { id: 'bookings', label: `Bookings (${bookings.length})` },
              { id: 'movies', label: `Movies (${movies.length})` },
              { id: 'scheduler', label: 'Showtime Scheduler' },
              { id: 'audit', label: 'Audit Trail' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#E50914] text-white shadow-glow'
                    : 'bg-[#12151B] border border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 1. OVERVIEW & KPIS */}
        {activeTab === 'kpis' && kpis && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-6 rounded-2xl bg-[#12151B] border border-white/5 shadow-md">
                <div className="flex items-center justify-between text-emerald-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Gross Revenue</span>
                  <DollarSign className="w-5 h-5" />
                </div>
                <div className="text-3xl font-black text-white">{kpis.totalRevenueFormatted}</div>
                <p className="text-[11px] text-gray-400 mt-1">Calculated from confirmed tickets</p>
              </div>

              <div className="p-6 rounded-2xl bg-[#12151B] border border-white/5 shadow-md">
                <div className="flex items-center justify-between text-blue-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Bookings</span>
                  <Ticket className="w-5 h-5" />
                </div>
                <div className="text-3xl font-black text-white">{kpis.totalBookings}</div>
                <p className="text-[11px] text-gray-400 mt-1">{kpis.confirmedBookingsCount} confirmed orders</p>
              </div>

              <div className="p-6 rounded-2xl bg-[#12151B] border border-white/5 shadow-md">
                <div className="flex items-center justify-between text-amber-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Seat Occupancy</span>
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-3xl font-black text-white">{kpis.occupancyRate}</div>
                <p className="text-[11px] text-gray-400 mt-1">{kpis.totalTicketsSold} tickets booked</p>
              </div>

              <div className="p-6 rounded-2xl bg-[#12151B] border border-white/5 shadow-md">
                <div className="flex items-center justify-between text-purple-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Active Movies</span>
                  <Film className="w-5 h-5" />
                </div>
                <div className="text-3xl font-black text-white">{kpis.activeMoviesCount}</div>
                <p className="text-[11px] text-gray-400 mt-1">Across {kpis.cinemasCount} cinemas</p>
              </div>
            </div>
          </div>
        )}

        {/* 2. BOOKINGS & REFUNDS TABLE */}
        {activeTab === 'bookings' && (
          <div className="rounded-2xl bg-[#12151B] border border-white/5 overflow-hidden shadow-xl">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold text-base text-white">Customer Transaction Log</h3>
              <span className="text-xs text-gray-400">{bookings.length} total entries</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0D0F14] text-gray-400 border-b border-white/5">
                  <tr>
                    <th className="p-4">Reference</th>
                    <th className="p-4">Movie</th>
                    <th className="p-4">Cinema & Screen</th>
                    <th className="p-4">Seats</th>
                    <th className="p-4">Total Paid</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono font-bold text-[#E50914]">{b.bookingReference}</td>
                      <td className="p-4 font-bold text-white">{b.movieTitle}</td>
                      <td className="p-4 text-gray-300">{b.cinemaName} ({b.screenName})</td>
                      <td className="p-4 text-white font-medium">{b.seats.map(s => s.seatIdentifier).join(', ')}</td>
                      <td className="p-4 font-bold text-emerald-400">₹{(b.totalAmountMinorUnits / 100).toFixed(2)}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            b.status === 'CONFIRMED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400">{new Date(b.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. MOVIES MANAGEMENT */}
        {activeTab === 'movies' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create Movie Form */}
            <div className="p-6 rounded-2xl bg-[#12151B] border border-white/5 shadow-xl space-y-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#E50914]" />
                <span>Add New Movie Listing</span>
              </h3>

              <form onSubmit={handleCreateMovie} className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gladiator II"
                    value={newMovie.title}
                    onChange={(e) => setNewMovie({ ...newMovie, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0D0F14] border border-white/10 text-white focus:outline-none focus:border-[#E50914]"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Synopsis</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Brief description..."
                    value={newMovie.synopsis}
                    onChange={(e) => setNewMovie({ ...newMovie, synopsis: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0D0F14] border border-white/10 text-white focus:outline-none focus:border-[#E50914]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-400 mb-1 font-semibold">Poster URL</label>
                    <input
                      type="url"
                      required
                      placeholder="https://..."
                      value={newMovie.posterUrl}
                      onChange={(e) => setNewMovie({ ...newMovie, posterUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0D0F14] border border-white/10 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1 font-semibold">Backdrop URL</label>
                    <input
                      type="url"
                      required
                      placeholder="https://..."
                      value={newMovie.backdropUrl}
                      onChange={(e) => setNewMovie({ ...newMovie, backdropUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0D0F14] border border-white/10 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-gray-400 mb-1 font-semibold">Runtime (min)</label>
                    <input
                      type="number"
                      required
                      value={newMovie.runtimeMinutes}
                      onChange={(e) => setNewMovie({ ...newMovie, runtimeMinutes: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0D0F14] border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1 font-semibold">Cert</label>
                    <select
                      value={newMovie.certification}
                      onChange={(e) => setNewMovie({ ...newMovie, certification: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0D0F14] border border-white/10 text-white"
                    >
                      <option value="U">U</option>
                      <option value="UA">UA</option>
                      <option value="A">A</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1 font-semibold">Language</label>
                    <input
                      type="text"
                      value={newMovie.language}
                      onChange={(e) => setNewMovie({ ...newMovie, language: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0D0F14] border border-white/10 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Genres (comma separated)</label>
                  <input
                    type="text"
                    value={newMovie.genres}
                    onChange={(e) => setNewMovie({ ...newMovie, genres: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0D0F14] border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">YouTube Trailer Key</label>
                  <input
                    type="text"
                    placeholder="e.g. Way9Dexny3w"
                    value={newMovie.trailerYoutubeKey}
                    onChange={(e) => setNewMovie({ ...newMovie, trailerYoutubeKey: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0D0F14] border border-white/10 text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#E50914] hover:bg-[#FF2E4D] text-white font-bold tracking-wide shadow-glow transition-all"
                >
                  Save Movie Listing
                </button>
              </form>
            </div>

            {/* Existing Movies List */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="font-bold text-base text-white">Current Movie Catalog</h3>
              <div className="space-y-3">
                {movies.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl bg-[#12151B] border border-white/5 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <img src={m.posterUrl} alt={m.title} className="w-12 h-16 object-cover rounded-lg shrink-0" />
                      <div>
                        <h4 className="font-bold text-sm text-white">{m.title}</h4>
                        <div className="text-xs text-gray-400">
                          {m.language} • {m.certification} • {m.genres.join(', ')} • ★ {m.rating}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteMovie(m.id, m.title)}
                      className="p-2 text-gray-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                      title="Delete Listing"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. SHOWTIME SCHEDULER */}
        {activeTab === 'scheduler' && (
          <div className="max-w-xl mx-auto p-6 rounded-2xl bg-[#12151B] border border-white/5 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#E50914]" />
              <span>Schedule New Movie Showtime</span>
            </h3>

            <form onSubmit={handleCreateShowtime} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">Select Movie</label>
                <select
                  value={newShowtime.movieId}
                  onChange={(e) => setNewShowtime({ ...newShowtime, movieId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0D0F14] border border-white/10 text-white font-bold"
                >
                  {movies.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">Select Screen / Audi</label>
                <select
                  value={newShowtime.screenId}
                  onChange={(e) => setNewShowtime({ ...newShowtime, screenId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0D0F14] border border-white/10 text-white"
                >
                  <option value="scr_cin_1_1">Audi 1 — IMAX Laser 3D (CINEMATIC Megaplex Mumbai)</option>
                  <option value="scr_cin_1_2">Audi 2 — Dolby Atmos 3D (CINEMATIC Megaplex Mumbai)</option>
                  <option value="scr_cin_2_1">Audi 1 — 4DX Motion (CINEMATIC Luxe BKC)</option>
                  <option value="scr_cin_3_1">Audi 1 — Director's Cut Recliners (Ambience Mall Delhi)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">Start Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={newShowtime.startTime}
                  onChange={(e) => setNewShowtime({ ...newShowtime, startTime: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0D0F14] border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">Base Price (paise, e.g. 35000 = ₹350)</label>
                <input
                  type="number"
                  required
                  value={newShowtime.basePriceMinorUnits}
                  onChange={(e) => setNewShowtime({ ...newShowtime, basePriceMinorUnits: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0D0F14] border border-white/10 text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#E50914] hover:bg-[#FF2E4D] text-white font-bold text-xs shadow-glow transition-all"
              >
                Schedule Showtime
              </button>
            </form>
          </div>
        )}

        {/* 5. AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="rounded-2xl bg-[#12151B] border border-white/5 p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <History className="w-5 h-5 text-[#E50914]" />
              <span>Administrative & Security Audit Logs</span>
            </h3>

            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-[#0D0F14] border border-white/5 flex items-start justify-between gap-4 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white uppercase font-mono text-[11px] bg-white/10 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                      <span className="text-gray-400">{log.userEmail || 'System'}</span>
                    </div>
                    {log.details && (
                      <p className="text-gray-300 mt-1">{log.details}</p>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-500 shrink-0">
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
