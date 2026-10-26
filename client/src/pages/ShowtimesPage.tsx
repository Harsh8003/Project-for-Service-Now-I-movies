import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Movie, Showtime, Cinema } from '../types';
import { useCity } from '../context/CityContext';
import { 
  Calendar, 
  MapPin, 
  Sparkles, 
  ChevronRight, 
  Clock, 
  Info,
  SlidersHorizontal 
} from 'lucide-react';

export const ShowtimesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const movieIdParam = searchParams.get('movie');
  const { selectedCity, setCityModalOpen } = useCity();
  const navigate = useNavigate();

  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [groupedShowtimes, setGroupedShowtimes] = useState<{ cinema: Cinema; showtimes: Showtime[] }[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate Date Filter (Today + next 4 days)
  const today = new Date();
  const dates = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return {
      isoDate: d.toISOString().split('T')[0],
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateNum: d.getDate(),
      monthName: d.toLocaleDateString('en-US', { month: 'short' })
    };
  });

  const [selectedDate, setSelectedDate] = useState(dates[0].isoDate);
  const [selectedFormat, setSelectedFormat] = useState('ALL');

  // Load Movies list to allow quick switching
  useEffect(() => {
    const initMovies = async () => {
      try {
        const res = await api.getMovies({ status: 'now_showing' });
        if (res.success) {
          setMovies(res.data);
          if (movieIdParam) {
            const matched = res.data.find((m: Movie) => m.id === movieIdParam || m.slug === movieIdParam);
            if (matched) setSelectedMovie(matched);
            else setSelectedMovie(res.data[0]);
          } else {
            setSelectedMovie(res.data[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load movies for showtimes:', err);
      }
    };

    initMovies();
  }, [movieIdParam]);

  // Load showtimes whenever selectedMovie, selectedCity, selectedDate, or format changes
  useEffect(() => {
    if (!selectedMovie || !selectedCity) return;

    const fetchShowtimes = async () => {
      setLoading(true);
      try {
        const res = await api.getShowtimes({
          movieId: selectedMovie.id,
          cityId: selectedCity.id,
          date: selectedDate,
          format: selectedFormat
        });

        if (res.success) {
          setGroupedShowtimes(res.data);
        }
      } catch (err) {
        console.error('Failed to load showtimes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchShowtimes();
  }, [selectedMovie, selectedCity, selectedDate, selectedFormat]);

  return (
    <div className="min-h-screen bg-[#08090C] text-[#F1F5F9] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header & Movie Selection Bar */}
        <div className="p-6 rounded-2xl bg-[#12151B] border border-white/5 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {selectedMovie && (
              <div className="flex items-center gap-4">
                <img
                  src={selectedMovie.posterUrl}
                  alt={selectedMovie.title}
                  className="w-16 h-24 object-cover rounded-xl border border-white/10 shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold text-[10px]">
                      {selectedMovie.certification}
                    </span>
                    <span>{selectedMovie.language}</span>
                    <span>•</span>
                    <span>{selectedMovie.runtimeMinutes} min</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
                    {selectedMovie.title}
                  </h1>
                  <p className="text-xs text-gray-400 mt-1">
                    {selectedMovie.genres.join(', ')}
                  </p>
                </div>
              </div>
            )}

            {/* City Selector Prompt */}
            <div className="flex items-center gap-3 self-start md:self-auto">
              <div className="text-right hidden sm:block">
                <div className="text-xs text-gray-400">Showing In</div>
                <div className="text-sm font-bold text-white">{selectedCity?.name}</div>
              </div>
              <button
                onClick={() => setCityModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-[#1A1F2B] hover:bg-[#252C3D] border border-white/10 text-xs font-bold text-gray-200 flex items-center gap-2 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-[#E50914]" />
                <span>Change City</span>
              </button>
            </div>
          </div>

          {/* Quick Movie Pill Switcher */}
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs font-bold text-gray-400 shrink-0 mr-2">Change Movie:</span>
            {movies.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMovie(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                  selectedMovie?.id === m.id
                    ? 'bg-[#E50914] text-white font-bold shadow-glow'
                    : 'bg-[#181D26] text-gray-300 hover:text-white hover:bg-[#202733]'
                }`}
              >
                {m.title}
              </button>
            ))}
          </div>
        </div>

        {/* Date Selector & Format Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          {/* Horizontal Date Picker */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            {dates.map((d) => {
              const isSelected = selectedDate === d.isoDate;
              return (
                <button
                  key={d.isoDate}
                  onClick={() => setSelectedDate(d.isoDate)}
                  className={`flex flex-col items-center justify-center min-w-[72px] py-2.5 px-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-[#E50914] border-[#E50914] text-white shadow-glow'
                      : 'bg-[#12151B] border-white/5 text-gray-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <span className="text-[11px] font-semibold">{d.dayName}</span>
                  <span className="text-lg font-black text-white">{d.dateNum}</span>
                  <span className="text-[10px] uppercase font-bold">{d.monthName}</span>
                </button>
              );
            })}
          </div>

          {/* Format Selector */}
          <div className="flex items-center gap-2">
            {['ALL', 'IMAX_3D', 'DOLBY_ATMOS', 'STANDARD_2D'].map((fmt) => (
              <button
                key={fmt}
                onClick={() => setSelectedFormat(fmt)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedFormat === fmt
                    ? 'bg-white text-black'
                    : 'bg-[#12151B] border border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {fmt === 'ALL' ? 'All Formats' : fmt.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Cinema & Showtimes List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 rounded-2xl bg-[#12151B] animate-pulse" />
            ))}
          </div>
        ) : groupedShowtimes.length > 0 ? (
          <div className="space-y-5">
            {groupedShowtimes.map(({ cinema, showtimes }) => (
              <div
                key={cinema.id}
                className="p-6 rounded-2xl bg-[#12151B] border border-white/5 hover:border-white/10 transition-all shadow-md"
              >
                {/* Cinema Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
                  <div>
                    <h3 className="font-bold text-lg text-white">{cinema.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{cinema.address}</p>
                  </div>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-1.5">
                    {cinema.amenities.slice(0, 3).map((amenity) => (
                      <span
                        key={amenity}
                        className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-medium text-gray-300"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Showtime Pills */}
                <div className="pt-4">
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Available Showtimes:
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {showtimes.map((st) => {
                      const startTime = new Date(st.startTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      });

                      return (
                        <button
                          key={st.id}
                          onClick={() => navigate(`/seats/${st.id}`)}
                          className="group relative flex flex-col p-3 rounded-xl bg-[#181D26] hover:bg-[#E50914] border border-white/10 hover:border-[#E50914] text-left transition-all hover:shadow-glow hover:scale-105 active:scale-95 min-w-[120px]"
                        >
                          <div className="font-bold text-sm text-white group-hover:text-white">
                            {startTime}
                          </div>
                          <div className="text-[11px] text-gray-400 group-hover:text-white/90 font-medium mt-0.5">
                            {st.format.replace('_', ' ')}
                          </div>
                          <div className="text-[10px] text-amber-400 group-hover:text-amber-200 font-bold mt-1">
                            ₹{(st.basePriceMinorUnits / 100).toFixed(0)} onwards
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-[#12151B] rounded-2xl border border-white/5">
            <Clock className="w-10 h-10 text-gray-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No showtimes found</h3>
            <p className="text-xs text-gray-400 mt-1">
              There are no matching schedules for this date and format in {selectedCity?.name}.
            </p>
            <button
              onClick={() => {
                setSelectedFormat('ALL');
                setSelectedDate(dates[0].isoDate);
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-[#E50914] text-white text-xs font-bold shadow-glow"
            >
              Reset Date & Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
