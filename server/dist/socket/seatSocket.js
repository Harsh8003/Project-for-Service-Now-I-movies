"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSeatSocket = initializeSeatSocket;
exports.broadcastSeatUpdate = broadcastSeatUpdate;
let ioInstance = null;
function initializeSeatSocket(io) {
    ioInstance = io;
    io.on('connection', (socket) => {
        // Client joins a specific showtime room to receive live seating updates
        socket.on('join-showtime', (showtimeId) => {
            socket.join(`showtime_${showtimeId}`);
        });
        socket.on('leave-showtime', (showtimeId) => {
            socket.leave(`showtime_${showtimeId}`);
        });
    });
}
function broadcastSeatUpdate(showtimeId, event) {
    if (ioInstance) {
        ioInstance.to(`showtime_${showtimeId}`).emit('seat-update', event);
    }
}
