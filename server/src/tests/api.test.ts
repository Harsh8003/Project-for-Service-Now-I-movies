import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { store } from '../db/store.js';

describe('CINEMATIC Platform Backend API Tests', () => {
  it('GET /health returns 200 and HEALTHY', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('HEALTHY');
  });

  it('GET /api/v1/movies returns list of blockbuster movies', async () => {
    const res = await request(app).get('/api/v1/movies');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('title');
    expect(res.body.data[0]).toHaveProperty('posterUrl');
  });

  it('POST /api/v1/auth/demo-switch switches user and returns valid token', async () => {
    const res = await request(app).post('/api/v1/auth/demo-switch?role=CUSTOMER');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('CUSTOMER');
    expect(res.body.data).toHaveProperty('token');
  });

  it('GET /api/v1/coupons returns active discount offers', async () => {
    const res = await request(app).get('/api/v1/coupons');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('code');
  });

  it('POST /api/v1/coupons/validate verifies minimum booking requirement', async () => {
    // Attempt applying CINEMA50 with low subtotal (below 40000 paise)
    const res = await request(app).post('/api/v1/coupons/validate').send({
      code: 'CINEMA50',
      subtotalMinorUnits: 20000
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);

    // Apply with valid subtotal (e.g. 50000 paise = ₹500)
    const validRes = await request(app).post('/api/v1/coupons/validate').send({
      code: 'CINEMA50',
      subtotalMinorUnits: 50000
    });
    expect(validRes.status).toBe(200);
    expect(validRes.body.success).toBe(true);
    expect(validRes.body.data.discountMinorUnits).toBe(15000); // capped at ₹150
  });

  it('Prevents simultaneous double-booking of the same seat', async () => {
    const showtime = Array.from(store.showtimes.values())[0];
    const seats = store.getSeatAvailability(showtime.id);
    const availableSeat = seats.find(s => s.status === 'AVAILABLE');
    expect(availableSeat).toBeDefined();

    // User A locks seat
    const lockResA = await request(app).post('/api/v1/seats/lock').send({
      showtimeId: showtime.id,
      seatIds: [availableSeat!.id],
      guestId: 'user_a'
    });
    expect(lockResA.status).toBe(200);

    // User B attempts to lock the exact same seat
    const lockResB = await request(app).post('/api/v1/seats/lock').send({
      showtimeId: showtime.id,
      seatIds: [availableSeat!.id],
      guestId: 'user_b'
    });
    expect(lockResB.status).toBe(409); // Conflict: already locked!
  });
});
