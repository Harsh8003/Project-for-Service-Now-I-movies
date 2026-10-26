import QRCode from 'qrcode';

export async function generateTicketQRCode(payload: {
  bookingReference: string;
  movieTitle: string;
  cinemaName: string;
  showStartTime: string;
  seats: string[];
  userId: string;
}): Promise<string> {
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
    return await QRCode.toDataURL(payloadString, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 256,
      color: {
        dark: '#08090C',
        light: '#FFFFFF'
      }
    });
  } catch (err) {
    console.error('Failed to generate QR code', err);
    return '';
  }
}
