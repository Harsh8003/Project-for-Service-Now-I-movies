"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeatController = void 0;
const zod_1 = require("zod");
const store_js_1 = require("../db/store.js");
const seatSocket_js_1 = require("../socket/seatSocket.js");
const lockSeatsSchema = zod_1.z.object({
    showtimeId: zod_1.z.string().min(1, 'Showtime ID is required'),
    seatIds: zod_1.z.array(zod_1.z.string()).min(1, 'At least one seat must be selected'),
    guestId: zod_1.z.string().optional() // allows guests to lock seats before login
});
const releaseSeatsSchema = zod_1.z.object({
    showtimeId: zod_1.z.string().min(1, 'Showtime ID is required'),
    seatIds: zod_1.z.array(zod_1.z.string()).min(1, 'At least one seat must be selected'),
    guestId: zod_1.z.string().optional()
});
class SeatController {
    static async getSeats(req, res) {
        const { showtimeId } = req.params;
        const showtime = store_js_1.store.showtimes.get(showtimeId);
        if (!showtime) {
            return res.status(404).json({
                success: false,
                message: 'Showtime not found.'
            });
        }
        const seats = store_js_1.store.getSeatAvailability(showtimeId);
        const screen = store_js_1.store.screens.get(showtime.screenId);
        res.json({
            success: true,
            data: {
                showtime,
                screen,
                seats
            }
        });
    }
    static async lockSeats(req, res) {
        const data = lockSeatsSchema.parse(req.body);
        const userId = req.user?.id || data.guestId || 'guest_temp';
        const result = store_js_1.store.lockSeats(data.showtimeId, data.seatIds, userId, 600); // 10 minutes
        if (!result.success) {
            return res.status(409).json({
                success: false,
                message: result.error
            });
        }
        // Broadcast seat status update via Socket.IO
        (0, seatSocket_js_1.broadcastSeatUpdate)(data.showtimeId, {
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
    static async releaseSeats(req, res) {
        const data = releaseSeatsSchema.parse(req.body);
        const userId = req.user?.id || data.guestId || 'guest_temp';
        store_js_1.store.releaseSeats(data.showtimeId, data.seatIds, userId);
        // Broadcast seat release via Socket.IO
        (0, seatSocket_js_1.broadcastSeatUpdate)(data.showtimeId, {
            type: 'SEATS_RELEASED',
            seatIds: data.seatIds
        });
        res.json({
            success: true,
            message: 'Seats released successfully.'
        });
    }
}
exports.SeatController = SeatController;
