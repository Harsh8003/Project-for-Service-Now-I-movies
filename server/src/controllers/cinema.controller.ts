import { Request, Response } from 'express';
import { store } from '../db/store.js';

export class CinemaController {
  public static async getCities(req: Request, res: Response) {
    const cities = Array.from(store.cities.values());
    res.json({
      success: true,
      data: cities
    });
  }

  public static async getCinemas(req: Request, res: Response) {
    const { cityId } = req.query;

    let cinemas = Array.from(store.cinemas.values());
    if (cityId && typeof cityId === 'string') {
      cinemas = cinemas.filter(c => c.cityId === cityId);
    }

    res.json({
      success: true,
      data: cinemas
    });
  }

  public static async getShowtimes(req: Request, res: Response) {
    const { movieId, cityId, date, format } = req.query;

    let showtimes = Array.from(store.showtimes.values());

    if (movieId && typeof movieId === 'string') {
      showtimes = showtimes.filter(s => s.movieId === movieId);
    }

    if (cityId && typeof cityId === 'string') {
      showtimes = showtimes.filter(s => s.cityId === cityId);
    }

    if (date && typeof date === 'string') {
      // date formatted as YYYY-MM-DD
      showtimes = showtimes.filter(s => s.startTime.startsWith(date));
    }

    if (format && typeof format === 'string' && format !== 'ALL') {
      showtimes = showtimes.filter(s => s.format === format);
    }

    // Group showtimes by Cinema for clean UI display
    const cinemaMap = new Map<string, { cinema: any; screens: any[]; showtimes: any[] }>();

    showtimes.forEach(st => {
      const cinema = store.cinemas.get(st.cinemaId);
      if (!cinema) return;

      if (!cinemaMap.has(st.cinemaId)) {
        cinemaMap.set(st.cinemaId, {
          cinema,
          screens: [],
          showtimes: []
        });
      }

      cinemaMap.get(st.cinemaId)!.showtimes.push(st);
    });

    res.json({
      success: true,
      data: Array.from(cinemaMap.values())
    });
  }

  public static async getShowtimeById(req: Request, res: Response) {
    const { id } = req.params;
    const showtime = store.showtimes.get(id);

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: 'Showtime not found.'
      });
    }

    const cinema = store.cinemas.get(showtime.cinemaId);
    const movie = store.movies.get(showtime.movieId);
    const screen = store.screens.get(showtime.screenId);

    res.json({
      success: true,
      data: {
        ...showtime,
        cinema,
        movie,
        screen
      }
    });
  }
}
