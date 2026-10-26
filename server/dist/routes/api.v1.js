"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_js_1 = require("../controllers/auth.controller.js");
const movie_controller_js_1 = require("../controllers/movie.controller.js");
const cinema_controller_js_1 = require("../controllers/cinema.controller.js");
const seat_controller_js_1 = require("../controllers/seat.controller.js");
const booking_controller_js_1 = require("../controllers/booking.controller.js");
const coupon_controller_js_1 = require("../controllers/coupon.controller.js");
const admin_controller_js_1 = require("../controllers/admin.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
// ==========================================
// 1. Authentication & Account Management
// ==========================================
router.post('/auth/register', auth_controller_js_1.AuthController.register);
router.post('/auth/login', auth_controller_js_1.AuthController.login);
router.get('/auth/me', auth_middleware_js_1.authenticate, auth_controller_js_1.AuthController.me);
router.post('/auth/demo-switch', auth_controller_js_1.AuthController.demoLogin);
// ==========================================
// 2. Movie Metadata & Trailers
// ==========================================
router.get('/movies', movie_controller_js_1.MovieController.getMovies);
router.get('/movies/featured', movie_controller_js_1.MovieController.getFeatured);
router.get('/movies/:identifier', movie_controller_js_1.MovieController.getMovieByIdOrSlug);
router.get('/movies/:id/trailer', movie_controller_js_1.MovieController.getTrailer);
// ==========================================
// 3. Cities, Cinemas & Showtimes
// ==========================================
router.get('/cities', cinema_controller_js_1.CinemaController.getCities);
router.get('/cinemas', cinema_controller_js_1.CinemaController.getCinemas);
router.get('/showtimes', cinema_controller_js_1.CinemaController.getShowtimes);
router.get('/showtimes/:id', cinema_controller_js_1.CinemaController.getShowtimeById);
// ==========================================
// 4. Seats & Real-time Locking
// ==========================================
router.get('/seats/:showtimeId', auth_middleware_js_1.optionalAuthenticate, seat_controller_js_1.SeatController.getSeats);
router.post('/seats/lock', auth_middleware_js_1.optionalAuthenticate, seat_controller_js_1.SeatController.lockSeats);
router.post('/seats/release', auth_middleware_js_1.optionalAuthenticate, seat_controller_js_1.SeatController.releaseSeats);
// ==========================================
// 5. Booking & Payments
// ==========================================
router.post('/bookings', auth_middleware_js_1.authenticate, booking_controller_js_1.BookingController.createBooking);
router.post('/bookings/confirm', auth_middleware_js_1.authenticate, booking_controller_js_1.BookingController.confirmPayment);
router.get('/bookings/my-bookings', auth_middleware_js_1.authenticate, booking_controller_js_1.BookingController.getUserBookings);
router.get('/bookings/:id', auth_middleware_js_1.authenticate, booking_controller_js_1.BookingController.getBookingById);
router.post('/bookings/:id/cancel', auth_middleware_js_1.authenticate, booking_controller_js_1.BookingController.cancelBooking);
router.get('/tickets/verify/:reference', booking_controller_js_1.BookingController.verifyTicket);
// ==========================================
// 6. Coupons & Offers
// ==========================================
router.get('/coupons', coupon_controller_js_1.CouponController.getCoupons);
router.post('/coupons/validate', coupon_controller_js_1.CouponController.validateCoupon);
// ==========================================
// 7. Admin Dashboard & Operations
// ==========================================
router.get('/admin/kpis', auth_middleware_js_1.authenticate, (0, auth_middleware_js_1.requireRole)(['ADMIN', 'CINEMA_MANAGER']), admin_controller_js_1.AdminController.getKPIs);
router.get('/admin/bookings', auth_middleware_js_1.authenticate, (0, auth_middleware_js_1.requireRole)(['ADMIN', 'CINEMA_MANAGER', 'SUPPORT']), admin_controller_js_1.AdminController.getAllBookings);
router.post('/admin/movies', auth_middleware_js_1.authenticate, (0, auth_middleware_js_1.requireRole)(['ADMIN']), admin_controller_js_1.AdminController.createMovie);
router.delete('/admin/movies/:id', auth_middleware_js_1.authenticate, (0, auth_middleware_js_1.requireRole)(['ADMIN']), admin_controller_js_1.AdminController.deleteMovie);
router.post('/admin/showtimes', auth_middleware_js_1.authenticate, (0, auth_middleware_js_1.requireRole)(['ADMIN', 'CINEMA_MANAGER']), admin_controller_js_1.AdminController.createShowtime);
router.get('/admin/audit-logs', auth_middleware_js_1.authenticate, (0, auth_middleware_js_1.requireRole)(['ADMIN']), admin_controller_js_1.AdminController.getAuditLogs);
exports.default = router;
