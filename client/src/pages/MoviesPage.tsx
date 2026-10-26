import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { Movie } from '../types';
import { MovieCard } from '../components/MovieCard';
import { TrailerModal } from '../components/TrailerModal';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';

const GENRES = ['All', 'Action', 'Sci-Fi', 'Adventure', 'Drama', 'Animation', 'Biography', 'Comedy'];
const LANGUAGES = ['All', 'English', 'Hindi', 'Tamil', 'Telugu'];

export const MoviesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || 'All');
  const [selectedLanguage, setSelectedLanguage] = useState(searchParams.get('language') || 'All');
  const [status, setStatus] = useState(searchParams.get('status') || 'now_showing');
  const [sortBy, setSortBy] = useState('popularity');

  // Trailer state
  const [activeTrailer, setActiveTrailer] = useState<{ key: string; title: string } | null>(null);

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        const res = await api.getMovies({
          search,
          genre: selectedGenre,
          language: selectedLanguage,
          status,
          sortBy
        });

        if (res.success) {
          setMovies(res.data);
        }
      } catch (err) {
        console.error('Failed to load movies:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [search, selectedGenre, selectedLanguage, status, sortBy]);

  return (
    <div className="min-h-screen bg-[#08090C] text-[#F1F5F9] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-white/5">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white">Movie Discovery</h1>
            <p className="text-xs text-gray-400 mt-1">
              Browse cinematic listings, filter by languages, genres, and experiences
            </p>
          </div>

          {/* Status Tabs (Now Showing vs Coming Soon) */}
          <div className="flex items-center p-1 rounded-xl bg-[#12151B] border border-white/10 w-fit">
            <button
              onClick={() => setStatus('now_showing')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                status === 'now_showing'
                  ? 'bg-[#E50914] text-white shadow-glow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Now Showing
            </button>
            <button
              onClick={() => setStatus('coming_soon')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                status === 'coming_soon'
                  ? 'bg-[#E50914] text-white shadow-glow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Coming Soon
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="py-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, genre, director..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#12151B] border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-[#E50914]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Language Selector */}
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-[#12151B] border border-white/10 text-xs font-semibold text-gray-200 focus:outline-none focus:border-[#E50914]"
            >
              <option value="All">All Languages</option>
              {LANGUAGES.filter((l) => l !== 'All').map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-[#12151B] border border-white/10 text-xs font-semibold text-gray-200 focus:outline-none focus:border-[#E50914]"
            >
              <option value="popularity">Most Popular</option>
              <option value="rating">Top Rated (IMDb)</option>
              <option value="releaseDate">Release Date</option>
            </select>
          </div>
        </div>

        {/* Genre Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-6">
          {GENRES.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                selectedGenre === genre
                  ? 'bg-white text-black font-bold'
                  : 'bg-[#141720] border border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Movie Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-[2/3] bg-[#12151B] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : movies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onPlayTrailer={(key, title) => setActiveTrailer({ key, title })}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <Filter className="w-10 h-10 text-gray-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No movies match your filters</h3>
            <p className="text-xs text-gray-400 mt-1">Try resetting the genre, language or search term.</p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedGenre('All');
                setSelectedLanguage('All');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-[#E50914] text-white text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      <TrailerModal
        youtubeKey={activeTrailer?.key || null}
        title={activeTrailer?.title || ''}
        isOpen={!!activeTrailer}
        onClose={() => setActiveTrailer(null)}
      />
    </div>
  );
};
