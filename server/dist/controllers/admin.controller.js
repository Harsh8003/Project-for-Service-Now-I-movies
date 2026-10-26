"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const zod_1 = require("zod");
const store_js_1 = require("../db/store.js");
const movieSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required'),
    synopsis: zod_1.z.string().min(1, 'Synopsis is required'),
    posterUrl: zod_1.z.string().url('Invalid poster URL'),
    backdropUrl: zod_1.z.string().url('Invalid backdrop URL'),
    trailerYoutubeKey: zod_1.z.string().optional(),
    runtimeMinutes: zod_1.z.number().int().positive(),
    certification: zod_1.z.string().default('UA'),
    releaseDate: zod_1.z.string(),
    language: zod_1.z.string().default('English'),
    genres: zod_1.z.array(zod_1.z.string()).min(1),
    rating: zod_1.z.number().min(0).max(10).default(8.5),
    isFeatured: zod_1.z.boolean().default(false),
    isNowShowing: zod_1.z.boolean().default(true),
    isComingSoon: zod_1.z.boolean().default(false),
    director: zod_1.z.string().optional()
});
const showtimeSchema = zod_1.z.object({
    movieId: zod_1.z.string().min(1),
    screenId: zod_1.z.string().min(1),
    startTime: zod_1.z.string().min(1),
    endTime: zod_1.z.string().min(1),
    basePriceMinorUnits: zod_1.z.number().int().positive()
});
class AdminController {
    static async getKPIs(req, res) {
        const allBookings = Array.from(store_js_1.store.bookings.values());
        const confirmedBookings = allBookings.filter(b => b.status === 'CONFIRMED');
        const totalRevenueMinorUnits = confirmedBookings.reduce((sum, b) => sum + b.totalAmountMinorUnits, 0);
        const totalTicketsSold = confirmedBookings.reduce((sum, b) => sum + b.seats.length, 0);
        const totalSeatsInSystem = Array.from(store_js_1.store.seats.values()).length;
        const occupancyRate = totalSeatsInSystem > 0 ? Math.min(100, Math.round((totalTicketsSold / totalSeatsInSystem) * 100)) : 42;
        res.json({
            success: true,
            data: {
                totalRevenueMinorUnits,
                totalRevenueFormatted: `₹${(totalRevenueMinorUnits / 100).toLocaleString('en-IN')}`,
                totalBookings: allBookings.length,
                confirmedBookingsCount: confirmedBookings.length,
                totalTicketsSold,
                occupancyRate: `${occupancyRate}%`,
                activeMoviesCount: Array.from(store_js_1.store.movies.values()).filter(m => m.isNowShowing).length,
                cinemasCount: store_js_1.store.cinemas.size,
                screensCount: store_js_1.store.screens.size
            }
        });
    }
    static async getAllBookings(req, res) {
        const bookings = Array.from(store_js_1.store.bookings.values())
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        res.json({
            success: true,
            data: bookings
        });
    }
    static async createMovie(req, res) {
        const data = movieSchema.parse(req.body);
        const movieId = `mov_${Date.now()}`;
        const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const newMovie = {
            id: movieId,
            slug,
            voteCount: 1,
            ...data
        };
        store_js_1.store.movies.set(movieId, newMovie);
        store_js_1.store.auditLogs.unshift({
            id: `audit_${Date.now()}`,
            userId: req.user?.id,
            userEmail: req.user?.email,
            action: 'MOVIE_CREATED',
            resource: 'Movie',
            details: `Added new movie "${newMovie.title}" (${newMovie.id})`,
            createdAt: new Date().toISOString()
        });
        res.status(201).json({
            success: true,
            message: 'Movie listed successfully.',
            data: newMovie
        });
    }
    static async deleteMovie(req, res) {
        const { id } = req.params;
        const movie = store_js_1.store.movies.get(id);
        if (!movie) {
            return res.status(404).json({ success: false, message: 'Movie not found' });
        }
        store_js_1.store.movies.delete(id);
        store_js_1.store.auditLogs.unshift({
            id: `audit_${Date.now()}`,
            userId: req.user?.id,
            userEmail: req.user?.email,
            action: 'MOVIE_DELETED',
            resource: 'Movie',
            details: `Deleted movie "${movie.title}" (${movie.id})`,
            createdAt: new Date().toISOString()
        });
        res.json({
            success: true,
            message: 'Movie deleted successfully.'
        });
    }
    static async createShowtime(req, res) {
        const data = showtimeSchema.parse(req.body);
        const movie = store_js_1.store.movies.get(data.movieId);
        const screen = store_js_1.store.screens.get(data.screenId);
        if (!movie || !screen) {
            return res.status(400).json({ success: false, message: 'Invalid movie or screen ID' });
        }
        const cinema = store_js_1.store.cinemas.get(screen.cinemaId);
        const showtimeId = `show_${Date.now()}`;
        const newShowtime = {
            id: showtimeId,
            movieId: movie.id,
            screenId: screen.id,
            cinemaId: screen.cinemaId,
            cinemaName: cinema?.name,
            cityId: cinema?.cityId,
            cityName: store_js_1.store.cities.get(cinema?.cityId || '')?.name,
            screenName: screen.name,
            startTime: data.startTime,
            endTime: data.endTime,
            format: screen.screenType,
            basePriceMinorUnits: data.basePriceMinorUnits,
            status: 'SCHEDULED',
            movie
        };
        store_js_1.store.showtimes.set(showtimeId, newShowtime);
        store_js_1.store.bookedSeats.set(showtimeId, new Set());
        store_js_1.store.auditLogs.unshift({
            id: `audit_${Date.now()}`,
            userId: req.user?.id,
            userEmail: req.user?.email,
            action: 'SHOWTIME_SCHEDULED',
            resource: 'Showtime',
            details: `Scheduled ${movie.title} at ${screen.name} for ${data.startTime}`,
            createdAt: new Date().toISOString()
        });
        res.status(201).json({
            success: true,
            message: 'Showtime scheduled successfully.',
            data: newShowtime
        });
    }
    static async getAuditLogs(req, res) {
        res.json({
            success: true,
            data: store_js_1.store.auditLogs
        });
    }
}
exports.AdminController = AdminController;
