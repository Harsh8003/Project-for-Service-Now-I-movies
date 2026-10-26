// In production, VITE_API_URL points to the deployed backend (e.g. Railway/Render).
// In development, Vite's proxy forwards /api → localhost:5000 so we use a relative path.
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('cinematic_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      response.status,
      resData.message || 'An unexpected error occurred. Please try again.',
      resData
    );
  }

  return resData;
}

export const api = {
  // Auth
  register: (body: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request<any>('/auth/me'),
  demoSwitch: (role: string) => request<any>(`/auth/demo-switch?role=${role}`, { method: 'POST' }),

  // Movies
  getMovies: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/movies${qs ? `?${qs}` : ''}`);
  },
  getFeaturedMovies: () => request<any>('/movies/featured'),
  getMovieByIdOrSlug: (idOrSlug: string) => request<any>(`/movies/${idOrSlug}`),
  getTrailer: (id: string) => request<any>(`/movies/${id}/trailer`),

  // Cinemas & Showtimes
  getCities: () => request<any>('/cities'),
  getCinemas: (cityId?: string) => request<any>(`/cinemas${cityId ? `?cityId=${cityId}` : ''}`),
  getShowtimes: (params: { movieId?: string; cityId?: string; date?: string; format?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<any>(`/showtimes${qs ? `?${qs}` : ''}`);
  },
  getShowtimeById: (id: string) => request<any>(`/showtimes/${id}`),

  // Seats
  getSeats: (showtimeId: string) => request<any>(`/seats/${showtimeId}`),
  lockSeats: (showtimeId: string, seatIds: string[], guestId?: string) =>
    request<any>('/seats/lock', { method: 'POST', body: JSON.stringify({ showtimeId, seatIds, guestId }) }),
  releaseSeats: (showtimeId: string, seatIds: string[], guestId?: string) =>
    request<any>('/seats/release', { method: 'POST', body: JSON.stringify({ showtimeId, seatIds, guestId }) }),

  // Bookings
  createBooking: (body: { showtimeId: string; seatIds: string[]; couponCode?: string }) =>
    request<any>('/bookings', { method: 'POST', body: JSON.stringify(body) }),
  confirmPayment: (body: { bookingId: string; razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    request<any>('/bookings/confirm', { method: 'POST', body: JSON.stringify(body) }),
  getMyBookings: () => request<any>('/bookings/my-bookings'),
  getBookingById: (id: string) => request<any>(`/bookings/${id}`),
  cancelBooking: (id: string, reason?: string) =>
    request<any>(`/bookings/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  verifyTicket: (ref: string) => request<any>(`/tickets/verify/${ref}`),

  // Coupons
  getCoupons: () => request<any>('/coupons'),
  validateCoupon: (code: string, subtotalMinorUnits: number) =>
    request<any>('/coupons/validate', { method: 'POST', body: JSON.stringify({ code, subtotalMinorUnits }) }),

  // Admin
  getAdminKPIs: () => request<any>('/admin/kpis'),
  getAdminBookings: () => request<any>('/admin/bookings'),
  createMovie: (body: any) => request<any>('/admin/movies', { method: 'POST', body: JSON.stringify(body) }),
  deleteMovie: (id: string) => request<any>(`/admin/movies/${id}`, { method: 'DELETE' }),
  createShowtime: (body: any) => request<any>('/admin/showtimes', { method: 'POST', body: JSON.stringify(body) }),
  getAuditLogs: () => request<any>('/admin/audit-logs'),
};
