import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess, sendCreated, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../validators/auth.validator';

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */
export class AuthController {
  /**
   * @swagger
   * /auth/register:
   *   post:
   *     tags: [Auth]
   *     summary: Register a new user
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password, firstName, lastName]
   *             properties:
   *               email: { type: string, format: email }
   *               password: { type: string, minLength: 8 }
   *               firstName: { type: string }
   *               lastName: { type: string }
   *               phone: { type: string }
   *     responses:
   *       201:
   *         description: User registered successfully
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { body } = registerSchema.parse({ body: req.body });
      const result = await authService.register(body, req.ip);
      sendCreated(res, result.user, 'Registration successful. Please verify your email.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /auth/login:
   *   post:
   *     tags: [Auth]
   *     summary: Login with email and password
   *     security: []
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { body } = loginSchema.parse({ body: req.body });
      const result = await authService.login(body, req.ip, req.headers['user-agent']);

      // Set refresh token as HttpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/auth/refresh',
      });

      sendSuccess(res, {
        user: result.user,
        accessToken: result.accessToken,
      }, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.refreshToken ?? req.body?.refreshToken;
      if (!token) {
        sendError(res, 'Refresh token required', 401);
        return;
      }
      const result = await authService.refreshToken(token);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/auth/refresh',
      });

      sendSuccess(res, { accessToken: result.accessToken }, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.refreshToken ?? req.body?.refreshToken;
      if (token) await authService.logout(token);
      res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
      sendSuccess(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.query as { token: string };
      if (!token) {
        sendError(res, 'Verification token required', 400);
        return;
      }
      const result = await authService.verifyEmail(token);
      sendSuccess(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { body } = forgotPasswordSchema.parse({ body: req.body });
      const result = await authService.forgotPassword(body);
      sendSuccess(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { body } = resetPasswordSchema.parse({ body: req.body });
      const result = await authService.resetPassword(body);
      sendSuccess(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { body } = changePasswordSchema.parse({ body: req.body });
      const result = await authService.changePassword(req.user!.id, body);
      sendSuccess(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getProfile(req.user!.id);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  async setup2FA(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.setup2FA(req.user!.id);
      sendSuccess(res, result, '2FA setup initiated. Scan the QR code with your authenticator app.');
    } catch (error) {
      next(error);
    }
  }

  async verify2FA(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.body;
      if (!code) {
        sendError(res, 'Verification code required', 400);
        return;
      }
      const result = await authService.verify2FA(req.user!.id, code);
      sendSuccess(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  async disable2FA(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.body;
      if (!code) {
        sendError(res, 'Verification code required', 400);
        return;
      }
      const result = await authService.disable2FA(req.user!.id, code);
      sendSuccess(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
