import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { Booking } from '../types';
import { 
  CheckCircle2, 
  Download, 
  Printer, 
  MapPin, 
  Calendar, 
  Clock, 
  Ticket, 
  Share2, 
  ArrowRight 
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const ConfirmationPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    // Launch festive confetti
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });

    const fetchBooking = async () => {
      try {
        const res = await api.getBookingById(bookingId || '');
        if (res.success) {
          setBooking(res.data);
        }
      } catch (err) {
        console.error('Failed to load booking details', err);
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) fetchBooking();
  }, [bookingId]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `Hey, I just booked tickets for ${booking?.movieTitle} at ${booking?.cinemaName}! Reference: ${booking?.bookingReference}`
      );
      showToast('Booking summary copied to clipboard!', 'success');
    }
  };

  if (loading || !booking) {
    return (
      <div className="min-h-screen bg-[#08090C] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const seatNames = booking.seats.map((s) => s.seatIdentifier).join(', ');

  return (
    <div className="min-h-screen bg-[#08090C] text-[#F1F5F9] py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Success Banner */}
        <div className="text-center space-y-3 mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mb-2 shadow-2xl">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Booking Confirmed!</h1>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Your e-ticket has been sent to your email. Please show this digital QR ticket at the cinema entry gate.
          </p>
        </div>

        {/* Cinematic Digital E-Ticket Card */}
        <div className="relative rounded-3xl bg-[#12151B] border border-white/10 overflow-hidden shadow-2xl print:border-none print:shadow-none animate-slide-up">
          {/* Ticket Header */}
          <div className="p-6 bg-gradient-to-r from-[#E50914] to-[#B30710] text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                <span className="font-display font-black text-lg tracking-wider">CINEMATIC PASS</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-xs font-mono font-bold tracking-wider">
                {booking.bookingReference}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black mt-4">{booking.movieTitle}</h2>
            <div className="text-xs font-semibold opacity-90 mt-1">
              {booking.format?.replace('_', ' ')} • Certified {booking.showtime?.movie?.certification || 'UA'}
            </div>
          </div>

          {/* Ticket Body with Details & QR */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4 text-xs">
                <div>
                  <div className="text-gray-400 font-medium">Cinema & Screen</div>
                  <div className="font-bold text-white text-sm mt-0.5">{booking.cinemaName}</div>
                  <div className="text-gray-400">{booking.screenName}</div>
                </div>

                <div>
                  <div className="text-gray-400 font-medium">Date & Showtime</div>
                  <div className="font-bold text-white text-sm mt-0.5">
                    {new Date(booking.showStartTime || '').toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="text-[#E50914] font-bold">
                    {new Date(booking.showStartTime || '').toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-gray-400 font-medium">Selected Seats ({booking.seats.length})</div>
                  <div className="font-black text-white text-base mt-0.5 tracking-wider text-[#E50914]">
                    {seatNames}
                  </div>
                </div>

                <div>
                  <div className="text-gray-400 font-medium">Amount Paid</div>
                  <div className="font-bold text-white text-sm mt-0.5">
                    ₹{(booking.totalAmountMinorUnits / 100).toFixed(2)} ({booking.paymentStatus})
                  </div>
                </div>
              </div>

              {/* Scannable High-Definition QR Code */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#0D0F14] border border-white/5 text-center">
                {booking.qrCodeDataUrl ? (
                  <img
                    src={booking.qrCodeDataUrl}
                    alt="Ticket QR Code"
                    className="w-40 h-40 rounded-xl bg-white p-2 shadow-lg"
                  />
                ) : (
                  <div className="w-40 h-40 rounded-xl bg-white flex items-center justify-center text-black font-mono text-xs">
                    {booking.bookingReference}
                  </div>
                )}
                <div className="text-[11px] font-mono text-gray-400 mt-3 font-semibold">
                  SCAN FOR FAST VENUE ENTRY
                </div>
              </div>
            </div>

            {/* Perforated separator edge representation */}
            <div className="relative border-t-2 border-dashed border-white/10 pt-4 flex items-center justify-between text-xs text-gray-400">
              <span>Booked on {new Date(booking.createdAt).toLocaleString()}</span>
              <span className="text-emerald-400 font-bold">Verified Ticket</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#141720] hover:bg-[#1E2330] border border-white/10 text-white font-bold text-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print E-Ticket</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#141720] hover:bg-[#1E2330] border border-white/10 text-white font-bold text-xs transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Booking</span>
          </button>

          <Link
            to="/my-bookings"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#E50914] hover:bg-[#FF2E4D] text-white font-bold text-xs shadow-glow transition-all"
          >
            <span>View in My Bookings</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
