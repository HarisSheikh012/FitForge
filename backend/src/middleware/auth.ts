import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, AccessTokenPayload } from '../utils/jwt';
import { sendError } from '../utils/response';
import { prisma } from '../config/database';

export interface AuthRequest extends Request {
  user?: AccessTokenPayload & { id: string };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, isActive: true, role: true, gymId: true },
    });

    if (!user || !user.isActive) {
      sendError(res, 'User not found or deactivated', 401);
      return;
    }

    req.user = {
      ...payload,
      id: user.id,
      role: user.role,
      gymId: user.gymId,
    };

    next();
  } catch (error) {
    sendError(res, 'Invalid or expired token', 401);
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = verifyAccessToken(token);
      req.user = { ...payload, id: payload.userId };
    }
  } catch {
    // Optional auth — ignore errors
  }
  next();
};
