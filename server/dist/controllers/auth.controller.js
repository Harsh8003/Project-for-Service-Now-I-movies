"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const env_js_1 = require("../config/env.js");
const store_js_1 = require("../db/store.js");
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    phone: zod_1.z.string().optional(),
    preferredCityId: zod_1.z.string().optional()
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required')
});
function generateTokens(userId, role) {
    const token = jsonwebtoken_1.default.sign({ userId, role }, env_js_1.env.JWT_SECRET, { expiresIn: '2h' });
    const refreshToken = jsonwebtoken_1.default.sign({ userId, role }, env_js_1.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    return { token, refreshToken };
}
class AuthController {
    static async register(req, res) {
        const data = registerSchema.parse(req.body);
        // Check if user already exists
        const existing = Array.from(store_js_1.store.users.values()).find(u => u.email.toLowerCase() === data.email.toLowerCase());
        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists.'
            });
        }
        const passwordHash = await bcryptjs_1.default.hash(data.password, 10);
        const userId = `usr_${Date.now()}`;
        const newUser = {
            id: userId,
            email: data.email.toLowerCase(),
            name: data.name,
            phone: data.phone || null,
            role: 'CUSTOMER',
            avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}&backgroundColor=e50914`,
            preferredCityId: data.preferredCityId || 'city_mumbai',
            createdAt: new Date().toISOString(),
            passwordHash
        };
        store_js_1.store.users.set(userId, newUser);
        const { token, refreshToken } = generateTokens(newUser.id, newUser.role);
        // Audit log
        store_js_1.store.auditLogs.unshift({
            id: `audit_${Date.now()}`,
            userId: newUser.id,
            userEmail: newUser.email,
            action: 'USER_REGISTERED',
            resource: 'User',
            createdAt: new Date().toISOString()
        });
        res.status(201).json({
            success: true,
            message: 'Account registered successfully.',
            data: {
                token,
                refreshToken,
                user: {
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                    phone: newUser.phone,
                    role: newUser.role,
                    avatarUrl: newUser.avatarUrl,
                    preferredCityId: newUser.preferredCityId
                }
            }
        });
    }
    static async login(req, res) {
        const data = loginSchema.parse(req.body);
        const user = Array.from(store_js_1.store.users.values()).find(u => u.email.toLowerCase() === data.email.toLowerCase());
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }
        const isMatch = await bcryptjs_1.default.compare(data.password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }
        const { token, refreshToken } = generateTokens(user.id, user.role);
        res.json({
            success: true,
            message: 'Logged in successfully.',
            data: {
                token,
                refreshToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    avatarUrl: user.avatarUrl,
                    preferredCityId: user.preferredCityId
                }
            }
        });
    }
    static async me(req, res) {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }
        res.json({
            success: true,
            data: { user: req.user }
        });
    }
    /**
     * One-click demo login switcher for testing Customer, Admin, Cinema Manager, Support
     */
    static async demoLogin(req, res) {
        const role = req.query.role || 'CUSTOMER';
        const user = Array.from(store_js_1.store.users.values()).find(u => u.role === role);
        if (!user) {
            return res.status(404).json({ success: false, message: `Demo user for role ${role} not found` });
        }
        const { token, refreshToken } = generateTokens(user.id, user.role);
        res.json({
            success: true,
            message: `Switched session to ${user.name} (${user.role})`,
            data: {
                token,
                refreshToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    avatarUrl: user.avatarUrl,
                    preferredCityId: user.preferredCityId
                }
            }
        });
    }
}
exports.AuthController = AuthController;
