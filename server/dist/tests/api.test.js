"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_js_1 = require("../app.js");
const store_js_1 = require("../db/store.js");
(0, vitest_1.describe)('CINEMATIC Platform Backend API Tests', () => {
    (0, vitest_1.it)('GET /health returns 200 and HEALTHY', async () => {
        const res = await (0, supertest_1.default)(app_js_1.app).get('/health');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.status).toBe('HEALTHY');
    });
    (0, vitest_1.it)('GET /api/v1/movies returns list of blockbuster movies', async () => {
        const res = await (0, supertest_1.default)(app_js_1.app).get('/api/v1/movies');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.success).toBe(true);
        (0, vitest_1.expect)(Array.isArray(res.body.data)).toBe(true);
        (0, vitest_1.expect)(res.body.data.length).toBeGreaterThan(0);
        (0, vitest_1.expect)(res.body.data[0]).toHaveProperty('title');
        (0, vitest_1.expect)(res.body.data[0]).toHaveProperty('posterUrl');
    });
    (0, vitest_1.it)('POST /api/v1/auth/demo-switch switches user and returns valid token', async () => {
        const res = await (0, supertest_1.default)(app_js_1.app).post('/api/v1/auth/demo-switch?role=CUSTOMER');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.success).toBe(true);
        (0, vitest_1.expect)(res.body.data.user.role).toBe('CUSTOMER');
        (0, vitest_1.expect)(res.body.data).toHaveProperty('token');
    });
    (0, vitest_1.it)('GET /api/v1/coupons returns active discount offers', async () => {
        const res = await (0, supertest_1.default)(app_js_1.app).get('/api/v1/coupons');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.data.length).toBeGreaterThan(0);
        (0, vitest_1.expect)(res.body.data[0]).toHaveProperty('code');
    });
    (0, vitest_1.it)('POST /api/v1/coupons/validate verifies minimum booking requirement', async () => {
        // Attempt applying CINEMA50 with low subtotal (below 40000 paise)
        const res = await (0, supertest_1.default)(app_js_1.app).post('/api/v1/coupons/validate').send({
            code: 'CINEMA50',
            subtotalMinorUnits: 20000
        });
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body.success).toBe(false);
        // Apply with valid subtotal (e.g. 50000 paise = ₹500)
        const validRes = await (0, supertest_1.default)(app_js_1.app).post('/api/v1/coupons/validate').send({
            code: 'CINEMA50',
            subtotalMinorUnits: 50000
        });
        (0, vitest_1.expect)(validRes.status).toBe(200);
        (0, vitest_1.expect)(validRes.body.success).toBe(true);
        (0, vitest_1.expect)(validRes.body.data.discountMinorUnits).toBe(15000); // capped at ₹150
    });
    (0, vitest_1.it)('Prevents simultaneous double-booking of the same seat', async () => {
        const showtime = Array.from(store_js_1.store.showtimes.values())[0];
        const seats = store_js_1.store.getSeatAvailability(showtime.id);
        const availableSeat = seats.find(s => s.status === 'AVAILABLE');
        (0, vitest_1.expect)(availableSeat).toBeDefined();
        // User A locks seat
        const lockResA = await (0, supertest_1.default)(app_js_1.app).post('/api/v1/seats/lock').send({
            showtimeId: showtime.id,
            seatIds: [availableSeat.id],
            guestId: 'user_a'
        });
        (0, vitest_1.expect)(lockResA.status).toBe(200);
        // User B attempts to lock the exact same seat
        const lockResB = await (0, supertest_1.default)(app_js_1.app).post('/api/v1/seats/lock').send({
            showtimeId: showtime.id,
            seatIds: [availableSeat.id],
            guestId: 'user_b'
        });
        (0, vitest_1.expect)(lockResB.status).toBe(409); // Conflict: already locked!
    });
});
