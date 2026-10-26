import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Movie, Coupon } from '../types';
import { MovieCard } from '../components/MovieCard';
import { TrailerModal } from '../components/TrailerModal';
import { useCity } from '../context/CityContext';
import { 
  Play, 
  Star, 
  Sparkles, 
  Flame, 
  ChevronRight, 
  Compass, 
  Gift, 
  CheckCircle2, 
  Tv, 
  Clock, 
  Volume2, 
  Armchair 
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { selectedCity } = useCity();
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
  const [nowShowing, setNowShowing] = useState<Movie[]>([]);
  const [comingSoon, setComingSoon] = useState<Movie[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [currentHeroIdx, setCurrentHeroIdx] = useState(0);

  // Trailer Modal State
  const [activeTrailer, setActiveTrailer] = useState<{ key: string; title: string } | null>(null);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [featRes, nowRes, soonRes, coupRes] = await Promise.all([
          api.getFeaturedMovies(),
          api.getMovies({ status: 'now_showing' }),
          api.getMovies({ status: 'coming_soon' }),
          api.getCoupons()
        ]);

        if (featRes.success && featRes.data.length > 0) setFeaturedMovies(featRes.data);
        if (nowRes.success) setNowShowing(nowRes.data);
        if (soonRes.success) setComingSoon(soonRes.data);
        if (coupRes.success) setCoupons(coupRes.data);
      } catch (err) {
        console.error('Failed to load home data:', err);
      }
    };

    loadHomeData();
  }, []);

  // Hero carousel auto-rotate
  useEffect(() => {
    if (featuredMovies.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentHeroIdx((prev) => (prev + 1) % featuredMovies.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [featuredMovies.length]);

  const activeHero = featuredMovies[currentHeroIdx] || nowShowing[0];

  return (
    <div className="min-h-screen bg-[#08090C] text-[#F1F5F9]">
      {/* 1. HERO SPOTLIGHT BANNER */}
      {activeHero && (
        <section className="relative w-full h-[70vh] min-h-[500px] max-h-[700px] overflow-hidden bg-black">
          {/* Backdrop Image */}
          <div className="absolute inset-0">
            <img
              src={activeHero.backdropUrl}
              alt={activeHero.title}
              className="w-full h-full object-cover object-center filter brightness-60 transition-all duration-1000 scale-105"
            />
            {/* Vignette Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#08090C] via-[#08090C]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#08090C] via-[#08090C]/60 to-transparent w-full lg:w-3/4" />
          </div>

          {/* Hero Content */}
          <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-16">
            <div className="max-w-2xl space-y-4 animate-fade-in">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-[#E50914] text-white text-xs font-bold uppercase tracking-wider shadow-glow">
                  Spotlight in {selectedCity?.name || 'Your City'}
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-bold text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>★ {activeHero.rating}/10</span>
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-gray-200">
                  {activeHero.certification}
                </span>
                <span className="text-xs text-gray-300 font-medium">
                  {activeHero.language} • {activeHero.runtimeMinutes} min
                </span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-md">
                {activeHero.title}
              </h1>

              {/* Synopsis */}
              <p className="text-sm sm:text-base text-gray-300 line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow">
                {activeHero.synopsis}
              </p>

              {/* Genres */}
              <div className="flex flex-wrap gap-2 text-xs font-medium text-gray-400">
                {activeHero.genres.map((g) => (
                  <span key={g} className="px-2.5 py-0.5 rounded-md bg-white/5 border border-white/5">
                    {g}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  to={`/movie/${activeHero.slug}`}
                  className="px-8 py-3.5 rounded-xl bg-[#E50914] hover:bg-[#FF2E4D] text-white font-bold text-sm tracking-wide shadow-glow transition-all active:scale-95"
                >
                  Book Tickets Now
                </Link>

                {activeHero.trailerYoutubeKey && (
                  <button
                    onClick={() => setActiveTrailer({ key: activeHero.trailerYoutubeKey!, title: activeHero.title })}
                    className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white font-bold text-sm transition-all"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Watch Trailer</span>
                  </button>
                )}
              </div>
            </div>

            {/* Carousel Indicators */}
            {featuredMovies.length > 1 && (
              <div className="absolute right-4 sm:right-8 bottom-16 flex items-center gap-2">
                {featuredMovies.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentHeroIdx(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      currentHeroIdx === idx ? 'w-8 bg-[#E50914]' : 'w-2 bg-white/30 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 2. NOW SHOWING SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#E50914]/20 border border-[#E50914]/30 text-[#E50914]">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Now Showing in {selectedCity?.name || 'Cinemas'}</h2>
              <p className="text-xs text-gray-400 mt-0.5">Catch the latest blockbusters on giant screens today</p>
            </div>
          </div>
          <Link
            to="/movies?status=now_showing"
            className="flex items-center gap-1 text-xs font-bold text-[#E50914] hover:text-[#FF2E4D] transition-colors"
          >
            <span>See All ({nowShowing.length})</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-5">
          {nowShowing.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onPlayTrailer={(key, title) => setActiveTrailer({ key, title })}
            />
          ))}
        </div>
      </section>

      {/* 3. EXPERIENCE FORMATS BANNER */}
      <section className="w-full bg-[#0D0F14] border-y border-white/5 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold text-[#E50914] uppercase tracking-widest">
              State-of-the-Art Technology
            </span>
            <h2 className="text-3xl font-black text-white mt-1">Immersive Cinema Formats</h2>
            <p className="text-xs text-gray-400 mt-1">
              Custom-engineered sound, laser crystal clarity, and motion seating for uncompromised immersion.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-[#141720] border border-white/5 hover:border-[#E50914]/40 transition-all hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Tv className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white">IMAX® with Laser</h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Floor-to-ceiling custom curved screen with next-gen 4K laser projection and multi-channel precision audio.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#141720] border border-white/5 hover:border-[#E50914]/40 transition-all hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Volume2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white">Dolby Atmos® 3D</h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Sound moves completely around you in three-dimensional space, immersing you deeply inside the film's universe.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#141720] border border-white/5 hover:border-[#E50914]/40 transition-all hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white">4DX® Motion Seating</h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Synchronized motion seats, atmospheric wind, fog, and lightning effects that bring the movie physically to life.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#141720] border border-white/5 hover:border-[#E50914]/40 transition-all hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Armchair className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white">VIP Recliner Lounges</h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Plush leather recliners with USB charging, heated seats, and in-cinema dining delivered right to your seat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ACTIVE PROMO OFFERS */}
      {coupons.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Exclusive Promo Vouchers</h2>
                <p className="text-xs text-gray-400 mt-0.5">Apply discount codes at checkout to save instantly</p>
              </div>
            </div>
            <Link
              to="/offers"
              className="text-xs font-bold text-[#E50914] hover:text-[#FF2E4D] transition-colors"
            >
              View All Offers
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className="relative p-5 rounded-2xl bg-gradient-to-br from-[#151922] to-[#1A1F2B] border border-white/10 hover:border-[#E50914]/50 transition-all shadow-md group"
              >
                <div className="flex items-start justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-[#E50914]/20 border border-[#E50914]/40 text-[#E50914] text-xs font-black tracking-wider uppercase font-mono">
                    {coupon.code}
                  </span>
                  <span className="text-xs font-bold text-amber-400">
                    {coupon.discountPercent}% OFF
                  </span>
                </div>
                <p className="text-sm font-semibold text-white mt-3">
                  {coupon.description}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Min spend: ₹{(coupon.minBookingMinorUnits / 100).toFixed(0)} • Max discount: ₹{(coupon.maxDiscountMinorUnits / 100).toFixed(0)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. COMING SOON SPOTLIGHT */}
      {comingSoon.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Coming Soon to CINEMATIC</h2>
                <p className="text-xs text-gray-400 mt-0.5">Anticipated cinematic masterpieces hitting theatres soon</p>
              </div>
            </div>
            <Link
              to="/movies?status=coming_soon"
              className="text-xs font-bold text-[#E50914] hover:text-[#FF2E4D] transition-colors"
            >
              Explore All
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-5">
            {comingSoon.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onPlayTrailer={(key, title) => setActiveTrailer({ key, title })}
              />
            ))}
          </div>
        </section>
      )}

      {/* Trailer Modal Player */}
      <TrailerModal
        youtubeKey={activeTrailer?.key || null}
        title={activeTrailer?.title || ''}
        isOpen={!!activeTrailer}
        onClose={() => setActiveTrailer(null)}
      />
    </div>
  );
};
