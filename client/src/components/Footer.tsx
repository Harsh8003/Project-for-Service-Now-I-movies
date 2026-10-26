import React from 'react';
import { Link } from 'react-router-dom';
import { Film, ShieldCheck, CreditCard, Sparkles, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#060709] border-t border-white/5 pt-16 pb-12 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/5">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E50914] to-[#FF4B2B] flex items-center justify-center text-white shadow-glow">
                <Film className="w-4 h-4" />
              </div>
              <span className="font-display font-black text-2xl tracking-wider text-white">
                CINEMATIC<span className="text-[#E50914]">.</span>
              </span>
            </Link>
            <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
              India's premier movie ticketing platform. Elevate your cinematic journey with IMAX Laser 3D, Dolby Atmos surround sound, real-time seat locks, and instant refunds.
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-400 pt-2">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-4 h-4" /> 256-Bit SSL Secured
              </span>
              <span className="flex items-center gap-1.5 text-sky-400">
                <CreditCard className="w-4 h-4" /> Razorpay Verified
              </span>
            </div>
          </div>

          {/* Formats Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Cinematic Formats</h4>
            <ul className="space-y-2 text-xs">
              <li><span className="hover:text-white transition-colors cursor-pointer">IMAX® with Laser</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">4DX® Motion Seating</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Dolby Atmos® 3D Audio</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Director's Cut Recliner Lounges</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">In-Seat Gourmet Dining</span></li>
            </ul>
          </div>

          {/* Navigation Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Explore</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/movies" className="hover:text-white transition-colors">Now Showing</Link></li>
              <li><Link to="/movies?status=coming_soon" className="hover:text-white transition-colors">Coming Soon</Link></li>
              <li><Link to="/offers" className="hover:text-white transition-colors">Promo Vouchers & Deals</Link></li>
              <li><Link to="/my-bookings" className="hover:text-white transition-colors">My Tickets & QR Pass</Link></li>
              <li><Link to="/help" className="hover:text-white transition-colors">Help Centre & FAQs</Link></li>
            </ul>
          </div>

          {/* Policies & Compliance */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Legal & Trust</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/cancellation-policy" className="hover:text-white transition-colors">Cancellation & Refund Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/help" className="hover:text-white transition-colors">Support & Grievances</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-4">
          <p>© {new Date().getFullYear()} CINEMATIC Entertainment Ltd. All rights reserved.</p>
          <div className="flex items-center gap-1 text-gray-400">
            <span>Crafted for true movie lovers with</span>
            <Heart className="w-3.5 h-3.5 text-[#E50914] fill-[#E50914]" />
            <span>in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
