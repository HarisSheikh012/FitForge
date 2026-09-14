import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireGymOwner, requireStaffOrAbove } from '../middleware/rbac';
import { prisma } from '../config/database';
import { getGymId } from '../middleware/rbac';
import { sendSuccess, sendCreated, parsePagination, buildPaginationMeta, sendPaginated } from '../utils/response';
import { AppError } from '../middleware/error';
import { AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const router = Router();
router.use(authenticate);

// List staff members
router.get('/', requireGymOwner, async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    if (!gymId) throw new AppError('Gym context required', 400);

    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const search = req.query.search as string | undefined;

    const where: Record<string, any> = { gymId };
    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { employeeId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, staff] = await Promise.all([
      prisma.staff.count({ where }),
      prisma.staff.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true, phone: true, avatar: true } },
          branch: { select: { name: true } },
          permissions: true,
        },
      }),
    ]);

    sendPaginated(res, staff, buildPaginationMeta(total, page, limit));
  } catch (e) {
    next(e);
  }
});

// Create staff member
router.post('/', requireGymOwner, async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    if (!gymId) throw new AppError('Gym context required', 400);

    const {
      email, password, firstName, lastName, phone,
      department, position, salary, branchId, permissions,
    } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new AppError('Email already registered', 409);

    const staffCount = await prisma.staff.count({ where: { gymId } });
    const employeeId = `STF-${String(staffCount + 1).padStart(3, '0')}`;

    const hashedPassword = await bcrypt.hash(password ?? 'Staff@123!', 12);

    const staff = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          role: 'STAFF',
          gymId,
          isEmailVerified: true,
        },
      });

      const staffProfile = await tx.staff.create({
        data: {
          gymId,
          branchId,
          userId: user.id,
          employeeId,
          department,
          position,
          salary: salary ? parseFloat(salary) : null,
        },
      });

      // Handle custom permissions if provided
      if (permissions && Array.isArray(permissions)) {
        await tx.staffPermission.createMany({
          data: permissions.map((p: any) => ({
            staffId: staffProfile.id,
            resource: p.resource,
            action: p.action,
            granted: p.granted !== undefined ? !!p.granted : true,
          })),
        });
      }

      return tx.staff.findUnique({
        where: { id: staffProfile.id },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          permissions: true,
        },
      });
    });

    sendCreated(res, staff, 'Staff member created successfully');
  } catch (e) {
    next(e);
  }
});

// Update staff member
router.put('/:id', requireGymOwner, async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    const { id } = req.params;
    const {
      firstName, lastName, phone, department, position,
      salary, branchId, isActive, permissions,
    } = req.body;

    const staff = await prisma.staff.findFirst({
      where: { id, ...(gymId ? { gymId } : {}) },
    });
    if (!staff) throw new AppError('Staff member not found', 404);

    const updated = await prisma.$transaction(async (tx) => {
      if (firstName || lastName || phone) {
        await tx.user.update({
          where: { id: staff.userId },
          data: { firstName, lastName, phone },
        });
      }

      const staffUpdated = await tx.staff.update({
        where: { id },
        data: {
          department,
          position,
          salary: salary !== undefined ? parseFloat(salary) : undefined,
          branchId,
          isActive: isActive !== undefined ? !!isActive : undefined,
        },
      });

      // Update permissions if supplied
      if (permissions && Array.isArray(permissions)) {
        // Delete all old permissions first
        await tx.staffPermission.deleteMany({
          where: { staffId: id },
        });

        // Insert new permissions
        await tx.staffPermission.createMany({
          data: permissions.map((p: any) => ({
            staffId: id,
            resource: p.resource,
            action: p.action,
            granted: !!p.granted,
          })),
        });
      }

      return tx.staff.findUnique({
        where: { id },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          permissions: true,
        },
      });
    });

    sendSuccess(res, updated, 'Staff member updated successfully');
  } catch (e) {
    next(e);
  }
});

// Delete staff
router.delete('/:id', requireGymOwner, async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    const { id } = req.params;

    const staff = await prisma.staff.findFirst({
      where: { id, ...(gymId ? { gymId } : {}) },
    });
    if (!staff) throw new AppError('Staff member not found', 404);

    await prisma.user.delete({ where: { id: staff.userId } });

    sendSuccess(res, null, 'Staff member deleted successfully');
  } catch (e) {
    next(e);
  }
});

export default router;
