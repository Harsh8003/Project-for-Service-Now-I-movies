"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponController = void 0;
const zod_1 = require("zod");
const store_js_1 = require("../db/store.js");
const validateCouponSchema = zod_1.z.object({
    code: zod_1.z.string().min(1, 'Coupon code is required'),
    subtotalMinorUnits: zod_1.z.number().positive('Subtotal must be positive')
});
class CouponController {
    static async getCoupons(req, res) {
        const coupons = Array.from(store_js_1.store.coupons.values()).filter(c => c.isActive);
        res.json({
            success: true,
            data: coupons
        });
    }
    static async validateCoupon(req, res) {
        const { code, subtotalMinorUnits } = validateCouponSchema.parse(req.body);
        const coupon = store_js_1.store.coupons.get(code.toUpperCase());
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
exports.CouponController = CouponController;
