import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Coupon } from '../types';
import { Tag, Copy, Check, Clock, Sparkles } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const OffersPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await api.getCoupons();
        if (res.success) {
          setCoupons(res.data);
        }
      } catch (err) {
        console.error('Failed to load coupons', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  const handleCopy = (code: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      showToast(`Coupon code ${code} copied to clipboard!`, 'success');
      setTimeout(() => setCopiedCode(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090C] text-[#F1F5F9] py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Exclusive Entertainment Vouchers</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Movie Deals & Offers</h1>
          <p className="text-xs text-gray-400 mt-2">
            Save on blockbuster tickets, premium IMAX formats, and weekend shows. Apply coupon at checkout.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-[#12151B] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className="relative flex flex-col justify-between p-6 rounded-2xl bg-gradient-to-br from-[#12151B] to-[#181D26] border border-white/10 hover:border-[#E50914]/50 transition-all shadow-xl group hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-[#E50914]">
                      {coupon.discountPercent}% OFF
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/5 text-[10px] font-bold text-gray-400">
                      Active
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-white">{coupon.description}</h3>
                  <p className="text-xs text-gray-400 mt-2">
                    Min order: ₹{(coupon.minBookingMinorUnits / 100).toFixed(0)} • Max discount: ₹{(coupon.maxDiscountMinorUnits / 100).toFixed(0)}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between">
                  <div className="font-mono font-bold text-sm text-white bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
                    {coupon.code}
                  </div>

                  <button
                    onClick={() => handleCopy(coupon.code)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E50914] hover:bg-[#FF2E4D] text-white text-xs font-bold transition-all shadow-glow active:scale-95"
                  >
                    {copiedCode === coupon.code ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
