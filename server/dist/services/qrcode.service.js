"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTicketQRCode = generateTicketQRCode;
const qrcode_1 = __importDefault(require("qrcode"));
async function generateTicketQRCode(payload) {
    const payloadString = JSON.stringify({
        ref: payload.bookingReference,
        movie: payload.movieTitle,
        cinema: payload.cinemaName,
        time: payload.showStartTime,
        seats: payload.seats,
        uid: payload.userId,
        verifiedAt: new Date().toISOString()
    });
    try {
        return await qrcode_1.default.toDataURL(payloadString, {
            errorCorrectionLevel: 'H',
            margin: 2,
            width: 256,
            color: {
                dark: '#08090C',
                light: '#FFFFFF'
            }
        });
    }
    catch (err) {
        console.error('Failed to generate QR code', err);
        return '';
    }
}
