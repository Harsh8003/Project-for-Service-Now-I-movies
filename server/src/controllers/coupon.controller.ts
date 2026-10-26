import { Request, Response } from 'express';
import { z } from 'zod';
import { store } from '../db/store.js';

const validateCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
  subtotalMinorUnits: z.number().positive('Subtotal must be positive')
});

export class CouponController {
  public static async getCoupons(req: Request, res: Response) {
    const coupons = Array.from(store.coupons.values()).filter(c => c.isActive);
    res.json({
      success: true,
      data: coupons
    });
  }

  public static async validateCoupon(req: Request, res: Response) {
    const { code, subtotalMinorUnits } = validateCouponSchema.parse(req.body);
    const coupon = store.coupons.get(code.toUpperCase());

    if (!coupon || !coupon.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired coupon code.'
      });
    }

    if (subtotalMinorUnits < coupon.minBookingMinorUnits) {
      const minAmountFormatted = (coupon.minBookingMinorUnits / 100).toFixed(0);
      return res.status(400).json({
        success: false,
        message: `This coupon requires a minimum booking amount of ₹${minAmountFormatted}.`
      });
    }

    const calculatedDiscount = Math.round((subtotalMinorUnits * coupon.discountPercent) / 100);
    const discountMinorUnits = Math.min(calculatedDiscount, coupon.maxDiscountMinorUnits);

    res.json({
      success: true,
      message: `Coupon '${coupon.code}' applied successfully!`,
      data: {
        code: coupon.code,
        discountPercent: coupon.discountPercent,
        discountMinorUnits,
        discountAmountFormatted: (discountMinorUnits / 100).toFixed(2)
      }
    });
  }
}
