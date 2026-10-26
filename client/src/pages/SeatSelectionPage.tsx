import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { api } from '../services/api';
import { Showtime, SeatWithStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  ArrowLeft, 
  Clock, 
  ShieldCheck, 
  Tv, 
  Info, 
  Sparkles, 
  AlertCircle 
} from 'lucide-react';

export const SeatSelectionPage: React.FC = () => {
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [showtime, setShowtime] = useState<Showtime | null>(null);
  const [screen, setScreen] = useState<any>(null);
  const [seats, setSeats] = useState<SeatWithStatus[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // 10-Minute Hold Countdown Timer (in seconds)
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const guestIdRef = useRef<string>(localStorage.getItem('cinematic_guest_id') || `guest_${Date.now()}`);

  useEffect(() => {
    localStorage.setItem('cinematic_guest_id', guestIdRef.current);
  }, []);

  // Fetch initial seat matrix
  useEffect(() => {
    if (!showtimeId) return;

    const fetchSeats = async () => {
      setLoading(true);
      try {
        const res = await api.getSeats(showtimeId);
        if (res.success) {
          setShowtime(res.data.showtime);
          setScreen(res.data.screen);
          setSeats(res.data.seats);
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to load seats', 'error');
        navigate('/movies');
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
  }, [showtimeId]);

  // Socket.IO Real-Time Seat Synchronization
  useEffect(() => {
    if (!showtimeId) return;

    // Connect to WebSocket — in production, connect to the deployed backend URL
    const socketUrl = import.meta.env.VITE_API_URL || '/';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.emit('join-showtime', showtimeId);

    socket.on('seat-update', (event: any) => {
      setSeats((prevSeats) =>
        prevSeats.map((seat) => {
          if (event.seatIds.includes(seat.id)) {
            if (event.type === 'SEATS_LOCKED') {
              const isLockedByMe = (user && event.lockedByUserId === user.id) || event.lockedByUserId === guestIdRef.current;
              return {
                ...seat,
                status: 'LOCKED',
                lockedByUserId: event.lockedByUserId,
                lockedUntil: event.lockedUntil
              };
            } else if (event.type === 'SEATS_RELEASED') {
              return {
                ...seat,
                status: 'AVAILABLE',
                lockedByUserId: null,
                lockedUntil: null
              };
            } else if (event.type === 'SEATS_BOOKED') {
              return {
                ...seat,
                status: 'BOOKED',
                lockedByUserId: null,
                lockedUntil: null
              };
            }
          }
          return seat;
        })
      );
    });

    return () => {
      socket.emit('leave-showtime', showtimeId);
      socket.disconnect();
    };
  }, [showtimeId, user]);

  // Hold Timer Ticker
  useEffect(() => {
    if (timerSeconds === null || timerSeconds <= 0) return;

    const timer = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          // Release locks upon expiry
          if (showtimeId && selectedSeatIds.length > 0) {
            api.releaseSeats(showtimeId, selectedSeatIds, user?.id || guestIdRef.current);
            setSelectedSeatIds([]);
            showToast('Your 10-minute seat hold has expired. Please reselect your seats.', 'error');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerSeconds, showtimeId, selectedSeatIds, user]);

  // Seat Click Handler
  const handleSeatClick = async (seat: SeatWithStatus) => {
    if (seat.status === 'BOOKED') return;

    const isLockedByOther =
      seat.status === 'LOCKED' &&
      seat.lockedByUserId !== (user?.id || guestIdRef.current) &&
      !selectedSeatIds.includes(seat.id);

    if (isLockedByOther) {
      showToast('This seat is currently held by another customer.', 'info');
      return;
    }

    const isAlreadySelected = selectedSeatIds.includes(seat.id);
    const newSelectedIds = isAlreadySelected
      ? selectedSeatIds.filter((id) => id !== seat.id)
      : [...selectedSeatIds, seat.id];

    if (newSelectedIds.length > 8) {
      showToast('Maximum 8 seats can be selected per booking.', 'info');
      return;
    }

    // Call Backend Lock API
    try {
      if (newSelectedIds.length > 0) {
        const res = await api.lockSeats(
          showtimeId!,
          newSelectedIds,
          user?.id || guestIdRef.current
        );

        if (res.success) {
          setSelectedSeatIds(newSelectedIds);
          // Reset 10-minute hold timer
          setTimerSeconds(600);
        }
      } else {
        // Release all
        await api.releaseSeats(
          showtimeId!,
          selectedSeatIds,
          user?.id || guestIdRef.current
        );
        setSelectedSeatIds([]);
        setTimerSeconds(null);
      }
    } catch (err: any) {
      showToast(err.message || 'Seat conflict: already selected by another user.', 'error');
      // Refresh seats
      const refreshed = await api.getSeats(showtimeId!);
      if (refreshed.success) setSeats(refreshed.data.seats);
    }
  };

  // Group seats by Category & Row Letter for realistic cinema tier rendering
  const reclinerSeats = seats.filter((s) => s.seatCategory === 'RECLINER');
  const primeSeats = seats.filter((s) => s.seatCategory === 'PRIME');
  const classicSeats = seats.filter((s) => s.seatCategory === 'CLASSIC');

  const groupRows = (seatList: SeatWithStatus[]) => {
    const rowMap = new Map<string, SeatWithStatus[]>();
    seatList.forEach((s) => {
      if (!rowMap.has(s.rowLetter)) rowMap.set(s.rowLetter, []);
      rowMap.get(s.rowLetter)!.push(s);
    });
    return Array.from(rowMap.entries()).sort(([a], [b]) => a.localeCompare(b));
  };

  // Total amount calculation
  const selectedSeatsObjects = seats.filter((s) => selectedSeatIds.includes(s.id));
  const subtotalMinorUnits = selectedSeatsObjects.reduce((acc, s) => acc + s.priceMinorUnits, 0);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const handleProceed = () => {
    if (selectedSeatIds.length === 0) {
      showToast('Please select at least one seat to proceed.', 'info');
      return;
    }

    // Store in session storage for checkout revalidation
    sessionStorage.setItem(
      'cinematic_checkout_booking',
      JSON.stringify({
        showtimeId,
        seatIds: selectedSeatIds,
        showtime,
        seats: selectedSeatsObjects
      })
    );

    navigate('/checkout');
  };

  if (loading || !showtime) {
    return (
      <div className="min-h-screen bg-[#08090C] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08090C] text-[#F1F5F9] pb-36">
      {/* 1. TOP HEADER */}
      <div className="bg-[#0D0F14] border-b border-white/5 py-4 sticky top-20 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span>{showtime.movie?.title}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-gray-300">
                  {showtime.format.replace('_', ' ')}
                </span>
              </h1>
              <p className="text-xs text-gray-400">
                {showtime.cinemaName} • {new Date(showtime.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} • {new Date(showtime.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Hold Countdown Timer */}
          {timerSeconds !== null && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#E50914]/15 border border-[#E50914]/40 text-[#E50914] text-xs font-bold animate-pulse">
              <Clock className="w-4 h-4" />
              <span>Held for {formatTimer(timerSeconds)}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. SEAT LEGEND */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-300">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#1E2330] border border-white/20" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#E50914] border border-[#E50914] shadow-glow" />
            <span className="font-bold text-white">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/30 border border-amber-500/50" />
            <span>Held by another</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#14161C] border border-white/5 opacity-40 cursor-not-allowed" />
            <span>Booked / Sold</span>
          </div>
        </div>
      </div>

      {/* 3. CINEMA CURVED SCREEN VISUALIZER */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="relative text-center">
          {/* Curved glowing screen representation */}
          <svg className="w-full h-12 cinema-screen-glow" viewBox="0 0 500 40">
            <path
              d="M 20,35 Q 250,5 480,35"
              fill="none"
              stroke="#E50914"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest -mt-4">
            All Eyes This Way — Screen
          </div>
        </div>
      </div>

      {/* 4. INTERACTIVE SEAT GRID */}
      <div className="max-w-4xl mx-auto px-4 space-y-8 overflow-x-auto">
        {/* Tier 1: Recliner VIP Lounge */}
        {reclinerSeats.length > 0 && (
          <div className="space-y-3">
            <div className="text-center">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                VIP Recliner Tier — ₹{(reclinerSeats[0].priceMinorUnits / 100).toFixed(0)}
              </span>
            </div>
            <div className="flex flex-col items-center gap-2.5">
              {groupRows(reclinerSeats).map(([rowLetter, rowSeats]) => (
                <div key={rowLetter} className="flex items-center gap-2">
                  <span className="w-5 text-xs font-bold text-gray-400 text-center">{rowLetter}</span>
                  <div className="flex items-center gap-2.5">
                    {rowSeats.map((seat) => {
                      const isSelected = selectedSeatIds.includes(seat.id);
                      const isBooked = seat.status === 'BOOKED';
                      const isLocked = seat.status === 'LOCKED' && !isSelected;

                      return (
                        <button
                          key={seat.id}
                          disabled={isBooked}
                          onClick={() => handleSeatClick(seat)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-[#E50914] text-white shadow-glow scale-110'
                              : isBooked
                              ? 'bg-[#14161C] border border-white/5 text-gray-600 opacity-40 cursor-not-allowed'
                              : isLocked
                              ? 'bg-amber-500/30 border border-amber-500/50 text-amber-300'
                              : 'bg-[#1E2330] hover:bg-[#2A3142] border border-white/10 text-gray-200 hover:scale-105'
                          }`}
                          title={`${rowLetter}${seat.seatNumber} — ₹${(seat.priceMinorUnits / 100).toFixed(0)}`}
                        >
                          {seat.seatNumber}
                        </button>
                      );
                    })}
                  </div>
                  <span className="w-5 text-xs font-bold text-gray-400 text-center">{rowLetter}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tier 2: Prime Tier */}
        {primeSeats.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-white/5">
            <div className="text-center">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider bg-white/5 px-3 py-1 rounded-full border border-white/10">
                Prime Tier — ₹{(primeSeats[0].priceMinorUnits / 100).toFixed(0)}
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              {groupRows(primeSeats).map(([rowLetter, rowSeats]) => (
                <div key={rowLetter} className="flex items-center gap-2">
                  <span className="w-5 text-xs font-bold text-gray-400 text-center">{rowLetter}</span>
                  <div className="flex items-center gap-2">
                    {rowSeats.map((seat) => {
                      const isSelected = selectedSeatIds.includes(seat.id);
                      const isBooked = seat.status === 'BOOKED';
                      const isLocked = seat.status === 'LOCKED' && !isSelected;

                      return (
                        <button
                          key={seat.id}
                          disabled={isBooked}
                          onClick={() => handleSeatClick(seat)}
                          className={`w-7 h-7 rounded-md text-xs font-bold flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-[#E50914] text-white shadow-glow scale-110'
                              : isBooked
                              ? 'bg-[#14161C] border border-white/5 text-gray-600 opacity-40 cursor-not-allowed'
                              : isLocked
                              ? 'bg-amber-500/30 border border-amber-500/50 text-amber-300'
                              : 'bg-[#181D26] hover:bg-[#222A38] border border-white/10 text-gray-300 hover:scale-105'
                          }`}
                          title={`${rowLetter}${seat.seatNumber} — ₹${(seat.priceMinorUnits / 100).toFixed(0)}`}
                        >
                          {seat.seatNumber}
                        </button>
                      );
                    })}
                  </div>
                  <span className="w-5 text-xs font-bold text-gray-400 text-center">{rowLetter}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tier 3: Classic Tier */}
        {classicSeats.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-white/5">
            <div className="text-center">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-white/5 px-3 py-1 rounded-full border border-white/10">
                Classic Tier — ₹{(classicSeats[0].priceMinorUnits / 100).toFixed(0)}
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              {groupRows(classicSeats).map(([rowLetter, rowSeats]) => (
                <div key={rowLetter} className="flex items-center gap-2">
                  <span className="w-5 text-xs font-bold text-gray-400 text-center">{rowLetter}</span>
                  <div className="flex items-center gap-2">
                    {rowSeats.map((seat) => {
                      const isSelected = selectedSeatIds.includes(seat.id);
                      const isBooked = seat.status === 'BOOKED';
                      const isLocked = seat.status === 'LOCKED' && !isSelected;

                      return (
                        <button
                          key={seat.id}
                          disabled={isBooked}
                          onClick={() => handleSeatClick(seat)}
                          className={`w-7 h-7 rounded-md text-xs font-bold flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-[#E50914] text-white shadow-glow scale-110'
                              : isBooked
                              ? 'bg-[#14161C] border border-white/5 text-gray-600 opacity-40 cursor-not-allowed'
                              : isLocked
                              ? 'bg-amber-500/30 border border-amber-500/50 text-amber-300'
                              : 'bg-[#181D26] hover:bg-[#222A38] border border-white/10 text-gray-300 hover:scale-105'
                          }`}
                          title={`${rowLetter}${seat.seatNumber} — ₹${(seat.priceMinorUnits / 100).toFixed(0)}`}
                        >
                          {seat.seatNumber}
                        </button>
                      );
                    })}
                  </div>
                  <span className="w-5 text-xs font-bold text-gray-400 text-center">{rowLetter}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. STICKY BOTTOM BOOKING SUMMARY BAR */}
      {selectedSeatIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-[#0D0F14]/95 backdrop-blur-xl border-t border-white/10 shadow-2xl animate-slide-up">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-left">
              <div>
                <div className="text-xs text-gray-400 font-medium">Selected Seats ({selectedSeatIds.length})</div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedSeatsObjects.map((s) => (
                    <span
                      key={s.id}
                      className="px-2 py-0.5 rounded-md bg-[#E50914]/20 border border-[#E50914]/40 text-xs font-bold text-white"
                    >
                      {s.rowLetter}{s.seatNumber}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-l border-white/10 pl-4 hidden sm:block">
                <div className="text-xs text-gray-400 font-medium">Ticket Price</div>
                <div className="text-xl font-black text-white">
                  ₹{(subtotalMinorUnits / 100).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="sm:hidden text-left flex-1">
                <div className="text-xs text-gray-400">Total</div>
                <div className="text-lg font-black text-white">₹{(subtotalMinorUnits / 100).toFixed(2)}</div>
              </div>

              <button
                onClick={handleProceed}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#E50914] hover:bg-[#FF2E4D] text-white font-bold text-sm tracking-wide shadow-glow transition-all active:scale-95 text-center"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
