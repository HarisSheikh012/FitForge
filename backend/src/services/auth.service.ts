import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { authenticator } from 'otplib';
import { prisma } from '../config/database';
import { AppError } from '../middleware/error';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getTokenExpiry,
} from '../utils/jwt';
import { logger } from '../utils/logger';
import type {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from '../validators/auth.validator';

export class AuthService {
  async register(data: RegisterInput, ipAddress?: string) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError('Email already in use', 409);

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role ?? 'MEMBER',
        emailVerifyToken,
        isEmailVerified: false,
      },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, isEmailVerified: true, createdAt: true,
      },
    });

    // TODO: Send verification email
    logger.info(`User registered: ${user.email} [token: ${emailVerifyToken}]`);

    return { user, emailVerifyToken };
  }

  async login(data: LoginInput, ipAddress?: string, userAgent?: string) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new AppError('Invalid email or password', 401);
    if (!user.isActive) throw new AppError('Account is deactivated. Contact support.', 403);

    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) throw new AppError('Invalid email or password', 401);

    // 2FA check
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!data.totpCode) {
        throw new AppError('2FA code required', 428, { requires2FA: true });
      }
      const isValid = authenticator.verify({
        token: data.totpCode,
        secret: user.twoFactorSecret,
      });
      if (!isValid) throw new AppError('Invalid 2FA code', 401);
    }

    // Generate tokens
    const tokenId = uuidv4();
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      gymId: user.gymId,
    });

    const refreshToken = generateRefreshToken({ userId: user.id, tokenId });
    const refreshExpiry = getTokenExpiry('7d');

    await prisma.refreshToken.create({
      data: {
        id: tokenId,
        token: refreshToken,
        userId: user.id,
        expiresAt: refreshExpiry,
        userAgent,
        ipAddress,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ipAddress },
    });

    const { password: _, twoFactorSecret: __, ...safeUser } = user;
    return { user: safeUser, accessToken, refreshToken };
  }

  async refreshToken(token: string) {
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw new AppError('Invalid refresh token', 401);
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      throw new AppError('Refresh token expired or revoked', 401);
    }

    if (!storedToken.user.isActive) {
      throw new AppError('Account deactivated', 403);
    }

    // Rotate token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    const newTokenId = uuidv4();
    const newAccessToken = generateAccessToken({
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
      gymId: storedToken.user.gymId,
    });
    const newRefreshToken = generateRefreshToken({ userId: storedToken.user.id, tokenId: newTokenId });

    await prisma.refreshToken.create({
      data: {
        id: newTokenId,
        token: newRefreshToken,
        userId: storedToken.user.id,
        expiresAt: getTokenExpiry('7d'),
        userAgent: storedToken.userAgent,
        ipAddress: storedToken.ipAddress,
      },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken: string) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { isRevoked: true },
    });
  }

  async verifyEmail(token: string) {
    const user = await prisma.user.findFirst({
      where: { emailVerifyToken: token },
    });

    if (!user) throw new AppError('Invalid or expired verification token', 400);

    await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, emailVerifyToken: null },
    });

    return { message: 'Email verified successfully' };
  }

  async forgotPassword(data: ForgotPasswordInput) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    // Always return success to prevent email enumeration
    if (!user) return { message: 'If that email exists, a reset link has been sent' };

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // TODO: Send reset email with resetToken (not hashed)
    logger.info(`Password reset token for ${user.email}: ${resetToken}`);

    return { message: 'If that email exists, a reset link has been sent', resetToken };
  }

  async resetPassword(data: ResetPasswordInput) {
    const hashedToken = crypto.createHash('sha256').update(data.token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpiry: { gt: new Date() },
      },
    });

    if (!user) throw new AppError('Invalid or expired reset token', 400);

    const hashedPassword = await bcrypt.hash(data.password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });

    // Revoke all refresh tokens for security
    await prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { isRevoked: true },
    });

    return { message: 'Password reset successfully' };
  }

  async changePassword(userId: string, data: ChangePasswordInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    const isValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isValid) throw new AppError('Current password is incorrect', 400);

    const hashedPassword = await bcrypt.hash(data.newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, avatar: true, role: true, gymId: true,
        isEmailVerified: true, twoFactorEnabled: true,
        lastLoginAt: true, createdAt: true,
      },
    });
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  async setup2FA(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(user.email, 'FitForge', secret);

    // Store temporarily until verified
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    return { secret, otpAuthUrl };
  }

  async verify2FA(userId: string, code: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) throw new AppError('2FA not set up', 400);

    const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
    if (!isValid) throw new AppError('Invalid 2FA code', 400);

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return { message: '2FA enabled successfully' };
  }

  async disable2FA(userId: string, code: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) throw new AppError('2FA not enabled', 400);

    const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
    if (!isValid) throw new AppError('Invalid 2FA code', 400);

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });

    return { message: '2FA disabled successfully' };
  }
}

export const authService = new AuthService();
