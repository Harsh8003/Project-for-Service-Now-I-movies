import { Response } from 'express';
import { z } from 'zod';
import { store } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { MovieDTO, ShowtimeDTO } from '../types/index.js';

const movieSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  synopsis: z.string().min(1, 'Synopsis is required'),
  posterUrl: z.string().url('Invalid poster URL'),
  backdropUrl: z.string().url('Invalid backdrop URL'),
  trailerYoutubeKey: z.string().optional(),
  runtimeMinutes: z.number().int().positive(),
  certification: z.string().default('UA'),
  releaseDate: z.string(),
  language: z.string().default('English'),
  genres: z.array(z.string()).min(1),
  rating: z.number().min(0).max(10).default(8.5),
  isFeatured: z.boolean().default(false),
  isNowShowing: z.boolean().default(true),
  isComingSoon: z.boolean().default(false),
  director: z.string().optional()
});

const showtimeSchema = z.object({
  movieId: z.string().min(1),
  screenId: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  basePriceMinorUnits: z.number().int().positive()
});

export class AdminController {
  public static async getKPIs(req: AuthenticatedRequest, res: Response) {
    const allBookings = Array.from(store.bookings.values());
    const confirmedBookings = allBookings.filter(b => b.status === 'CONFIRMED');

    const totalRevenueMinorUnits = confirmedBookings.reduce((sum, b) => sum + b.totalAmountMinorUnits, 0);
    const totalTicketsSold = confirmedBookings.reduce((sum, b) => sum + b.seats.length, 0);

    const totalSeatsInSystem = Array.from(store.seats.values()).length;
    const occupancyRate = totalSeatsInSystem > 0 ? Math.min(100, Math.round((totalTicketsSold / totalSeatsInSystem) * 100)) : 42;

    res.json({
      success: true,
      data: {
        totalRevenueMinorUnits,
        totalRevenueFormatted: `₹${(totalRevenueMinorUnits / 100).toLocaleString('en-IN')}`,
        totalBookings: allBookings.length,
        confirmedBookingsCount: confirmedBookings.length,
        totalTicketsSold,
        occupancyRate: `${occupancyRate}%`,
        activeMoviesCount: Array.from(store.movies.values()).filter(m => m.isNowShowing).length,
        cinemasCount: store.cinemas.size,
        screensCount: store.screens.size
      }
    });
  }

  public static async getAllBookings(req: AuthenticatedRequest, res: Response) {
    const bookings = Array.from(store.bookings.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      success: true,
      data: bookings
    });
  }

  public static async createMovie(req: AuthenticatedRequest, res: Response) {
    const data = movieSchema.parse(req.body);
    const movieId = `mov_${Date.now()}`;
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newMovie: MovieDTO = {
      id: movieId,
      slug,
      voteCount: 1,
      ...data
    };

    store.movies.set(movieId, newMovie);

    store.auditLogs.unshift({
      id: `audit_${Date.now()}`,
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: 'MOVIE_CREATED',
      resource: 'Movie',
      details: `Added new movie "${newMovie.title}" (${newMovie.id})`,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      message: 'Movie listed successfully.',
      data: newMovie
    });
  }

  public static async deleteMovie(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const movie = store.movies.get(id);

    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    store.movies.delete(id);

    store.auditLogs.unshift({
      id: `audit_${Date.now()}`,
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: 'MOVIE_DELETED',
      resource: 'Movie',
      details: `Deleted movie "${movie.title}" (${movie.id})`,
      createdAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Movie deleted successfully.'
    });
  }

  public static async createShowtime(req: AuthenticatedRequest, res: Response) {
    const data = showtimeSchema.parse(req.body);

    const movie = store.movies.get(data.movieId);
    const screen = store.screens.get(data.screenId);
    if (!movie || !screen) {
      return res.status(400).json({ success: false, message: 'Invalid movie or screen ID' });
    }

    const cinema = store.cinemas.get(screen.cinemaId);
    const showtimeId = `show_${Date.now()}`;

    const newShowtime: ShowtimeDTO = {
      id: showtimeId,
      movieId: movie.id,
      screenId: screen.id,
      cinemaId: screen.cinemaId,
      cinemaName: cinema?.name,
      cityId: cinema?.cityId,
      cityName: store.cities.get(cinema?.cityId || '')?.name,
      screenName: screen.name,
      startTime: data.startTime,
      endTime: data.endTime,
      format: screen.screenType,
      basePriceMinorUnits: data.basePriceMinorUnits,
      status: 'SCHEDULED',
      movie
    };

    store.showtimes.set(showtimeId, newShowtime);
    store.bookedSeats.set(showtimeId, new Set<string>());

    store.auditLogs.unshift({
      id: `audit_${Date.now()}`,
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: 'SHOWTIME_SCHEDULED',
      resource: 'Showtime',
      details: `Scheduled ${movie.title} at ${screen.name} for ${data.startTime}`,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      message: 'Showtime scheduled successfully.',
      data: newShowtime
    });
  }

  public static async getAuditLogs(req: AuthenticatedRequest, res: Response) {
    res.json({
      success: true,
      data: store.auditLogs
    });
  }
}
