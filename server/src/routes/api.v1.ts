import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { MovieController } from '../controllers/movie.controller.js';
import { CinemaController } from '../controllers/cinema.controller.js';
import { SeatController } from '../controllers/seat.controller.js';
import { BookingController } from '../controllers/booking.controller.js';
import { CouponController } from '../controllers/coupon.controller.js';
import { AdminController } from '../controllers/admin.controller.js';
import { authenticate, optionalAuthenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// ==========================================
// 1. Authentication & Account Management
// ==========================================
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.get('/auth/me', authenticate, AuthController.me);
router.post('/auth/demo-switch', AuthController.demoLogin);

// ==========================================
// 2. Movie Metadata & Trailers
// ==========================================
router.get('/movies', MovieController.getMovies);
router.get('/movies/featured', MovieController.getFeatured);
router.get('/movies/:identifier', MovieController.getMovieByIdOrSlug);
router.get('/movies/:id/trailer', MovieController.getTrailer);

// ==========================================
// 3. Cities, Cinemas & Showtimes
// ==========================================
router.get('/cities', CinemaController.getCities);
router.get('/cinemas', CinemaController.getCinemas);
router.get('/showtimes', CinemaController.getShowtimes);
router.get('/showtimes/:id', CinemaController.getShowtimeById);

// ==========================================
// 4. Seats & Real-time Locking
// ==========================================
router.get('/seats/:showtimeId', optionalAuthenticate, SeatController.getSeats);
router.post('/seats/lock', optionalAuthenticate, SeatController.lockSeats);
router.post('/seats/release', optionalAuthenticate, SeatController.releaseSeats);

// ==========================================
// 5. Booking & Payments
// ==========================================
router.post('/bookings', authenticate, BookingController.createBooking);
router.post('/bookings/confirm', authenticate, BookingController.confirmPayment);
router.get('/bookings/my-bookings', authenticate, BookingController.getUserBookings);
router.get('/bookings/:id', authenticate, BookingController.getBookingById);
router.post('/bookings/:id/cancel', authenticate, BookingController.cancelBooking);
router.get('/tickets/verify/:reference', BookingController.verifyTicket);

// ==========================================
// 6. Coupons & Offers
// ==========================================
router.get('/coupons', CouponController.getCoupons);
router.post('/coupons/validate', CouponController.validateCoupon);

// ==========================================
// 7. Admin Dashboard & Operations
// ==========================================
router.get('/admin/kpis', authenticate, requireRole(['ADMIN', 'CINEMA_MANAGER']), AdminController.getKPIs);
router.get('/admin/bookings', authenticate, requireRole(['ADMIN', 'CINEMA_MANAGER', 'SUPPORT']), AdminController.getAllBookings);
router.post('/admin/movies', authenticate, requireRole(['ADMIN']), AdminController.createMovie);
router.delete('/admin/movies/:id', authenticate, requireRole(['ADMIN']), AdminController.deleteMovie);
router.post('/admin/showtimes', authenticate, requireRole(['ADMIN', 'CINEMA_MANAGER']), AdminController.createShowtime);
router.get('/admin/audit-logs', authenticate, requireRole(['ADMIN']), AdminController.getAuditLogs);

export default router;
