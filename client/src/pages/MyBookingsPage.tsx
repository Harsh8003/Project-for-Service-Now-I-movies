import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Booking } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Ticket, 
  Calendar, 
  Clock, 
  MapPin, 
  QrCode, 
  XCircle, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowRight 
} from 'lucide-react';

export const MyBookingsPage: React.FC = () => {
  const { user, setAuthModalOpen } = useAuth();
  const { showToast } = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  // QR Modal State
  const [selectedQRBooking, setSelectedQRBooking] = useState<Booking | null>(null);

  // Cancel Modal State
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('Change of schedule');
  const [cancelling, setCancelling] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.getMyBookings();
      if (res.success) {
        setBookings(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load user bookings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBookings();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleExecuteCancel = async () => {
    if (!cancelModalBooking) return;
    setCancelling(true);

    try {
      const res = await api.cancelBooking(cancelModalBooking.id, cancelReason);
      if (res.success) {
        showToast(
          `Booking cancelled. Refund of ₹${(res.data.refundAmountMinorUnits / 100).toFixed(2)} initiated.`,
          'success'
        );
        setCancelModalBooking(null);
        fetchBookings();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel booking', 'error');
    } finally {
      setCancelling(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#08090C] text-[#F1F5F9] py-20">
        <div className="max-w-md mx-auto px-4 text-center space-y-4">
          <Ticket className="w-12 h-12 text-[#E50914] mx-auto" />
          <h2 className="text-2xl font-bold text-white">Sign in to view your bookings</h2>
          <p className="text-xs text-gray-400">
            Access your active cinema tickets, scannable QR passes, and cancellation options.
          </p>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="px-6 py-3 rounded-xl bg-[#E50914] text-white font-bold text-xs shadow-glow"
          >
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  const now = new Date();
  const upcomingBookings = bookings.filter((b) => {
    const showTime = new Date(b.showStartTime || b.createdAt);
    return showTime >= now && b.status === 'CONFIRMED';
  });

  const pastBookings = bookings.filter((b) => {
    const showTime = new Date(b.showStartTime || b.createdAt);
    return showTime < now || b.status !== 'CONFIRMED';
  });

  const displayedBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  return (
    <div className="min-h-screen bg-[#08090C] text-[#F1F5F9] py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">My Movie Tickets</h1>
            <p className="text-xs text-gray-400 mt-1">
              View your booking history, digital passes, and manage cancellations
            </p>
          </div>

          {/* Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-[#12151B] border border-white/10 w-fit">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'upcoming'
                  ? 'bg-[#E50914] text-white shadow-glow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Upcoming ({upcomingBookings.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'past'
                  ? 'bg-[#E50914] text-white shadow-glow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Past & Cancelled ({pastBookings.length})
            </button>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-[#12151B] animate-pulse" />
            ))}
          </div>
        ) : displayedBookings.length > 0 ? (
          <div className="space-y-5">
            {displayedBookings.map((b) => {
              const seatNames = b.seats.map((s) => s.seatIdentifier).join(', ');
              const isConfirmed = b.status === 'CONFIRMED';
              const isCancelled = b.status === 'CANCELLED' || b.status === 'REFUNDED';

              return (
                <div
                  key={b.id}
                  className="p-6 rounded-2xl bg-[#12151B] border border-white/5 hover:border-white/10 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#E50914] bg-[#E50914]/15 px-2 py-0.5 rounded">
                        Ref: {b.bookingReference}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          isConfirmed
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : isCancelled
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {b.status}
                      </span>
                      <span className="text-xs text-gray-400">
                        {b.format?.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white">{b.movieTitle}</h3>
                    <div className="text-xs text-gray-300">
                      <span className="font-semibold text-white">{b.cinemaName}</span> ({b.screenName})
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        {new Date(b.showStartTime || '').toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <span className="flex items-center gap-1 font-bold text-white">
                        <Clock className="w-3.5 h-3.5 text-gray-500" />
                        {new Date(b.showStartTime || '').toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span>
                        Seats: <strong className="text-white">{seatNames}</strong> ({b.seats.length} tickets)
                      </span>
                      <span>
                        Paid: <strong className="text-[#E50914]">₹{(b.totalAmountMinorUnits / 100).toFixed(2)}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    {isConfirmed && (
                      <>
                        <button
                          onClick={() => setSelectedQRBooking(b)}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors"
                        >
                          <QrCode className="w-4 h-4 text-[#E50914]" />
                          <span>View QR Ticket</span>
                        </button>

                        <button
                          onClick={() => setCancelModalBooking(b)}
                          className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-bold transition-colors"
                        >
                          Cancel Booking
                        </button>
                      </>
                    )}

                    <Link
                      to={`/confirmation/${b.id}`}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                      title="View Full E-Ticket"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center bg-[#12151B] rounded-2xl border border-white/5">
            <Ticket className="w-10 h-10 text-gray-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No {activeTab} bookings</h3>
            <p className="text-xs text-gray-400 mt-1">
              Explore current movie releases and book the best seats now.
            </p>
            <Link
              to="/movies"
              className="inline-block mt-4 px-6 py-2.5 rounded-xl bg-[#E50914] text-white text-xs font-bold shadow-glow"
            >
              Discover Movies
            </Link>
          </div>
        )}
      </div>

      {/* QR Code Pass Modal */}
      {selectedQRBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-sm p-6 rounded-2xl glass-dropdown border border-white/10 text-center space-y-4 animate-fade-in">
            <button
              onClick={() => setSelectedQRBooking(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white">{selectedQRBooking.movieTitle}</h3>
            <p className="text-xs text-gray-400">
              Ref: {selectedQRBooking.bookingReference} • Seats: {selectedQRBooking.seats.map(s => s.seatIdentifier).join(', ')}
            </p>

            <div className="bg-white p-4 rounded-xl inline-block shadow-lg">
              {selectedQRBooking.qrCodeDataUrl ? (
                <img src={selectedQRBooking.qrCodeDataUrl} alt="QR Code" className="w-48 h-48" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-black font-mono text-xs">
                  {selectedQRBooking.bookingReference}
                </div>
              )}
            </div>

            <p className="text-[11px] text-gray-400 font-mono">Present at cinema turnstile for rapid check-in</p>
          </div>
        </div>
      )}

      {/* Cancellation Policy & Execution Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md p-6 rounded-2xl glass-dropdown border border-white/10 space-y-4 animate-fade-in">
            <button
              onClick={() => setCancelModalBooking(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-black text-white">Cancel Movie Ticket?</h3>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to cancel your booking for{' '}
              <strong className="text-white">{cancelModalBooking.movieTitle}</strong>?
            </p>

            {/* Refund Policy Calculation */}
            <div className="p-4 rounded-xl bg-[#0D0F14] border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Total Booking Amount</span>
                <span>₹{(cancelModalBooking.totalAmountMinorUnits / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>Refund Eligibility (75%)</span>
                <span>
                  + ₹{((cancelModalBooking.totalAmountMinorUnits * 0.75) / 100).toFixed(2)}
                </span>
              </div>
              <div className="text-[11px] text-gray-500 pt-1 border-t border-white/5">
                * Refunds are credited back to the original source method (Razorpay) within 2-4 business days.
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Reason for Cancellation</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0D0F14] border border-white/10 text-white text-xs focus:outline-none"
              >
                <option value="Change of schedule">Change of schedule</option>
                <option value="Booked by mistake">Booked wrong movie or time</option>
                <option value="Personal emergency">Personal emergency</option>
                <option value="Found alternative showtime">Found another cinema</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setCancelModalBooking(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition-colors"
              >
                Keep Booking
              </button>

              <button
                onClick={handleExecuteCancel}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                {cancelling ? 'Processing Refund...' : 'Confirm & Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
