"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CinemaController = void 0;
const store_js_1 = require("../db/store.js");
class CinemaController {
    static async getCities(req, res) {
        const cities = Array.from(store_js_1.store.cities.values());
        res.json({
            success: true,
            data: cities
        });
    }
    static async getCinemas(req, res) {
        const { cityId } = req.query;
        let cinemas = Array.from(store_js_1.store.cinemas.values());
        if (cityId && typeof cityId === 'string') {
            cinemas = cinemas.filter(c => c.cityId === cityId);
        }
        res.json({
            success: true,
            data: cinemas
        });
    }
    static async getShowtimes(req, res) {
        const { movieId, cityId, date, format } = req.query;
        let showtimes = Array.from(store_js_1.store.showtimes.values());
        if (movieId && typeof movieId === 'string') {
            showtimes = showtimes.filter(s => s.movieId === movieId);
        }
        if (cityId && typeof cityId === 'string') {
            showtimes = showtimes.filter(s => s.cityId === cityId);
        }
        if (date && typeof date === 'string') {
            // date formatted as YYYY-MM-DD
            showtimes = showtimes.filter(s => s.startTime.startsWith(date));
        }
        if (format && typeof format === 'string' && format !== 'ALL') {
            showtimes = showtimes.filter(s => s.format === format);
        }
        // Group showtimes by Cinema for clean UI display
        const cinemaMap = new Map();
        showtimes.forEach(st => {
            const cinema = store_js_1.store.cinemas.get(st.cinemaId);
            if (!cinema)
                return;
            if (!cinemaMap.has(st.cinemaId)) {
                cinemaMap.set(st.cinemaId, {
                    cinema,
                    screens: [],
                    showtimes: []
                });
            }
            cinemaMap.get(st.cinemaId).showtimes.push(st);
        });
        res.json({
            success: true,
            data: Array.from(cinemaMap.values())
        });
    }
    static async getShowtimeById(req, res) {
        const { id } = req.params;
        const showtime = store_js_1.store.showtimes.get(id);
        if (!showtime) {
            return res.status(404).json({
                success: false,
                message: 'Showtime not found.'
            });
        }
        const cinema = store_js_1.store.cinemas.get(showtime.cinemaId);
        const movie = store_js_1.store.movies.get(showtime.movieId);
        const screen = store_js_1.store.screens.get(showtime.screenId);
        res.json({
            success: true,
            data: {
                ...showtime,
                cinema,
                movie,
                screen
            }
        });
    }
}
exports.CinemaController = CinemaController;
