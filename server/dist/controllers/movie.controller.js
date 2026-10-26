"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovieController = void 0;
const store_js_1 = require("../db/store.js");
const tmdb_service_js_1 = require("../services/tmdb.service.js");
class MovieController {
    static async getMovies(req, res) {
        const { search, genre, language, status, sortBy } = req.query;
        let movies = Array.from(store_js_1.store.movies.values());
        // Search filter
        if (search && typeof search === 'string') {
            const q = search.toLowerCase();
            movies = movies.filter(m => m.title.toLowerCase().includes(q) ||
                m.genres.some(g => g.toLowerCase().includes(q)) ||
                (m.director && m.director.toLowerCase().includes(q)));
        }
        // Genre filter
        if (genre && typeof genre === 'string' && genre !== 'All') {
            movies = movies.filter(m => m.genres.some(g => g.toLowerCase() === genre.toLowerCase()));
        }
        // Language filter
        if (language && typeof language === 'string' && language !== 'All') {
            movies = movies.filter(m => m.language.toLowerCase() === language.toLowerCase());
        }
        // Status filter
        if (status === 'now_showing') {
            movies = movies.filter(m => m.isNowShowing);
        }
        else if (status === 'coming_soon') {
            movies = movies.filter(m => m.isComingSoon);
        }
        else if (status === 'featured') {
            movies = movies.filter(m => m.isFeatured);
        }
        // Sorting
        if (sortBy === 'rating') {
            movies.sort((a, b) => b.rating - a.rating);
        }
        else if (sortBy === 'releaseDate') {
            movies.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
        }
        else {
            // default popularity / voteCount
            movies.sort((a, b) => b.voteCount - a.voteCount);
        }
        res.json({
            success: true,
            count: movies.length,
            data: movies
        });
    }
    static async getMovieByIdOrSlug(req, res) {
        const { identifier } = req.params;
        const movie = Array.from(store_js_1.store.movies.values()).find(m => m.id === identifier || m.slug === identifier);
        if (!movie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found.'
            });
        }
        // Reviews for this movie
        const movieReviews = store_js_1.store.reviews.filter(r => r.movieId === movie.id);
        res.json({
            success: true,
            data: {
                ...movie,
                reviews: movieReviews
            }
        });
    }
    static async getFeatured(req, res) {
        const featured = Array.from(store_js_1.store.movies.values()).filter(m => m.isFeatured);
        res.json({
            success: true,
            data: featured
        });
    }
    static async getTrailer(req, res) {
        const { id } = req.params;
        const movie = store_js_1.store.movies.get(id);
        if (!movie) {
            return res.status(404).json({ success: false, message: 'Movie not found' });
        }
        let youtubeKey = movie.trailerYoutubeKey;
        if (!youtubeKey && movie.tmdbId) {
            youtubeKey = await tmdb_service_js_1.TMDBService.getMovieTrailers(movie.tmdbId);
        }
        res.json({
            success: true,
            data: {
                trailerYoutubeKey: youtubeKey || 'Way9Dexny3w'
            }
        });
    }
}
exports.MovieController = MovieController;
