# CINEMATIC — Next-Gen Full-Stack Movie Ticket Booking Platform

**CINEMATIC** is a full-stack, production-grade movie ticket booking and entertainment platform inspired by world-class cinema platforms, built with an original brand identity, real-time interactive seat locking via Socket.IO, Razorpay payment processing, TMDB metadata discovery, and role-based administration.

---

## 🌟 Key Features

### 1. Cinematic Visual Experience
- **Original Visual Identity**: Midnight & charcoal obsidian backgrounds (`#08090C`, `#12151B`), vivid crimson & coral accents (`#E50914`, `#FF2E4D`), gold highlights, and typography from Google Fonts (*Outfit* and *Inter*).
- **Responsive Architecture**: Built for desktop, tablet, and mobile devices with micro-interactions, skeleton loading, and accessible contrast.
- **Hero Spotlight Carousel**: Dynamic blockbuster banners with official trailer video embeds, certifications, runtimes, and ratings.

### 2. Real-Time Seat Concurrency & Locking
- **Curved Screen Visualizer**: SVG curved screen ("All Eyes This Way") with ambient neon glows.
- **Tiered Seating Layout**:
  - **VIP Recliner Tier** (₹480 / 48,000 paise): Plush leather luxury loungers.
  - **Prime Tier** (₹340 / 34,000 paise): Central acoustic sweet spot.
  - **Classic Tier** (₹240 / 24,000 paise): Front auditorium value seats.
- **Atomic Concurrency Protection**: High-concurrency prevention of double-booking. When a customer taps a seat, a server-side lock is created for **10 minutes**.
- **Real-Time WebSocket Sync**: Connected clients across India receive instant `SEATS_LOCKED`, `SEATS_RELEASED`, and `SEATS_BOOKED` events via Socket.IO without page refreshes.
- **Hold Expiry Ticker**: Dynamic countdown timer with auto-release after 10 minutes.

### 3. Authoritative Pricing & Razorpay India Payments
- **Minor Unit Accounting**: All ticket prices, GST (18%), convenience fees (₹30/seat), and promo discounts are computed on the backend in minor units (**paise**) to prevent rounding errors and client-side manipulation.
- **Razorpay Orders API**: Order creation with unique cryptographic receipts.
- **Cryptographic Signature Verification**: HMAC-SHA256 signature verification before confirming tickets and generating booking tokens.
- **Interactive Promo Vouchers**: Coupons (`CINEMA50`, `BLOCKBUSTER100`, `FIRSTBOOK`) with minimum spend and maximum cap enforcement.
- **Digital QR E-Tickets**: Server-rendered 256-bit scannable QR ticket code containing verified booking reference, seat identifiers, and cinema details.

### 4. Self-Service Cancellations & Instant Refunds
- **Automated Policy Engine**: Bookings can be cancelled up to 2 hours before showtime.
- **Refund Calculation**: Computes 75% refund automatically, marks seats back to public availability, and dispatches refund transactions.

### 5. Multi-Role Administration & Audit Logging
- **Admin Dashboard**: Real-time revenue KPIs (Gross Revenue, Total Bookings, Seat Occupancy %, Active Movies).
- **Movie Catalog Manager**: Add, edit, or delete movie listings with custom trailers and certifications.
- **Showtime Scheduler**: Assign films to screens across cities with custom pricing.
- **Security Audit Trail**: Append-only log recording admin operations, logins, cancellations, and transactions.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Lucide Icons, React Router v7, Canvas Confetti.
- **Backend**: Node.js, Express.js, TypeScript, Socket.IO, Zod validation, JWT, Bcrypt, QRCode.
- **Database & ORM**: PostgreSQL with Prisma ORM (`prisma/schema.prisma`), Docker Compose, and a zero-dependency in-memory persistence fallback for immediate local testing.
- **Payments**: Razorpay Checkout & Orders API.
- **Movie Discovery**: TMDB API integration service with multi-level caching and high-definition movie seed data.
- **Testing**: Vitest, Supertest integration tests.

---

## 👥 Demo Evaluation Accounts

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@cinematic.com` | `Password123!` | Book seats, apply coupons, pay via Razorpay, view QR passes, cancel tickets. |
| **Admin** | `admin@cinematic.com` | `AdminPass123!` | Full access to Admin Portal, Revenue KPIs, add/delete movies, audit logs. |
| **Cinema Manager**| `manager@cinematic.com` | `ManagerPass123!` | Manage screens, schedule showtimes, monitor local seat occupancy. |
| **Support Staff** | `support@cinematic.com` | `SupportPass123!` | Inspect customer bookings, verify ticket QR codes, assist with refunds. |

> **Pro Tip**: Use the **1-Click Role Switcher** in the user profile menu to test different roles instantly without re-typing passwords!

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies

```bash
# Install root dependencies
npm install

# Install server & client dependencies
npm --prefix server install
npm --prefix client install
```

### 2. Environment Configuration

Copy `.env.example` to `server/.env`:
```bash
cp .env.example server/.env
```

Review default settings in `server/.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://cinematic_user:cinematic_secure_pass@localhost:5432/cinematic_db?schema=public
JWT_SECRET=super_secret_jwt_key_at_least_32_chars_long_production
JWT_REFRESH_SECRET=super_secret_refresh_jwt_key_at_least_32_chars_production
RAZORPAY_KEY_ID=rzp_test_CinematicDemoKeyId
RAZORPAY_KEY_SECRET=rzp_test_CinematicDemoSecretKey
TMDB_API_KEY=
```

### 3. Start Database (Optional / PostgreSQL via Docker)

If you have Docker installed:
```bash
docker-compose up -d postgres
npm --prefix server run db:push
npm --prefix server run db:seed
```
*Note: If Docker is not installed on your system, the server automatically boots with its built-in high-fidelity persistence engine and complete seed catalog!*

### 4. Run Development Servers

In terminal 1 (Backend API & WebSockets):
```bash
npm run dev:server
```
*(Runs on `http://localhost:5000`)*

In terminal 2 (Vite Frontend):
```bash
npm run dev:client
```
*(Runs on `http://localhost:5173`)*

---

## 🧪 Automated Testing

Run the automated integration and unit test suite:

```bash
# Run backend API & concurrency tests
npm --prefix server test
```

### Verified Test Cases:
1. `GET /health`: Healthcheck returns status 200 HEALTHY.
2. `GET /api/v1/movies`: Retrieves blockbuster movies with genres, certification, and ratings.
3. `POST /api/v1/auth/demo-switch`: Smooth role authentication switching with JWT token.
4. `POST /api/v1/coupons/validate`: Enforces minimum booking rules and discount caps.
5. **Double-Booking Prevention**: Proves that when User A locks a seat, User B's concurrent attempt to lock the same seat is rejected with HTTP `409 Conflict`.

---

## 📂 Project Architecture

```
Project service now/
├── client/                     # Frontend Application
│   ├── src/
│   │   ├── components/         # Navbar, Footer, CityModal, AuthModal, TrailerModal, MovieCard
│   │   ├── context/            # AuthContext, CityContext, ToastContext
│   │   ├── pages/              # Home, Movies, Details, Showtimes, Seats, Checkout, Confirmation, Admin...
│   │   ├── services/           # api.ts (HTTP client with JWT auto-injection)
│   │   └── types/              # TypeScript interfaces
│   ├── tailwind.config.js      # Cinematic dark theme tokens
│   └── vite.config.ts          # Vite configuration with API & WebSocket proxy
├── server/                     # Backend Application
│   ├── prisma/
│   │   └── schema.prisma       # Comprehensive PostgreSQL relational models & enums
│   ├── src/
│   │   ├── config/             # Zod validated env.ts
│   │   ├── controllers/        # Auth, Movie, Cinema, Seat, Booking, Coupon, Admin
│   │   ├── db/                 # store.ts (concurrency & memory engine) & prisma.ts
│   │   ├── middleware/         # auth.middleware.ts, error.middleware.ts
│   │   ├── routes/             # api.v1.ts REST endpoints
│   │   ├── services/           # Razorpay, TMDB, Email, QRCode
│   │   ├── socket/             # seatSocket.ts (Socket.IO real-time seat room sync)
│   │   └── tests/              # api.test.ts
├── docker-compose.yml          # PostgreSQL & Backend service containers
├── .env.example                # Environment variables template
└── README.md
```

---

## 🔒 Security & Production Checklist

- **Strict Validation**: All incoming requests validated on server and client with Zod.
- **SQL Injection Prevention**: Safe parameterized Prisma ORM queries.
- **Authentication**: JWT with refresh token rotation and bcrypt password hashing.
- **Helmet & Restrictive CORS**: Configured for secure browser execution while supporting YouTube trailer iframes and Razorpay checkout scripts.
- **Payment Safety**: Server-calculated amounts in minor units (paise). Client-supplied pricing is strictly ignored.
