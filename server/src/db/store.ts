import bcrypt from 'bcryptjs';
import { 
  Role, 
  ScreenFormat, 
  SeatCategory, 
  ShowtimeStatus, 
  BookingStatus, 
  PaymentStatus, 
  RefundStatus,
  UserDTO,
  CityDTO,
  CinemaDTO,
  ScreenDTO,
  SeatDTO,
  MovieDTO,
  ShowtimeDTO,
  SeatWithStatusDTO,
  BookingDTO,
  CouponDTO
} from '../types/index.js';

export interface DBUser extends UserDTO {
  passwordHash: string;
}

export interface DBSeatLock {
  id: string;
  showtimeId: string;
  seatId: string;
  userId: string;
  lockedUntil: number; // timestamp ms
}

export interface DBBookingSeat {
  seatId: string;
  seatIdentifier: string;
  seatCategory: SeatCategory;
  priceMinorUnits: number;
}

export interface DBBooking extends BookingDTO {
  cancellationReason?: string;
  userId: string;
}

export interface DBReview {
  id: string;
  movieId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface DBAuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  resource: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

class InMemoryStore {
  public users: Map<string, DBUser> = new Map();
  public cities: Map<string, CityDTO> = new Map();
  public cinemas: Map<string, CinemaDTO> = new Map();
  public screens: Map<string, ScreenDTO> = new Map();
  public seats: Map<string, SeatDTO> = new Map(); // seatId -> SeatDTO
  public screenSeats: Map<string, string[]> = new Map(); // screenId -> seatIds
  public movies: Map<string, MovieDTO> = new Map();
  public showtimes: Map<string, ShowtimeDTO> = new Map();
  public seatLocks: Map<string, DBSeatLock> = new Map(); // `${showtimeId}:${seatId}` -> DBSeatLock
  public bookedSeats: Map<string, Set<string>> = new Map(); // showtimeId -> Set of seatIds
  public bookings: Map<string, DBBooking> = new Map();
  public coupons: Map<string, CouponDTO> = new Map();
  public reviews: DBReview[] = [];
  public auditLogs: DBAuditLog[] = [];

  constructor() {
    this.seedDemoData();
  }

  private seedDemoData() {
    const passwordHash = bcrypt.hashSync('Password123!', 10);
    const adminHash = bcrypt.hashSync('AdminPass123!', 10);
    const managerHash = bcrypt.hashSync('ManagerPass123!', 10);
    const supportHash = bcrypt.hashSync('SupportPass123!', 10);

    // 1. Seed Demo Users
    const demoUsers: DBUser[] = [
      {
        id: 'usr_customer_demo',
        email: 'customer@cinematic.com',
        name: 'Aarav Sharma',
        phone: '+91 98765 43210',
        role: 'CUSTOMER',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        preferredCityId: 'city_mumbai',
        createdAt: new Date().toISOString(),
        passwordHash
      },
      {
        id: 'usr_admin_demo',
        email: 'admin@cinematic.com',
        name: 'Vikramaditya Singhania (Head Admin)',
        phone: '+91 98111 22334',
        role: 'ADMIN',
        avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
        preferredCityId: 'city_mumbai',
        createdAt: new Date().toISOString(),
        passwordHash: adminHash
      },
      {
        id: 'usr_manager_demo',
        email: 'manager@cinematic.com',
        name: 'Rohan Mehra (Cinema Manager)',
        phone: '+91 98222 33445',
        role: 'CINEMA_MANAGER',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        preferredCityId: 'city_delhi',
        createdAt: new Date().toISOString(),
        passwordHash: managerHash
      },
      {
        id: 'usr_support_demo',
        email: 'support@cinematic.com',
        name: 'Pooja Nair (Support Specialist)',
        phone: '+91 98333 44556',
        role: 'SUPPORT',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
        preferredCityId: 'city_bengaluru',
        createdAt: new Date().toISOString(),
        passwordHash: supportHash
      }
    ];

    demoUsers.forEach(u => this.users.set(u.id, u));

    // 2. Seed Cities
    const demoCities: CityDTO[] = [
      { id: 'city_mumbai', name: 'Mumbai', slug: 'mumbai', state: 'Maharashtra' },
      { id: 'city_delhi', name: 'Delhi-NCR', slug: 'delhi-ncr', state: 'Delhi' },
      { id: 'city_bengaluru', name: 'Bengaluru', slug: 'bengaluru', state: 'Karnataka' },
      { id: 'city_hyderabad', name: 'Hyderabad', slug: 'hyderabad', state: 'Telangana' },
      { id: 'city_chennai', name: 'Chennai', slug: 'chennai', state: 'Tamil Nadu' },
      { id: 'city_pune', name: 'Pune', slug: 'pune', state: 'Maharashtra' }
    ];

    demoCities.forEach(c => this.cities.set(c.id, c));

    // 3. Seed Cinemas
    const demoCinemas: CinemaDTO[] = [
      {
        id: 'cin_1',
        cityId: 'city_mumbai',
        name: 'CINEMATIC Megaplex — Phoenix Palladium',
        slug: 'cinematic-phoenix-palladium-mumbai',
        address: '462 Senapati Bapat Marg, Lower Parel, Mumbai, MH 400013',
        amenities: ['IMAX Laser', 'Dolby Atmos', 'Recliner VIP Lounges', 'Gourmet Kitchen', 'Valet Parking'],
        screensCount: 4
      },
      {
        id: 'cin_2',
        cityId: 'city_mumbai',
        name: 'CINEMATIC Luxe — Jio World Drive',
        slug: 'cinematic-jio-world-mumbai',
        address: 'Bandra Kurla Complex, Bandra East, Mumbai, MH 400051',
        amenities: ['4DX Motion Cinema', 'Dolby Atmos', 'In-Seat Dining', 'Wheelchair Friendly'],
        screensCount: 3
      },
      {
        id: 'cin_3',
        cityId: 'city_delhi',
        name: 'CINEMATIC Director’s Cut — Ambience Mall',
        slug: 'cinematic-directors-cut-delhi',
        address: 'Nelson Mandela Marg, Vasant Kunj, New Delhi, DL 110070',
        amenities: ['IMAX Laser 3D', 'Private Butler Service', 'Recliner Luxury', 'Bar Lounge'],
        screensCount: 4
      },
      {
        id: 'cin_4',
        cityId: 'city_bengaluru',
        name: 'CINEMATIC Superplex — Forum South Bengaluru',
        slug: 'cinematic-forum-bengaluru',
        address: 'Konanakunte Cross, Kanakapura Road, Bengaluru, KA 560062',
        amenities: ['IMAX with Laser', '4DX', 'Dolby Atmos 7.1', 'Arcade & Cafe'],
        screensCount: 4
      },
      {
        id: 'cin_5',
        cityId: 'city_hyderabad',
        name: 'CINEMATIC Majestic IMAX — Banjara Hills',
        slug: 'cinematic-banjara-hyderabad',
        address: 'Road No. 1, Banjara Hills, Hyderabad, TS 500034',
        amenities: ['Grand Giant IMAX Screen', 'Dolby Atmos', 'Executive Recliners'],
        screensCount: 3
      }
    ];

    demoCinemas.forEach(c => this.cinemas.set(c.id, c));

    // 4. Seed Screens & Dynamic Seats
    demoCinemas.forEach(cinema => {
      const screenConfigs: { name: string; type: ScreenFormat }[] = [
        { name: 'Audi 1 — IMAX with Laser', type: 'IMAX_3D' as ScreenFormat },
        { name: 'Audi 2 — Dolby Atmos 3D', type: 'STANDARD_3D' as ScreenFormat },
        { name: 'Audi 3 — 4DX Motion Experience', type: 'FOUR_DX' as ScreenFormat },
        { name: 'Audi 4 — Classic Luxe 2D', type: 'STANDARD_2D' as ScreenFormat }
      ].slice(0, cinema.screensCount || 3);

      screenConfigs.forEach((cfg, sIdx) => {
        const screenId = `scr_${cinema.id}_${sIdx + 1}`;
        const screen: ScreenDTO = {
          id: screenId,
          cinemaId: cinema.id,
          name: cfg.name,
          screenType: cfg.type,
          totalSeats: 60 // 5 rows x 12 seats
        };
        this.screens.set(screenId, screen);

        // Generate Seat Matrix: Rows A to E, 12 seats per row
        // Row A: RECLINER (top tier)
        // Row B, C: PRIME
        // Row D, E: CLASSIC
        const seatIds: string[] = [];
        const rows = [
          { letter: 'A', cat: 'RECLINER' as SeatCategory, price: 48000 }, // 480 INR
          { letter: 'B', cat: 'PRIME' as SeatCategory, price: 34000 },    // 340 INR
          { letter: 'C', cat: 'PRIME' as SeatCategory, price: 34000 },    // 340 INR
          { letter: 'D', cat: 'CLASSIC' as SeatCategory, price: 24000 },  // 240 INR
          { letter: 'E', cat: 'CLASSIC' as SeatCategory, price: 24000 }   // 240 INR
        ];

        rows.forEach(r => {
          for (let num = 1; num <= 12; num++) {
            const seatId = `seat_${screenId}_${r.letter}${num}`;
            const seat: SeatDTO = {
              id: seatId,
              screenId,
              rowLetter: r.letter,
              seatNumber: num,
              seatCategory: r.cat,
              priceMinorUnits: r.price,
              isAccessible: num === 1 || num === 12
            };
            this.seats.set(seatId, seat);
            seatIds.push(seatId);
          }
        });

        this.screenSeats.set(screenId, seatIds);
      });
    });

    // 5. Seed Blockbuster Movies (Rich Metadata & Verified YouTube Trailers)
    const demoMovies: MovieDTO[] = [
      {
        id: 'mov_dune2',
        tmdbId: 693134,
        title: 'Dune: Part Two',
        slug: 'dune-part-two',
        synopsis: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future only he can foresee.',
        posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=85',
        trailerYoutubeKey: 'Way9Dexny3w',
        runtimeMinutes: 166,
        certification: 'UA',
        releaseDate: '2024-03-01',
        language: 'English',
        genres: ['Action', 'Sci-Fi', 'Adventure'],
        rating: 8.8,
        voteCount: 14250,
        isFeatured: true,
        isNowShowing: true,
        isComingSoon: false,
        director: 'Denis Villeneuve',
        cast: [
          { id: 'c1', name: 'Timothée Chalamet', character: 'Paul Atreides' },
          { id: 'c2', name: 'Zendaya', character: 'Chani' },
          { id: 'c3', name: 'Rebecca Ferguson', character: 'Lady Jessica' },
          { id: 'c4', name: 'Austin Butler', character: 'Feyd-Rautha' }
        ]
      },
      {
        id: 'mov_oppenheimer',
        tmdbId: 872585,
        title: 'Oppenheimer',
        slug: 'oppenheimer',
        synopsis: 'The story of J. Robert Oppenheimer’s role in the development of the atomic bomb during World War II, unraveling the dramatic moral paradoxes and political firestorms that followed mankind’s most perilous invention.',
        posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=600&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=85',
        trailerYoutubeKey: 'uYPbbksJxIg',
        runtimeMinutes: 180,
        certification: 'A',
        releaseDate: '2023-07-21',
        language: 'English',
        genres: ['Biography', 'Drama', 'History'],
        rating: 8.9,
        voteCount: 19800,
        isFeatured: true,
        isNowShowing: true,
        isComingSoon: false,
        director: 'Christopher Nolan',
        cast: [
          { id: 'c5', name: 'Cillian Murphy', character: 'J. Robert Oppenheimer' },
          { id: 'c6', name: 'Emily Blunt', character: 'Katherine Oppenheimer' },
          { id: 'c7', name: 'Robert Downey Jr.', character: 'Lewis Strauss' }
        ]
      },
      {
        id: 'mov_kalki',
        tmdbId: 792307,
        title: 'Kalki 2898 AD',
        slug: 'kalki-2898-ad',
        synopsis: 'Set in a post-apocalyptic world in the year 2898 AD, the film follows a perilous mission to protect the unborn child of SUM-80, the modern prophesied avatar of Vishnu destined to rid the realm of tyrannical darkness.',
        posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=85',
        trailerYoutubeKey: 'kQDd1AhGIHk',
        runtimeMinutes: 181,
        certification: 'UA',
        releaseDate: '2024-06-27',
        language: 'Hindi',
        genres: ['Sci-Fi', 'Mythology', 'Action'],
        rating: 8.4,
        voteCount: 9200,
        isFeatured: true,
        isNowShowing: true,
        isComingSoon: false,
        director: 'Nag Ashwin',
        cast: [
          { id: 'c8', name: 'Prabhas', character: 'Bhairava' },
          { id: 'c9', name: 'Amitabh Bachchan', character: 'Ashwatthama' },
          { id: 'c10', name: 'Deepika Padukone', character: 'SUM-80' }
        ]
      },
      {
        id: 'mov_spiderman',
        tmdbId: 569094,
        title: 'Spider-Man: Across the Spider-Verse',
        slug: 'spider-man-across-the-spider-verse',
        synopsis: 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence. When heroes clash on handling a new threat, Miles must redefine what it means to be a hero.',
        posterUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=600&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1920&q=85',
        trailerYoutubeKey: 'cqGjhVJWtEg',
        runtimeMinutes: 140,
        certification: 'U',
        releaseDate: '2023-06-02',
        language: 'English',
        genres: ['Animation', 'Action', 'Adventure'],
        rating: 8.7,
        voteCount: 16400,
        isFeatured: false,
        isNowShowing: true,
        isComingSoon: false,
        director: 'Joaquim Dos Santos, Kemp Powers',
        cast: [
          { id: 'c11', name: 'Shameik Moore', character: 'Miles Morales (voice)' },
          { id: 'c12', name: 'Hailee Steinfeld', character: 'Gwen Stacy (voice)' }
        ]
      },
      {
        id: 'mov_interstellar',
        tmdbId: 157336,
        title: 'Interstellar (10th Anniversary IMAX Re-Release)',
        slug: 'interstellar-imax-10th-anniversary',
        synopsis: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft along with a team of researchers through a newly discovered wormhole near Saturn.',
        posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=85',
        trailerYoutubeKey: 'zSWdZVtXT7E',
        runtimeMinutes: 169,
        certification: 'UA',
        releaseDate: '2024-11-08',
        language: 'English',
        genres: ['Adventure', 'Drama', 'Sci-Fi'],
        rating: 8.9,
        voteCount: 32000,
        isFeatured: true,
        isNowShowing: false,
        isComingSoon: true,
        director: 'Christopher Nolan',
        cast: [
          { id: 'c13', name: 'Matthew McConaughey', character: 'Cooper' },
          { id: 'c14', name: 'Anne Hathaway', character: 'Brand' }
        ]
      },
      {
        id: 'mov_avatar3',
        tmdbId: 83533,
        title: 'Avatar: Fire and Ash',
        slug: 'avatar-fire-and-ash',
        synopsis: 'The continuation of the Sully family saga on Pandora, exploring the fierce Ash People, a volcanic clan of Na’vi whose culture and ruthless ambition challenge everything Jake and Neytiri have fought for.',
        posterUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=85',
        trailerYoutubeKey: 'd9MyW72ELq0',
        runtimeMinutes: 190,
        certification: 'UA',
        releaseDate: '2025-12-19',
        language: 'English',
        genres: ['Action', 'Adventure', 'Fantasy', 'Sci-Fi'],
        rating: 9.1,
        voteCount: 4200,
        isFeatured: false,
        isNowShowing: false,
        isComingSoon: true,
        director: 'James Cameron',
        cast: [
          { id: 'c15', name: 'Sam Worthington', character: 'Jake Sully' },
          { id: 'c16', name: 'Zoe Saldaña', character: 'Neytiri' }
        ]
      }
    ];

    demoMovies.forEach(m => this.movies.set(m.id, m));

    // 6. Generate Dynamic Showtimes for Today and Next 5 Days
    const now = new Date();
    const timeSlots = [
      { hour: 10, minute: 30, format: 'STANDARD_2D' as ScreenFormat, basePrice: 22000 },
      { hour: 14, minute: 0,  format: 'IMAX_3D' as ScreenFormat,    basePrice: 38000 },
      { hour: 17, minute: 45, format: 'DOLBY_ATMOS' as ScreenFormat,basePrice: 32000 },
      { hour: 21, minute: 15, format: 'IMAX_3D' as ScreenFormat,    basePrice: 42000 }
    ];

    let showtimeCounter = 1;
    const nowShowingMovies = demoMovies.filter(m => m.isNowShowing);

    demoCinemas.forEach(cinema => {
      const screensForCinema = Array.from(this.screens.values()).filter(s => s.cinemaId === cinema.id);

      // Generate for day 0 (today) through day 4
      for (let dayOffset = 0; dayOffset <= 4; dayOffset++) {
        const showDate = new Date(now);
        showDate.setDate(showDate.getDate() + dayOffset);

        screensForCinema.forEach((screen, screenIndex) => {
          const movie = nowShowingMovies[(screenIndex + dayOffset) % nowShowingMovies.length];
          if (!movie) return;

          timeSlots.forEach((slot, slotIndex) => {
            const start = new Date(showDate);
            start.setHours(slot.hour, slot.minute, 0, 0);

            const end = new Date(start.getTime() + (movie.runtimeMinutes + 25) * 60 * 1000);

            const showtimeId = `show_${cinema.id}_s${screenIndex}_d${dayOffset}_t${slotIndex}`;
            const showtime: ShowtimeDTO = {
              id: showtimeId,
              movieId: movie.id,
              screenId: screen.id,
              cinemaId: cinema.id,
              cinemaName: cinema.name,
              cityId: cinema.cityId,
              cityName: this.cities.get(cinema.cityId)?.name,
              screenName: screen.name,
              startTime: start.toISOString(),
              endTime: end.toISOString(),
              format: screen.screenType,
              basePriceMinorUnits: slot.basePrice,
              status: 'SCHEDULED',
              movie: movie
            };

            this.showtimes.set(showtimeId, showtime);
            this.bookedSeats.set(showtimeId, new Set<string>());

            // Seed a few realistically pre-booked seats for realism
            if (dayOffset === 0 && slotIndex === 1) {
              const bookedSet = this.bookedSeats.get(showtimeId)!;
              const screenSeats = this.screenSeats.get(screen.id) || [];
              // Pre-book seats B5, B6, C6, C7
              screenSeats.forEach(sid => {
                const s = this.seats.get(sid);
                if (s && ((s.rowLetter === 'B' && (s.seatNumber === 5 || s.seatNumber === 6)) ||
                         (s.rowLetter === 'C' && (s.seatNumber === 6 || s.seatNumber === 7)))) {
                  bookedSet.add(sid);
                }
              });
            }

            showtimeCounter++;
          });
        });
      }
    });

    // 7. Seed Active Coupons
    const demoCoupons: CouponDTO[] = [
      {
        id: 'coup_1',
        code: 'CINEMA50',
        description: 'Get 50% discount up to ₹150 on your ticket subtotal',
        discountPercent: 50,
        maxDiscountMinorUnits: 15000, // ₹150 in paise
        minBookingMinorUnits: 40000,  // ₹400 in paise
        validUntil: '2026-12-31T23:59:59Z',
        isActive: true
      },
      {
        id: 'coup_2',
        code: 'BLOCKBUSTER100',
        description: 'Flat ₹100 off on IMAX and 4DX bookings above ₹500',
        discountPercent: 25,
        maxDiscountMinorUnits: 10000, // ₹100 in paise
        minBookingMinorUnits: 50000,  // ₹500 in paise
        validUntil: '2026-12-31T23:59:59Z',
        isActive: true
      },
      {
        id: 'coup_3',
        code: 'FIRSTBOOK',
        description: 'Special welcome offer: 20% off up to ₹120 for new cinema lovers',
        discountPercent: 20,
        maxDiscountMinorUnits: 12000,
        minBookingMinorUnits: 30000,
        validUntil: '2026-12-31T23:59:59Z',
        isActive: true
      }
    ];

    demoCoupons.forEach(cp => this.coupons.set(cp.code, cp));

    // 8. Seed Sample Confirmed Booking for Demo User
    const firstShowtime = Array.from(this.showtimes.values())[0];
    if (firstShowtime) {
      const screenSeats = this.screenSeats.get(firstShowtime.screenId) || [];
      const sampleSeat1 = this.seats.get(screenSeats[14]) || Array.from(this.seats.values())[0];
      const sampleSeat2 = this.seats.get(screenSeats[15]) || Array.from(this.seats.values())[1];

      const bookedSet = this.bookedSeats.get(firstShowtime.id);
      if (bookedSet && sampleSeat1 && sampleSeat2) {
        bookedSet.add(sampleSeat1.id);
        bookedSet.add(sampleSeat2.id);
      }

      const sampleBooking: DBBooking = {
        id: 'book_demo_past_1',
        bookingReference: 'CNM-849201',
        userId: 'usr_customer_demo',
        showtimeId: firstShowtime.id,
        showtime: firstShowtime,
        movieTitle: firstShowtime.movie?.title || 'Dune: Part Two',
        cinemaName: firstShowtime.cinemaName || 'CINEMATIC Megaplex',
        screenName: firstShowtime.screenName || 'Audi 1',
        format: firstShowtime.format,
        showStartTime: firstShowtime.startTime,
        seats: [
          {
            seatId: sampleSeat1.id,
            seatIdentifier: `${sampleSeat1.rowLetter}${sampleSeat1.seatNumber}`,
            seatCategory: sampleSeat1.seatCategory,
            priceMinorUnits: sampleSeat1.priceMinorUnits
          },
          {
            seatId: sampleSeat2.id,
            seatIdentifier: `${sampleSeat2.rowLetter}${sampleSeat2.seatNumber}`,
            seatCategory: sampleSeat2.seatCategory,
            priceMinorUnits: sampleSeat2.priceMinorUnits
          }
        ],
        subtotalMinorUnits: sampleSeat1.priceMinorUnits + sampleSeat2.priceMinorUnits,
        taxMinorUnits: Math.round((sampleSeat1.priceMinorUnits + sampleSeat2.priceMinorUnits) * 0.18),
        convenienceFeeMinorUnits: 6000, // ₹60
        discountMinorUnits: 0,
        totalAmountMinorUnits: Math.round((sampleSeat1.priceMinorUnits + sampleSeat2.priceMinorUnits) * 1.18) + 6000,
        currency: 'INR',
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        qrCodeDataUrl: null, // Will be generated or displayed cleanly
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        canCancel: true,
        refundAmountMinorUnits: Math.round(((sampleSeat1.priceMinorUnits + sampleSeat2.priceMinorUnits) * 1.18 + 6000) * 0.75)
      };

      this.bookings.set(sampleBooking.id, sampleBooking);
    }

    // 9. Initial Audit Log
    this.auditLogs.push({
      id: 'audit_init',
      action: 'SYSTEM_BOOT',
      resource: 'CinematicStore',
      details: 'In-memory seed data populated successfully with demo accounts, cinemas, seats, and movies.',
      createdAt: new Date().toISOString()
    });
  }

  // Seat Lock & Concurrency Management
  public getSeatAvailability(showtimeId: string): SeatWithStatusDTO[] {
    const showtime = this.showtimes.get(showtimeId);
    if (!showtime) return [];

    const seatIds = this.screenSeats.get(showtime.screenId) || [];
    const booked = this.bookedSeats.get(showtimeId) || new Set<string>();
    const now = Date.now();

    return seatIds.map(seatId => {
      const seat = this.seats.get(seatId)!;
      let status: 'AVAILABLE' | 'LOCKED' | 'BOOKED' = 'AVAILABLE';
      let lockedByUserId: string | null = null;
      let lockedUntil: string | null = null;

      if (booked.has(seatId)) {
        status = 'BOOKED';
      } else {
        const lockKey = `${showtimeId}:${seatId}`;
        const activeLock = this.seatLocks.get(lockKey);
        if (activeLock) {
          if (activeLock.lockedUntil > now) {
            status = 'LOCKED';
            lockedByUserId = activeLock.userId;
            lockedUntil = new Date(activeLock.lockedUntil).toISOString();
          } else {
            // Expired lock
            this.seatLocks.delete(lockKey);
          }
        }
      }

      return {
        ...seat,
        status,
        lockedByUserId,
        lockedUntil
      };
    });
  }

  public lockSeats(showtimeId: string, seatIds: string[], userId: string, ttlSeconds = 600): { success: boolean; error?: string; lockedUntil?: string } {
    const showtime = this.showtimes.get(showtimeId);
    if (!showtime) return { success: false, error: 'Showtime not found' };

    const booked = this.bookedSeats.get(showtimeId) || new Set<string>();
    const now = Date.now();
    const expiryMs = now + ttlSeconds * 1000;

    // Concurrency Check: verify none of the requested seats are booked or locked by another user
    for (const seatId of seatIds) {
      if (booked.has(seatId)) {
        return { success: false, error: `Seat is already booked by another customer.` };
      }

      const lockKey = `${showtimeId}:${seatId}`;
      const existingLock = this.seatLocks.get(lockKey);
      if (existingLock && existingLock.lockedUntil > now && existingLock.userId !== userId) {
        return { success: false, error: `One or more seats have just been selected by another user. Please choose alternative seats.` };
      }
    }

    // Release any previous locks held by this user for this showtime that are not in seatIds
    for (const [key, lock] of this.seatLocks.entries()) {
      if (lock.showtimeId === showtimeId && lock.userId === userId && !seatIds.includes(lock.seatId)) {
        this.seatLocks.delete(key);
      }
    }

    // Acquire lock for the selected seats
    for (const seatId of seatIds) {
      const lockKey = `${showtimeId}:${seatId}`;
      this.seatLocks.set(lockKey, {
        id: `lock_${Date.now()}_${seatId}`,
        showtimeId,
        seatId,
        userId,
        lockedUntil: expiryMs
      });
    }

    return { success: true, lockedUntil: new Date(expiryMs).toISOString() };
  }

  public releaseSeats(showtimeId: string, seatIds: string[], userId: string) {
    for (const seatId of seatIds) {
      const lockKey = `${showtimeId}:${seatId}`;
      const existing = this.seatLocks.get(lockKey);
      if (existing && (existing.userId === userId || existing.lockedUntil <= Date.now())) {
        this.seatLocks.delete(lockKey);
      }
    }
  }

  public cleanupExpiredLocks(): number {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, lock] of this.seatLocks.entries()) {
      if (lock.lockedUntil <= now) {
        this.seatLocks.delete(key);
        cleaned++;
      }
    }
    return cleaned;
  }
}

export const store = new InMemoryStore();
