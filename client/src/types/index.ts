export type Role = 'CUSTOMER' | 'SUPPORT' | 'CINEMA_MANAGER' | 'ADMIN';

export type SeatCategory = 'CLASSIC' | 'PRIME' | 'RECLINER';

export type ScreenFormat = 
  | 'STANDARD_2D'
  | 'STANDARD_3D'
  | 'IMAX_2D'
  | 'IMAX_3D'
  | 'FOUR_DX'
  | 'DOLBY_ATMOS';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: Role;
  avatarUrl?: string | null;
  preferredCityId?: string | null;
}

export interface City {
  id: string;
  name: string;
  slug: string;
  state: string;
}

export interface Cinema {
  id: string;
  cityId: string;
  name: string;
  slug: string;
  address: string;
  amenities: string[];
}

export interface Movie {
  id: string;
  tmdbId?: number | null;
  title: string;
  slug: string;
  synopsis: string;
  posterUrl: string;
  backdropUrl: string;
  trailerYoutubeKey?: string | null;
  runtimeMinutes: number;
  certification: string;
  releaseDate: string;
  language: string;
  genres: string[];
  rating: number;
  voteCount: number;
  isFeatured: boolean;
  isNowShowing: boolean;
  isComingSoon: boolean;
  director?: string;
  cast?: { id: string; name: string; character: string }[];
}

export interface Showtime {
  id: string;
  movieId: string;
  screenId: string;
  cinemaId: string;
  cinemaName?: string;
  cityId?: string;
  cityName?: string;
  screenName?: string;
  startTime: string;
  endTime: string;
  format: ScreenFormat;
  basePriceMinorUnits: number;
  status: string;
  movie?: Movie;
}

export interface SeatWithStatus {
  id: string;
  screenId: string;
  rowLetter: string;
  seatNumber: number;
  seatCategory: SeatCategory;
  priceMinorUnits: number;
  isAccessible?: boolean;
  status: 'AVAILABLE' | 'LOCKED' | 'BOOKED';
  lockedByUserId?: string | null;
  lockedUntil?: string | null;
}

export interface Booking {
  id: string;
  bookingReference: string;
  userId: string;
  showtimeId: string;
  showtime?: Showtime;
  movieTitle?: string;
  cinemaName?: string;
  screenName?: string;
  format?: ScreenFormat;
  showStartTime?: string;
  seats: {
    seatId: string;
    seatIdentifier: string;
    seatCategory: SeatCategory;
    priceMinorUnits: number;
  }[];
  subtotalMinorUnits: number;
  taxMinorUnits: number;
  convenienceFeeMinorUnits: number;
  discountMinorUnits: number;
  totalAmountMinorUnits: number;
  currency: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';
  paymentStatus: 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';
  qrCodeDataUrl?: string | null;
  createdAt: string;
  canCancel?: boolean;
  refundAmountMinorUnits?: number;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountPercent: number;
  maxDiscountMinorUnits: number;
  minBookingMinorUnits: number;
  validUntil: string;
  isActive: boolean;
}
