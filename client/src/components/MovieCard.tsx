import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Play, Calendar } from 'lucide-react';
import { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
  onPlayTrailer?: (key: string, title: string) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onPlayTrailer }) => {
  return (
    <div className="group relative flex flex-col bg-[#12151B] border border-white/5 rounded-2xl overflow-hidden hover:border-[#E50914]/50 transition-all duration-300 hover:shadow-glow hover:-translate-y-1">
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#1A1E26]">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#12151B] via-transparent to-transparent opacity-80" />

        {/* Rating Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-xs font-bold text-amber-400">
          <Star className="w-3.5 h-3.5 fill-amber-400" />
          <span>{movie.rating}</span>
        </div>

        {/* Certification Badge */}
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider">
          {movie.certification}
        </div>

        {/* Trailer Button Overlay */}
        {movie.trailerYoutubeKey && onPlayTrailer && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onPlayTrailer(movie.trailerYoutubeKey!, movie.title);
            }}
            className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-[#E50914]/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100 shadow-glow"
            title="Watch Trailer"
          >
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </button>
        )}
      </div>

      {/* Movie Details */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium mb-1 truncate">
            <span>{movie.language}</span>
            <span>•</span>
            <span>{movie.runtimeMinutes} min</span>
          </div>

          <Link to={`/movie/${movie.slug}`}>
            <h3 className="font-bold text-base text-white group-hover:text-[#E50914] transition-colors line-clamp-1">
              {movie.title}
            </h3>
          </Link>

          <p className="text-xs text-gray-400 mt-1 line-clamp-1">
            {movie.genres.join(', ')}
          </p>
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
          {movie.isNowShowing ? (
            <Link
              to={`/movie/${movie.slug}`}
              className="w-full py-2 rounded-xl bg-[#E50914] hover:bg-[#FF2E4D] text-white text-xs font-bold text-center tracking-wide transition-all shadow-glow active:scale-[0.98]"
            >
              Book Tickets
            </Link>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-amber-400/90 font-medium py-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Releases {new Date(movie.releaseDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
