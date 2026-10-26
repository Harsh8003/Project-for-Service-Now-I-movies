import { Server as SocketIOServer, Socket } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export function initializeSeatSocket(io: SocketIOServer) {
  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    // Client joins a specific showtime room to receive live seating updates
    socket.on('join-showtime', (showtimeId: string) => {
      socket.join(`showtime_${showtimeId}`);
    });

    socket.on('leave-showtime', (showtimeId: string) => {
      socket.leave(`showtime_${showtimeId}`);
    });
  });
}

export function broadcastSeatUpdate(showtimeId: string, event: {
  type: 'SEATS_LOCKED' | 'SEATS_RELEASED' | 'SEATS_BOOKED';
  seatIds: string[];
  lockedByUserId?: string;
  lockedUntil?: string;
}) {
  if (ioInstance) {
    ioInstance.to(`showtime_${showtimeId}`).emit('seat-update', event);
  }
}
