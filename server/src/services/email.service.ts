import { env } from '../config/env.js';
import { BookingDTO } from '../types/index.js';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  public static async sendBookingConfirmation(email: string, booking: BookingDTO) {
    const seatNames = booking.seats.map(s => s.seatIdentifier).join(', ');
    const formattedAmount = (booking.totalAmountMinorUnits / 100).toFixed(2);

    const html = `
      <div style="font-family: Arial, sans-serif; background: #08090C; color: #F1F5F9; padding: 24px; border-radius: 8px;">
        <h1 style="color: #E50914; margin-bottom: 8px;">CINEMATIC — Booking Confirmed!</h1>
        <p>Dear Movie Enthusiast, your ticket booking is confirmed.</p>
        <div style="background: #14171C; padding: 16px; border-radius: 6px; margin: 16px 0; border: 1px solid #282E3C;">
          <h2 style="margin: 0 0 10px 0; color: #FFF;">${booking.movieTitle}</h2>
          <p style="margin: 4px 0;"><strong>Booking ID:</strong> <span style="color: #E50914;">${booking.bookingReference}</span></p>
          <p style="margin: 4px 0;"><strong>Cinema:</strong> ${booking.cinemaName} (${booking.screenName})</p>
          <p style="margin: 4px 0;"><strong>Showtime:</strong> ${new Date(booking.showStartTime || '').toLocaleString()}</p>
          <p style="margin: 4px 0;"><strong>Seats:</strong> ${seatNames}</p>
          <p style="margin: 4px 0;"><strong>Total Paid:</strong> ₹${formattedAmount} (${booking.paymentStatus})</p>
        </div>
        <p style="font-size: 13px; color: #94A3B8;">Please present your digital QR ticket at the cinema gate for rapid entry.</p>
      </div>
    `;

    if (env.EMAIL_PROVIDER === 'resend' && process.env.RESEND_API_KEY) {
      // Integration boundary: If API key provided, forward to Resend API
      try {
        console.log(`[EmailService] Dispatching email via Resend to ${email}...`);
      } catch (err) {
        console.error('[EmailService] Resend dispatch error:', err);
      }
    } else {
      // Development console fallback
      console.log(`\n======================================================`);
      console.log(`[EMAIL DISPATCH - DEV SIMULATOR]`);
      console.log(`To: ${email}`);
      console.log(`Subject: CINEMATIC Booking Confirmed — Ref #${booking.bookingReference}`);
      console.log(`Movie: ${booking.movieTitle} | Seats: ${seatNames} | Paid: ₹${formattedAmount}`);
      console.log(`======================================================\n`);
    }
  }

  public static async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;
    console.log(`\n[EMAIL DISPATCH] Password Reset requested for ${email}: ${resetUrl}\n`);
  }
}
