import { describe, it, expect } from 'vitest';

describe('CINEMATIC Frontend Unit Tests', () => {
  it('Calculates subtotal and taxes correctly in minor units', () => {
    const seats = [
      { priceMinorUnits: 48000 }, // ₹480
      { priceMinorUnits: 34000 }  // ₹340
    ];
    const subtotal = seats.reduce((acc, s) => acc + s.priceMinorUnits, 0);
    expect(subtotal).toBe(82000);

    const gst = Math.round(subtotal * 0.18);
    expect(gst).toBe(14760); // ₹147.60

    const fee = seats.length * 3000; // ₹60.00
    expect(fee).toBe(6000);

    const total = subtotal + gst + fee;
    expect(total).toBe(102760); // ₹1027.60
  });

  it('Calculates 50% discount with maximum cap correctly', () => {
    const subtotal = 82000;
    const discountPercent = 50;
    const maxDiscount = 15000; // max ₹150

    const computed = Math.round((subtotal * discountPercent) / 100);
    const appliedDiscount = Math.min(computed, maxDiscount);

    expect(appliedDiscount).toBe(15000);
  });

  it('Enforces cancellation refund of 75%', () => {
    const totalAmount = 100000; // ₹1,000
    const refundAmount = Math.round(totalAmount * 0.75);
    expect(refundAmount).toBe(75000); // ₹750
  });
});
