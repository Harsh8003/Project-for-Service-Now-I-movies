import { PrismaClient, Role, SeatCategory, ScreenFormat } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding PostgreSQL database with DEMO data...');

  // Passwords
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const adminHash = await bcrypt.hash('AdminPass123!', 10);

  // 1. Seed Demo Users
  const customer = await prisma.user.upsert({
    where: { email: 'customer@cinematic.com' },
    update: {},
    create: {
      email: 'customer@cinematic.com',
      name: 'Aarav Sharma (Demo Customer)',
      role: Role.CUSTOMER,
      passwordHash
    }
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@cinematic.com' },
    update: {},
    create: {
      email: 'admin@cinematic.com',
      name: 'Vikramaditya Singhania (Head Admin)',
      role: Role.ADMIN,
      passwordHash: adminHash
    }
  });

  // 2. Seed Cities
  const mumbai = await prisma.city.upsert({
    where: { slug: 'mumbai' },
    update: {},
    create: {
      name: 'Mumbai',
      slug: 'mumbai',
      state: 'Maharashtra'
    }
  });

  const delhi = await prisma.city.upsert({
    where: { slug: 'delhi-ncr' },
    update: {},
    create: {
      name: 'Delhi-NCR',
      slug: 'delhi-ncr',
      state: 'Delhi'
    }
  });

  // 3. Seed Cinema & Screen
  const cinema = await prisma.cinema.upsert({
    where: { slug: 'cinematic-phoenix-palladium-mumbai' },
    update: {},
    create: {
      name: 'CINEMATIC Megaplex — Phoenix Palladium',
      slug: 'cinematic-phoenix-palladium-mumbai',
      cityId: mumbai.id,
      address: '462 Senapati Bapat Marg, Lower Parel, Mumbai, MH 400013',
      amenities: ['IMAX Laser', 'Dolby Atmos', 'Recliner VIP Lounges']
    }
  });

  const screen = await prisma.screen.create({
    data: {
      cinemaId: cinema.id,
      name: 'Audi 1 — IMAX with Laser',
      screenType: ScreenFormat.IMAX_3D,
      totalSeats: 60
    }
  });

  // 4. Seed Movie
  const movie = await prisma.movie.upsert({
    where: { slug: 'dune-part-two' },
    update: {},
    create: {
      title: 'Dune: Part Two',
      slug: 'dune-part-two',
      synopsis: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against conspirators.',
      posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=85',
      trailerYoutubeKey: 'Way9Dexny3w',
      runtimeMinutes: 166,
      certification: 'UA',
      releaseDate: new Date('2024-03-01'),
      language: 'English',
      genres: ['Action', 'Sci-Fi', 'Adventure'],
      rating: 8.8,
      voteCount: 14200,
      isFeatured: true,
      isNowShowing: true
    }
  });

  // 5. Seed Showtime
  const start = new Date();
  start.setHours(19, 30, 0, 0);
  const end = new Date(start.getTime() + 180 * 60 * 1000);

  await prisma.showtime.create({
    data: {
      movieId: movie.id,
      screenId: screen.id,
      startTime: start,
      endTime: end,
      format: ScreenFormat.IMAX_3D,
      basePriceMinorUnits: 38000
    }
  });

  // 6. Seed Coupon
  await prisma.coupon.upsert({
    where: { code: 'CINEMA50' },
    update: {},
    create: {
      code: 'CINEMA50',
      description: 'Get 50% discount up to ₹150',
      discountPercent: 50,
      maxDiscountMinorUnits: 15000,
      minBookingMinorUnits: 40000,
      validFrom: new Date(),
      validUntil: new Date('2026-12-31')
    }
  });

  console.log('PostgreSQL database seeded successfully with demo data!');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
