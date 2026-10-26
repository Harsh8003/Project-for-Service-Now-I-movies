export type Role = 'CUSTOMER' | 'SUPPORT' | 'CINEMA_MANAGER' | 'ADMIN';

export type SeatCategory = 'CLASSIC' | 'PRIME' | 'RECLINER';

export type ScreenFormat = 
  | 'STANDARD_2D'
  | 'STANDARD_3D'
  | 'IMAX_2D'
  | 'IMAX_3D'
  | 'FOUR_DX'
  | 'DOLBY_ATMOS';

export type ShowtimeStatus = 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'CANCELLED';

export type LockStatus = 'ACTIVE' | 'EXPIRED' | 'RELEASED';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';

export type PaymentStatus = 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';

export type RefundStatus = 'INITIATED' | 'PROCESSED' | 'FAILED';

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: Role;
  avatarUrl?: string | null;
  preferredCityId?: string | null;
  createdAt: string;
}

export interface CityDTO {
  id: string;
  name: string;
  slug: string;
  state: string;
}

export interface CinemaDTO {
  id: string;
  cityId: string;
  name: string;
  slug: string;
  address: string;
  amenities: string[];
  screensCount?: number;
}

export interface ScreenDTO {
  id: string;
  cinemaId: string;
  name: string;
  screenType: ScreenFormat;
  totalSeats: number;
}

export interface SeatDTO {
  id: string;
  screenId: string;
  rowLetter: string;
  seatNumber: number;
  seatCategory: SeatCategory;
  priceMinorUnits: number; // e.g., 25000 = 250 INR
  isAccessible?: boolean;
}

export interface CastMemberDTO {
  id: string;
  name: string;
  character: string;
  profileUrl?: string | null;
}

export interface MovieDTO {
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
  cast?: CastMemberDTO[];
  director?: string;
}

export interface ShowtimeDTO {
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
  status: ShowtimeStatus;
  movie?: MovieDTO;
}

export interface SeatWithStatusDTO extends SeatDTO {
  status: 'AVAILABLE' | 'LOCKED' | 'BOOKED';
  lockedByUserId?: string | null;
  lockedUntil?: string | null;
}

export interface BookingDTO {
  id: string;
  bookingReference: string;
  userId: string;
  showtimeId: string;
  showtime?: ShowtimeDTO;
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
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  qrCodeDataUrl?: string | null;
  createdAt: string;
  canCancel?: boolean;
  refundAmountMinorUnits?: number;
}

export interface CouponDTO {
  id: string;
  code: string;
  description: string;
  discountPercent: number;
  maxDiscountMinorUnits: number;
  minBookingMinorUnits: number;
  validUntil: string;
  isActive: boolean;
}
