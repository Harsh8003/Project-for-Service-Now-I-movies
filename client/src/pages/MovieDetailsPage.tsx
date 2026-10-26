import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Movie } from '../types';
import { TrailerModal } from '../components/TrailerModal';
import { useCity } from '../context/CityContext';
import { 
  Star, 
  Clock, 
  Calendar, 
  Globe, 
  Play, 
  Ticket, 
  Share2, 
  UserCheck, 
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const MovieDetailsPage: React.FC = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const { selectedCity } = useCity();
  const { showToast } = useToast();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  useEffect(() => {
    const fetchMovie = async () => {
      setLoading(true);
      try {
        const res = await api.getMovieByIdOrSlug(identifier || '');
        if (res.success) {
          setMovie(res.data);
          setReviews(res.data.reviews || []);
        }
      } catch (err: any) {
        showToast(err.message || 'Movie not found', 'error');
        navigate('/movies');
      } finally {
        setLoading(false);
      }
    };

    if (identifier) fetchMovie();
  }, [identifier]);

  if (loading || !movie) {
    return (
      <div className="min-h-screen bg-[#08090C] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Movie link copied to clipboard!', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-[#08090C] text-[#F1F5F9] pb-24">
      {/* 1. HERO BACKDROP SECTION */}
      <section className="relative w-full h-[55vh] min-h-[420px] max-h-[600px] overflow-hidden bg-black">
        <img
          src={movie.backdropUrl}
          alt={movie.title}
          className="w-full h-full object-cover object-center filter brightness-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090C] via-[#08090C]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08090C] via-transparent to-transparent" />

        {/* Floating Quick Action */}
        <div className="absolute top-6 right-6 z-10 flex items-center gap-3">
          <button
            onClick={handleShare}
            className="p-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white hover:text-[#E50914] hover:border-[#E50914] transition-colors"
            title="Share Movie"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 2. MAIN DETAILS CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-44 relative z-20">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left: Poster & Trailer Button */}
          <div className="w-64 sm:w-72 shrink-0 mx-auto lg:mx-0">
            <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl bg-[#12151B]">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
              {movie.trailerYoutubeKey && (
                <button
                  onClick={() => setIsTrailerOpen(true)}
                  className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-glow hover:scale-110 transition-transform"
                >
                  <Play className="w-6 h-6 fill-white ml-0.5" />
                </button>
              )}
            </div>

            {/* Quick Trailer Button below on mobile */}
            {movie.trailerYoutubeKey && (
              <button
                onClick={() => setIsTrailerOpen(true)}
                className="w-full mt-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Watch Trailer</span>
              </button>
            )}
          </div>

          {/* Right: Info & Showtimes Action */}
          <div className="flex-1 space-y-6">
            <div>
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>★ {movie.rating} / 10 ({movie.voteCount} reviews)</span>
                </span>
                <span className="px-2.5 py-1 rounded-md bg-white/10 text-xs font-bold text-white">
                  {movie.certification}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                  {movie.isNowShowing ? 'Now In Cinemas' : 'Advance Booking'}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                {movie.title}
              </h1>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-300 font-medium mt-3">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-gray-400" />
                  {movie.language}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  {movie.runtimeMinutes} minutes
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  Released {new Date(movie.releaseDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-2 mt-4">
                {movie.genres.map((g) => (
                  <span
                    key={g}
                    className="px-3 py-1 rounded-lg bg-[#141720] border border-white/5 text-xs text-gray-300 font-semibold"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>

            {/* Book Tickets CTA Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-[#181D26] to-[#12151B] border border-[#E50914]/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Experience {movie.title} in {selectedCity?.name}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  IMAX 3D, Dolby Atmos, and 4DX screens available with live seat selection
                </p>
              </div>
              <Link
                to={`/showtimes?movie=${movie.id}`}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#E50914] hover:bg-[#FF2E4D] text-white font-bold text-sm tracking-wide shadow-glow transition-all active:scale-95 text-center shrink-0"
              >
                Select Showtimes & Seats
              </Link>
            </div>

            {/* Synopsis */}
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Synopsis</h3>
              <p className="text-sm text-gray-300 leading-relaxed max-w-3xl">
                {movie.synopsis}
              </p>
            </div>

            {/* Director & Cast */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <h3 className="text-lg font-bold text-white">Cast & Crew</h3>
              {movie.director && (
                <div className="text-xs text-gray-300">
                  <span className="text-gray-400">Director: </span>
                  <span className="font-bold text-white">{movie.director}</span>
                </div>
              )}

              {movie.cast && movie.cast.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {movie.cast.map((actor) => (
                    <div
                      key={actor.id}
                      className="p-3 rounded-xl bg-[#12151B] border border-white/5 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#1A1F2B] border border-white/10 flex items-center justify-center text-gray-400 font-bold shrink-0 text-xs">
                        {actor.name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-white truncate">{actor.name}</div>
                        <div className="text-[11px] text-gray-400 truncate">{actor.character}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trailer Modal Player */}
      <TrailerModal
        youtubeKey={movie.trailerYoutubeKey || null}
        title={movie.title}
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
      />
    </div>
  );
};
