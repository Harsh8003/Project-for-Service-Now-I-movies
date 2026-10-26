import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { store, DBUser } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { Role } from '../types/index.js';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  preferredCityId: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

function generateTokens(userId: string, role: Role) {
  const token = jwt.sign({ userId, role }, env.JWT_SECRET, { expiresIn: '2h' });
  const refreshToken = jwt.sign({ userId, role }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { token, refreshToken };
}

export class AuthController {
  public static async register(req: Request, res: Response) {
    const data = registerSchema.parse(req.body);

    // Check if user already exists
    const existing = Array.from(store.users.values()).find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const userId = `usr_${Date.now()}`;

    const newUser: DBUser = {
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

    store.users.set(userId, newUser);

    const { token, refreshToken } = generateTokens(newUser.id, newUser.role);

    // Audit log
    store.auditLogs.unshift({
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

  public static async login(req: Request, res: Response) {
    const data = loginSchema.parse(req.body);

    const user = Array.from(store.users.values()).find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
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

  public static async me(req: AuthenticatedRequest, res: Response) {
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
  public static async demoLogin(req: Request, res: Response) {
    const role = (req.query.role as Role) || 'CUSTOMER';
    const user = Array.from(store.users.values()).find(u => u.role === role);

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
