import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { sendError } from '../utils/response';
import { UserRole } from '@prisma/client';

type RoleOrRoles = UserRole | UserRole[];

export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    if (!roles.includes(req.user.role as UserRole)) {
      sendError(res, 'Insufficient permissions', 403);
      return;
    }
    next();
  };
};

export const requireSuperAdmin = requireRole(UserRole.SUPER_ADMIN);

export const requireGymOwner = requireRole(
  UserRole.SUPER_ADMIN,
  UserRole.GYM_OWNER,
);

export const requireStaffOrAbove = requireRole(
  UserRole.SUPER_ADMIN,
  UserRole.GYM_OWNER,
  UserRole.STAFF,
);

export const requireTrainerOrAbove = requireRole(
  UserRole.SUPER_ADMIN,
  UserRole.GYM_OWNER,
  UserRole.STAFF,
  UserRole.TRAINER,
);

// Middleware that ensures the authenticated user can only access their own gym's data
export const requireGymAccess = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    sendError(res, 'Authentication required', 401);
    return;
  }

  // Super admins can access any gym
  if (req.user.role === UserRole.SUPER_ADMIN) {
    next();
    return;
  }

  // For gym-scoped users, gymId must match
  const requestedGymId = req.params.gymId ?? req.body?.gymId ?? req.query?.gymId;

  if (requestedGymId && requestedGymId !== req.user.gymId) {
    sendError(res, 'Access denied to this gym', 403);
    return;
  }

  next();
};

// Inject gymId into request body/query for non-super-admins
export const injectGymId = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  if (req.user && req.user.role !== UserRole.SUPER_ADMIN && req.user.gymId) {
    // Override gymId to prevent privilege escalation
    (req as AuthRequest & { resolvedGymId: string }).resolvedGymId = req.user.gymId;
  }
  next();
};

export const getGymId = (req: AuthRequest): string | null => {
  if (req.user?.role === UserRole.SUPER_ADMIN) {
    return req.params.gymId ?? req.body?.gymId ?? req.query?.gymId ?? null;
  }
  return req.user?.gymId ?? null;
};
