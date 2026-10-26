import { Response } from 'express';
import { z } from 'zod';
import { store } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { broadcastSeatUpdate } from '../socket/seatSocket.js';

const lockSeatsSchema = z.object({
  showtimeId: z.string().min(1, 'Showtime ID is required'),
  seatIds: z.array(z.string()).min(1, 'At least one seat must be selected'),
  guestId: z.string().optional() // allows guests to lock seats before login
});

const releaseSeatsSchema = z.object({
  showtimeId: z.string().min(1, 'Showtime ID is required'),
  seatIds: z.array(z.string()).min(1, 'At least one seat must be selected'),
  guestId: z.string().optional()
});

export class SeatController {
  public static async getSeats(req: AuthenticatedRequest, res: Response) {
    const { showtimeId } = req.params;

    const showtime = store.showtimes.get(showtimeId);
    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: 'Showtime not found.'
      });
    }

    const seats = store.getSeatAvailability(showtimeId);
    const screen = store.screens.get(showtime.screenId);

    res.json({
      success: true,
      data: {
        showtime,
        screen,
        seats
      }
    });
  }

  public static async lockSeats(req: AuthenticatedRequest, res: Response) {
    const data = lockSeatsSchema.parse(req.body);
    const userId = req.user?.id || data.guestId || 'guest_temp';

    const result = store.lockSeats(data.showtimeId, data.seatIds, userId, 600); // 10 minutes

    if (!result.success) {
      return res.status(409).json({
        success: false,
        message: result.error
      });
    }

    // Broadcast seat status update via Socket.IO
    broadcastSeatUpdate(data.showtimeId, {
      type: 'SEATS_LOCKED',
      seatIds: data.seatIds,
      lockedByUserId: userId,
      lockedUntil: result.lockedUntil
    });

    res.json({
      success: true,
      message: 'Seats locked successfully.',
      data: {
        lockedUntil: result.lockedUntil,
        seatIds: data.seatIds
      }
    });
  }

  public static async releaseSeats(req: AuthenticatedRequest, res: Response) {
    const data = releaseSeatsSchema.parse(req.body);
    const userId = req.user?.id || data.guestId || 'guest_temp';

    store.releaseSeats(data.showtimeId, data.seatIds, userId);

    // Broadcast seat release via Socket.IO
    broadcastSeatUpdate(data.showtimeId, {
      type: 'SEATS_RELEASED',
      seatIds: data.seatIds
    });

    res.json({
      success: true,
      message: 'Seats released successfully.'
    });
  }
}
