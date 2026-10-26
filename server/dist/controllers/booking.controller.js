"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingController = void 0;
const zod_1 = require("zod");
const store_js_1 = require("../db/store.js");
const razorpay_service_js_1 = require("../services/razorpay.service.js");
const qrcode_service_js_1 = require("../services/qrcode.service.js");
const email_service_js_1 = require("../services/email.service.js");
const seatSocket_js_1 = require("../socket/seatSocket.js");
const createBookingSchema = zod_1.z.object({
    showtimeId: zod_1.z.string().min(1, 'Showtime ID is required'),
    seatIds: zod_1.z.array(zod_1.z.string()).min(1, 'At least one seat must be selected'),
    couponCode: zod_1.z.string().optional()
});
const confirmPaymentSchema = zod_1.z.object({
    bookingId: zod_1.z.string().min(1, 'Booking ID is required'),
    razorpayOrderId: zod_1.z.string().min(1, 'Order ID is required'),
    razorpayPaymentId: zod_1.z.string().min(1, 'Payment ID is required'),
    razorpaySignature: zod_1.z.string().min(1, 'Signature is required')
});
const cancelBookingSchema = zod_1.z.object({
    reason: zod_1.z.string().optional().default('Customer requested cancellation')
});
class BookingController {
    static async createBooking(req, res) {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }
        const data = createBookingSchema.parse(req.body);
        const showtime = store_js_1.store.showtimes.get(data.showtimeId);
        if (!showtime) {
            return res.status(404).json({ success: false, message: 'Showtime not found.' });
        }
        const now = Date.now();
        const booked = store_js_1.store.bookedSeats.get(data.showtimeId) || new Set();
        // 1. Re-validate seats: ensure seats are locked by THIS user and not expired or already booked
        const seatsToBook = [];
        for (const seatId of data.seatIds) {
            if (booked.has(seatId)) {
                return res.status(409).json({
                    success: false,
                    message: 'One of the seats has already been booked. Please choose another seat.'
                });
            }
            const lockKey = `${data.showtimeId}:${seatId}`;
            const activeLock = store_js_1.store.seatLocks.get(lockKey);
            if (!activeLock || activeLock.userId !== req.user.id || activeLock.lockedUntil <= now) {
                return res.status(400).json({
                    success: false,
                    message: 'Seat hold has expired. Please select your seats again.'
                });
            }
            const seatObj = store_js_1.store.seats.get(seatId);
            if (!seatObj) {
                return res.status(400).json({ success: false, message: 'Invalid seat selection.' });
            }
            seatsToBook.push(seatObj);
        }
        // 2. Server-side authoritative price calculation (paise)
        const subtotalMinorUnits = seatsToBook.reduce((sum, s) => sum + s.priceMinorUnits, 0);
        const taxMinorUnits = Math.round(subtotalMinorUnits * 0.18); // 18% GST
        const convenienceFeeMinorUnits = seatsToBook.length * 3000; // ₹30 per ticket convenience fee
        let discountMinorUnits = 0;
        if (data.couponCode) {
            const coupon = store_js_1.store.coupons.get(data.couponCode.toUpperCase());
            if (coupon && coupon.isActive && subtotalMinorUnits >= coupon.minBookingMinorUnits) {
                const calculatedDiscount = Math.round((subtotalMinorUnits * coupon.discountPercent) / 100);
                discountMinorUnits = Math.min(calculatedDiscount, coupon.maxDiscountMinorUnits);
            }
        }
        const totalAmountMinorUnits = subtotalMinorUnits + taxMinorUnits + convenienceFeeMinorUnits - discountMinorUnits;
        const bookingRef = `CNM-${Math.floor(100000 + Math.random() * 900000)}`;
        const bookingId = `book_${Date.now()}`;
        // 3. Initiate payment order via Razorpay service
        const order = await razorpay_service_js_1.RazorpayService.createOrder({
            amountMinorUnits: totalAmountMinorUnits,
            currency: 'INR',
            receipt: bookingRef,
            notes: {
                bookingId,
                movieTitle: showtime.movie?.title || '',
                userId: req.user.id
            }
        });
        const newBooking = {
            id: bookingId,
            bookingReference: bookingRef,
            userId: req.user.id,
            showtimeId: showtime.id,
            showtime,
            movieTitle: showtime.movie?.title,
            cinemaName: showtime.cinemaName,
            screenName: showtime.screenName,
            format: showtime.format,
            showStartTime: showtime.startTime,
            seats: seatsToBook.map(s => ({
                seatId: s.id,
                seatIdentifier: `${s.rowLetter}${s.seatNumber}`,
                seatCategory: s.seatCategory,
                priceMinorUnits: s.priceMinorUnits
            })),
            subtotalMinorUnits,
            taxMinorUnits,
            convenienceFeeMinorUnits,
            discountMinorUnits,
            totalAmountMinorUnits,
            currency: 'INR',
            status: 'PENDING',
            paymentStatus: 'UNPAID',
            createdAt: new Date().toISOString()
        };
        store_js_1.store.bookings.set(bookingId, newBooking);
        res.status(201).json({
            success: true,
            data: {
                bookingId: newBooking.id,
                bookingReference: newBooking.bookingReference,
                razorpayOrderId: order.id,
                amountMinorUnits: totalAmountMinorUnits,
                currency: 'INR',
                breakdown: {
                    subtotalMinorUnits,
                    taxMinorUnits,
                    convenienceFeeMinorUnits,
                    discountMinorUnits,
                    totalAmountMinorUnits
                }
            }
        });
    }
    static async confirmPayment(req, res) {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }
        const data = confirmPaymentSchema.parse(req.body);
        const booking = store_js_1.store.bookings.get(data.bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }
        if (booking.userId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }
        // 1. Verify Razorpay cryptographic payment signature
        const isValidSignature = razorpay_service_js_1.RazorpayService.verifyPaymentSignature(data.razorpayOrderId, data.razorpayPaymentId, data.razorpaySignature);
        if (!isValidSignature) {
            booking.paymentStatus = 'FAILED';
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed: invalid signature.'
            });
        }
        // 2. Mark booking confirmed and seats permanently booked
        booking.status = 'CONFIRMED';
        booking.paymentStatus = 'PAID';
        const bookedSet = store_js_1.store.bookedSeats.get(booking.showtimeId) || new Set();
        const bookedSeatIds = [];
        booking.seats.forEach(s => {
            bookedSet.add(s.seatId);
            bookedSeatIds.push(s.seatId);
            // Remove lock
            store_js_1.store.seatLocks.delete(`${booking.showtimeId}:${s.seatId}`);
        });
        store_js_1.store.bookedSeats.set(booking.showtimeId, bookedSet);
        // 3. Generate QR-code ticket data URL
        const qrCodeDataUrl = await (0, qrcode_service_js_1.generateTicketQRCode)({
            bookingReference: booking.bookingReference,
            movieTitle: booking.movieTitle || 'Movie',
            cinemaName: booking.cinemaName || 'Cinema',
            showStartTime: booking.showStartTime || '',
            seats: booking.seats.map(s => s.seatIdentifier),
            userId: req.user.id
        });
        booking.qrCodeDataUrl = qrCodeDataUrl;
        booking.canCancel = true;
        booking.refundAmountMinorUnits = Math.round(booking.totalAmountMinorUnits * 0.75);
        // 4. Send Confirmation Email & Broadcast seat booking to other clients
        email_service_js_1.EmailService.sendBookingConfirmation(req.user.email, booking);
        (0, seatSocket_js_1.broadcastSeatUpdate)(booking.showtimeId, {
            type: 'SEATS_BOOKED',
            seatIds: bookedSeatIds
        });
        // 5. Audit Log
        store_js_1.store.auditLogs.unshift({
            id: `audit_${Date.now()}`,
            userId: req.user.id,
            userEmail: req.user.email,
            action: 'BOOKING_CONFIRMED',
            resource: 'Booking',
            details: `Booking ${booking.bookingReference} confirmed for ₹${(booking.totalAmountMinorUnits / 100).toFixed(2)} via Razorpay ${data.razorpayPaymentId}`,
            createdAt: new Date().toISOString()
        });
        res.json({
            success: true,
            message: 'Payment verified and booking confirmed successfully.',
            data: booking
        });
    }
    static async getUserBookings(req, res) {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }
        const userBookings = Array.from(store_js_1.store.bookings.values())
            .filter(b => b.userId === req.user.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        res.json({
            success: true,
            data: userBookings
        });
    }
    static async getBookingById(req, res) {
        const { id } = req.params;
        const booking = store_js_1.store.bookings.get(id);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }
        if (req.user && booking.userId !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'SUPPORT') {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }
        res.json({
            success: true,
            data: booking
        });
    }
    static async cancelBooking(req, res) {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }
        const { id } = req.params;
        const data = cancelBookingSchema.parse(req.body);
        const booking = store_js_1.store.bookings.get(id);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }
        if (booking.userId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Forbidden.' });
        }
        if (booking.status !== 'CONFIRMED') {
            return res.status(400).json({ success: false, message: 'Only confirmed bookings can be cancelled.' });
        }
        // Cancellation Policy Check: Must be at least 2 hours before showtime
        const showtime = store_js_1.store.showtimes.get(booking.showtimeId);
        if (showtime) {
            const showStartMs = new Date(showtime.startTime).getTime();
            const diffHours = (showStartMs - Date.now()) / (1000 * 60 * 60);
            if (diffHours < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'Bookings can only be cancelled at least 2 hours prior to showtime.'
                });
            }
        }
        // Calculate 75% refund (paise)
        const refundAmountMinorUnits = Math.round(booking.totalAmountMinorUnits * 0.75);
        booking.status = 'CANCELLED';
        booking.paymentStatus = 'REFUNDED';
        booking.cancellationReason = data.reason;
        // Free up seats in bookedSeats
        const bookedSet = store_js_1.store.bookedSeats.get(booking.showtimeId);
        const releasedSeatIds = [];
        if (bookedSet) {
            booking.seats.forEach(s => {
                bookedSet.delete(s.seatId);
                releasedSeatIds.push(s.seatId);
            });
        }
        (0, seatSocket_js_1.broadcastSeatUpdate)(booking.showtimeId, {
            type: 'SEATS_RELEASED',
            seatIds: releasedSeatIds
        });
        // Audit Log
        store_js_1.store.auditLogs.unshift({
            id: `audit_${Date.now()}`,
            userId: req.user.id,
            userEmail: req.user.email,
            action: 'BOOKING_CANCELLED',
            resource: 'Booking',
            details: `Booking ${booking.bookingReference} cancelled. Refund of ₹${(refundAmountMinorUnits / 100).toFixed(2)} initiated. Reason: ${data.reason}`,
            createdAt: new Date().toISOString()
        });
        res.json({
            success: true,
            message: 'Booking cancelled successfully. Refund initiated.',
            data: {
                bookingId: booking.id,
                refundAmountMinorUnits,
                status: 'REFUNDED'
            }
        });
    }
    static async verifyTicket(req, res) {
        const { reference } = req.params;
        const booking = Array.from(store_js_1.store.bookings.values()).find(b => b.bookingReference === reference);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Invalid ticket reference.' });
        }
        res.json({
            success: true,
            data: {
                isValid: booking.status === 'CONFIRMED',
                bookingReference: booking.bookingReference,
                movieTitle: booking.movieTitle,
                cinemaName: booking.cinemaName,
                screenName: booking.screenName,
                showStartTime: booking.showStartTime,
                seats: booking.seats.map(s => s.seatIdentifier),
                status: booking.status
            }
        });
    }
}
exports.BookingController = BookingController;
