import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  ShieldCheck, 
  Ticket, 
  Tag, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  Lock
} from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setAuthModalOpen } = useAuth();
  const { showToast } = useToast();

  const [bookingData, setBookingData] = useState<any>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discountMinorUnits, setDiscountMinorUnits] = useState(0);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('cinematic_checkout_booking');
    if (!raw) {
      navigate('/movies');
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setBookingData(parsed);
    } catch {
      navigate('/movies');
    }
  }, [navigate]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      if (user.phone) setPhone(user.phone);
    }
  }, [user]);

  if (!bookingData) return null;

  const { showtime, seats } = bookingData;
  const subtotalMinorUnits = seats.reduce((acc: number, s: any) => acc + s.priceMinorUnits, 0);
  const taxMinorUnits = Math.round(subtotalMinorUnits * 0.18);
  const convenienceFeeMinorUnits = seats.length * 3000; // ₹30/ticket
  const finalTotalMinorUnits = Math.max(0, subtotalMinorUnits + taxMinorUnits + convenienceFeeMinorUnits - discountMinorUnits);

  // Apply Coupon Handler
  const handleApplyCoupon = async (codeToApply?: string) => {
    const targetCode = (codeToApply || couponCode).trim().toUpperCase();
    if (!targetCode) return;

    try {
      const res = await api.validateCoupon(targetCode, subtotalMinorUnits);
      if (res.success) {
        setAppliedCoupon(res.data);
        setDiscountMinorUnits(res.data.discountMinorUnits);
        showToast(res.message, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Invalid coupon code', 'error');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountMinorUnits(0);
    setCouponCode('');
  };

  // Payment Handler (Razorpay Gateway)
  const handlePayment = async () => {
    if (!user) {
      setAuthModalOpen(true);
      showToast('Please sign in or create an account to complete your booking.', 'info');
      return;
    }

    setLoading(true);

    try {
      // 1. Create booking order on backend
      const bookingRes = await api.createBooking({
        showtimeId: showtime.id,
        seatIds: seats.map((s: any) => s.id),
        couponCode: appliedCoupon?.code
      });

      if (!bookingRes.success) {
        throw new Error(bookingRes.message);
      }

      const { bookingId, razorpayOrderId, amountMinorUnits } = bookingRes.data;

      // 2. Launch Razorpay Checkout
      const options = {
        key: 'rzp_test_CinematicDemoKeyId',
        amount: amountMinorUnits,
        currency: 'INR',
        name: 'CINEMATIC Tickets',
        description: `Booking for ${showtime.movie?.title} (${seats.length} Tickets)`,
        image: 'https://api.dicebear.com/7.x/initials/svg?seed=CINEMATIC&backgroundColor=e50914',
        order_id: razorpayOrderId,
        prefill: {
          name: name || user.name,
          email: email || user.email,
          contact: phone || '+919876543210',
        },
        theme: {
          color: '#E50914',
        },
        handler: async (response: any) => {
          try {
            // 3. Confirm payment on server with cryptographic signature check
            const confirmRes = await api.confirmPayment({
              bookingId,
              razorpayOrderId: response.razorpay_order_id || razorpayOrderId,
              razorpayPaymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
              razorpaySignature: response.razorpay_signature || 'demo_sig_approved_hash_1234567890'
            });

            if (confirmRes.success) {
              sessionStorage.removeItem('cinematic_checkout_booking');
              navigate(`/confirmation/${bookingId}`);
            }
          } catch (confirmErr: any) {
            showToast(confirmErr.message || 'Payment confirmation failed', 'error');
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            showToast('Payment cancelled or abandoned.', 'info');
          }
        }
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Fallback simulation if network blocked checkout.razorpay.com script
        console.warn('Razorpay script not loaded, using fallback verification simulator');
        const confirmRes = await api.confirmPayment({
          bookingId,
          razorpayOrderId,
          razorpayPaymentId: `pay_sim_${Date.now()}`,
          razorpaySignature: 'demo_sig_approved_hash_1234567890'
        });

        if (confirmRes.success) {
          sessionStorage.removeItem('cinematic_checkout_booking');
          navigate(`/confirmation/${bookingId}`);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to initiate checkout', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090C] text-[#F1F5F9] py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Seat Map</span>
        </button>

        <h1 className="text-3xl font-black text-white mb-8">Checkout & Summary</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Details & Contact */}
          <div className="lg:col-span-2 space-y-6">
            {/* Show Details Summary */}
            <div className="p-6 rounded-2xl bg-[#12151B] border border-white/5 shadow-md flex flex-col sm:flex-row gap-5 items-start">
              <img
                src={showtime.movie?.posterUrl}
                alt={showtime.movie?.title}
                className="w-24 h-36 object-cover rounded-xl border border-white/10 shrink-0"
              />
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E50914]/20 border border-[#E50914]/40 text-[#E50914]">
                    {showtime.format.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-400">{showtime.movie?.language}</span>
                </div>

                <h2 className="text-2xl font-bold text-white">{showtime.movie?.title}</h2>
                <div className="text-xs text-gray-300">
                  <span className="font-semibold text-white">{showtime.cinemaName}</span> • {showtime.screenName}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(showtime.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} at{' '}
                  <span className="font-bold text-white">
                    {new Date(showtime.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="pt-2 flex flex-wrap gap-1.5">
                  {seats.map((s: any) => (
                    <span
                      key={s.id}
                      className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-white"
                    >
                      {s.rowLetter}{s.seatNumber} ({s.seatCategory})
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="p-6 rounded-2xl bg-[#12151B] border border-white/5 shadow-md space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Contact Details for E-Ticket</span>
                <span className="text-xs text-gray-400 font-normal">(Sent instantly via email)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0D0F14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#E50914]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0D0F14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#E50914]"
                  />
                </div>
              </div>
            </div>

            {/* Quick Coupons List */}
            <div className="p-6 rounded-2xl bg-[#12151B] border border-white/5 shadow-md">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-[#E50914]" />
                <span>Available Promotional Coupons</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { code: 'CINEMA50', desc: '50% off up to ₹150' },
                  { code: 'BLOCKBUSTER100', desc: 'Flat ₹100 off on premium shows' },
                  { code: 'FIRSTBOOK', desc: '20% off for newcomers' }
                ].map((c) => (
                  <button
                    key={c.code}
                    onClick={() => handleApplyCoupon(c.code)}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#151922] hover:bg-[#1C222E] border border-white/5 hover:border-[#E50914]/40 text-left transition-colors"
                  >
                    <div>
                      <div className="font-mono font-bold text-xs text-[#E50914]">{c.code}</div>
                      <div className="text-[11px] text-gray-400">{c.desc}</div>
                    </div>
                    <span className="text-[11px] font-bold text-white bg-white/10 px-2 py-0.5 rounded">
                      Apply
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Col: Price Breakdown & Pay */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#12151B] border border-white/5 shadow-xl space-y-6 sticky top-28">
              <h3 className="text-lg font-bold text-white pb-3 border-b border-white/10">
                Payment Summary
              </h3>

              {/* Promo Code Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Have a Promo Code?</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="CINEMA50"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#0D0F14] border border-white/10 text-white placeholder-gray-500 text-xs font-mono uppercase focus:outline-none focus:border-[#E50914]"
                  />
                  <button
                    onClick={() => handleApplyCoupon()}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
                  >
                    Apply
                  </button>
                </div>

                {appliedCoupon && (
                  <div className="flex items-center justify-between mt-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-semibold">
                    <span>Applied: {appliedCoupon.code}</span>
                    <button onClick={handleRemoveCoupon} className="text-rose-400 hover:underline">
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Itemized Calculation */}
              <div className="space-y-3 text-xs text-gray-300 pt-2 border-t border-white/5">
                <div className="flex justify-between">
                  <span>Ticket Subtotal ({seats.length} seats)</span>
                  <span className="font-bold text-white">₹{(subtotalMinorUnits / 100).toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Integrated GST (18%)</span>
                  <span>₹{(taxMinorUnits / 100).toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Convenience Fee (₹30/ticket)</span>
                  <span>₹{(convenienceFeeMinorUnits / 100).toFixed(2)}</span>
                </div>

                {discountMinorUnits > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Coupon Discount</span>
                    <span>- ₹{(discountMinorUnits / 100).toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-white/10 text-base font-black text-white">
                  <span>Total Payable Amount</span>
                  <span className="text-2xl text-[#E50914]">
                    ₹{(finalTotalMinorUnits / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Pay Button */}
              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full py-4 rounded-xl bg-[#E50914] hover:bg-[#FF2E4D] text-white font-black text-sm tracking-wide shadow-glow transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>
                  {loading
                    ? 'Connecting Payment Gateway...'
                    : `Pay ₹${(finalTotalMinorUnits / 100).toFixed(2)} with Razorpay`}
                </span>
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Safe & Encrypted Razorpay Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
