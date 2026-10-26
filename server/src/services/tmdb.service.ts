import axios from 'axios';
import { env } from '../config/env.js';
import { MovieDTO } from '../types/index.js';
import { store } from '../db/store.js';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class TMDBService {
  private static baseUrl = 'https://api.themoviedb.org/3';
  private static cache = new Map<string, CacheEntry<any>>();
  private static defaultTTL = 3600 * 1000; // 1 hour cache

  private static getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  private static setCache<T>(key: string, data: T, ttl = this.defaultTTL) {
    this.cache.set(key, { data, expiresAt: Date.now() + ttl });
  }

  public static async getPopularMovies(): Promise<MovieDTO[]> {
    // If TMDB API key is missing, return high-fidelity seed movies
    if (!env.TMDB_API_KEY) {
      return Array.from(store.movies.values());
    }

    const cacheKey = 'tmdb_popular';
    const cached = this.getFromCache<MovieDTO[]>(cacheKey);
    if (cached) return cached;

    try {
      const res = await axios.get(`${this.baseUrl}/movie/popular`, {
        params: { api_key: env.TMDB_API_KEY, language: 'en-US', page: 1 },
        timeout: 4000
      });

      const movies: MovieDTO[] = res.data.results.slice(0, 10).map((m: any) => ({
        id: `tmdb_${m.id}`,
        tmdbId: m.id,
        title: m.title,
        slug: m.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        synopsis: m.overview || 'No synopsis provided.',
        posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
        backdropUrl: m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=85',
        runtimeMinutes: 145,
        certification: 'UA',
        releaseDate: m.release_date || '2024-01-01',
        language: m.original_language === 'hi' ? 'Hindi' : 'English',
        genres: ['Action', 'Drama', 'Adventure'],
        rating: Number(m.vote_average.toFixed(1)),
        voteCount: m.vote_count,
        isFeatured: true,
        isNowShowing: true,
        isComingSoon: false,
        trailerYoutubeKey: 'Way9Dexny3w'
      }));

      this.setCache(cacheKey, movies);
      return movies;
    } catch (err) {
      console.warn('[TMDBService] Failed to query TMDB API, using fallback store:', (err as Error).message);
      return Array.from(store.movies.values());
    }
  }

  public static async getMovieTrailers(tmdbId: number): Promise<string | null> {
    if (!env.TMDB_API_KEY) return null;

    const cacheKey = `trailer_${tmdbId}`;
    const cached = this.getFromCache<string>(cacheKey);
    if (cached) return cached;

    try {
      const res = await axios.get(`${this.baseUrl}/movie/${tmdbId}/videos`, {
        params: { api_key: env.TMDB_API_KEY },
        timeout: 4000
      });

      const trailer = res.data.results.find((v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
      if (trailer) {
        this.setCache(cacheKey, trailer.key);
        return trailer.key;
      }
      return null;
    } catch (err) {
      return null;
    }
  }
}
