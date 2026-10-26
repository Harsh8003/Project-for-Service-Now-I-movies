import { Response } from 'express';
import { z } from 'zod';
import { store, DBBooking } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { RazorpayService } from '../services/razorpay.service.js';
import { generateTicketQRCode } from '../services/qrcode.service.js';
import { EmailService } from '../services/email.service.js';
import { broadcastSeatUpdate } from '../socket/seatSocket.js';
import { SeatCategory } from '../types/index.js';

const createBookingSchema = z.object({
  showtimeId: z.string().min(1, 'Showtime ID is required'),
  seatIds: z.array(z.string()).min(1, 'At least one seat must be selected'),
  couponCode: z.string().optional()
});

const confirmPaymentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  razorpayOrderId: z.string().min(1, 'Order ID is required'),
  razorpayPaymentId: z.string().min(1, 'Payment ID is required'),
  razorpaySignature: z.string().min(1, 'Signature is required')
});

const cancelBookingSchema = z.object({
  reason: z.string().optional().default('Customer requested cancellation')
});

export class BookingController {
  public static async createBooking(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const data = createBookingSchema.parse(req.body);
    const showtime = store.showtimes.get(data.showtimeId);

    if (!showtime) {
      return res.status(404).json({ success: false, message: 'Showtime not found.' });
    }

    const now = Date.now();
    const booked = store.bookedSeats.get(data.showtimeId) || new Set<string>();

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
      const activeLock = store.seatLocks.get(lockKey);
      if (!activeLock || activeLock.userId !== req.user.id || activeLock.lockedUntil <= now) {
        return res.status(400).json({
          success: false,
          message: 'Seat hold has expired. Please select your seats again.'
        });
      }

      const seatObj = store.seats.get(seatId);
      if (!seatObj) {
        return res.status(400).json({ success: false, message: 'Invalid seat selection.' });
      }

      seatsToBook.push(seatObj);
    }

    // 2. Server-side authoritative price calculation (paise)
    const subtotalMinorUnits = seatsToBook.reduce((sum, s) => sum + s.priceMinorUnits, 0);
    const taxMinorUnits = Math.round(subtotalMinorUnits * 0.18); // 18% GST
    const convenienceFeeMinorUnits = seatsToBook.length * 3000;  // ₹30 per ticket convenience fee

    let discountMinorUnits = 0;
    if (data.couponCode) {
      const coupon = store.coupons.get(data.couponCode.toUpperCase());
      if (coupon && coupon.isActive && subtotalMinorUnits >= coupon.minBookingMinorUnits) {
        const calculatedDiscount = Math.round((subtotalMinorUnits * coupon.discountPercent) / 100);
        discountMinorUnits = Math.min(calculatedDiscount, coupon.maxDiscountMinorUnits);
      }
    }

    const totalAmountMinorUnits = subtotalMinorUnits + taxMinorUnits + convenienceFeeMinorUnits - discountMinorUnits;
    const bookingRef = `CNM-${Math.floor(100000 + Math.random() * 900000)}`;
    const bookingId = `book_${Date.now()}`;

    // 3. Initiate payment order via Razorpay service
    const order = await RazorpayService.createOrder({
      amountMinorUnits: totalAmountMinorUnits,
      currency: 'INR',
      receipt: bookingRef,
      notes: {
        bookingId,
        movieTitle: showtime.movie?.title || '',
        userId: req.user.id
      }
    });

    const newBooking: DBBooking = {
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

    store.bookings.set(bookingId, newBooking);

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

  public static async confirmPayment(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const data = confirmPaymentSchema.parse(req.body);
    const booking = store.bookings.get(data.bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // 1. Verify Razorpay cryptographic payment signature
    const isValidSignature = RazorpayService.verifyPaymentSignature(
      data.razorpayOrderId,
      data.razorpayPaymentId,
      data.razorpaySignature
    );

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

    const bookedSet = store.bookedSeats.get(booking.showtimeId) || new Set<string>();
    const bookedSeatIds: string[] = [];

    booking.seats.forEach(s => {
      bookedSet.add(s.seatId);
      bookedSeatIds.push(s.seatId);
      // Remove lock
      store.seatLocks.delete(`${booking.showtimeId}:${s.seatId}`);
    });
    store.bookedSeats.set(booking.showtimeId, bookedSet);

    // 3. Generate QR-code ticket data URL
    const qrCodeDataUrl = await generateTicketQRCode({
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
    EmailService.sendBookingConfirmation(req.user.email, booking);

    broadcastSeatUpdate(booking.showtimeId, {
      type: 'SEATS_BOOKED',
      seatIds: bookedSeatIds
    });

    // 5. Audit Log
    store.auditLogs.unshift({
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

  public static async getUserBookings(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userBookings = Array.from(store.bookings.values())
      .filter(b => b.userId === req.user!.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      success: true,
      data: userBookings
    });
  }

  public static async getBookingById(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const booking = store.bookings.get(id);

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

  public static async cancelBooking(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { id } = req.params;
    const data = cancelBookingSchema.parse(req.body);
    const booking = store.bookings.get(id);

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
    const showtime = store.showtimes.get(booking.showtimeId);
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
    const bookedSet = store.bookedSeats.get(booking.showtimeId);
    const releasedSeatIds: string[] = [];

    if (bookedSet) {
      booking.seats.forEach(s => {
        bookedSet.delete(s.seatId);
        releasedSeatIds.push(s.seatId);
      });
    }

    broadcastSeatUpdate(booking.showtimeId, {
      type: 'SEATS_RELEASED',
      seatIds: releasedSeatIds
    });

    // Audit Log
    store.auditLogs.unshift({
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

  public static async verifyTicket(req: AuthenticatedRequest, res: Response) {
    const { reference } = req.params;
    const booking = Array.from(store.bookings.values()).find(b => b.bookingReference === reference);

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
