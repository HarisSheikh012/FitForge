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

// List trainers
router.get('/', requireStaffOrAbove, async (req: AuthRequest, res, next) => {
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

    const [total, trainers] = await Promise.all([
      prisma.trainer.count({ where }),
      prisma.trainer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true, phone: true, avatar: true } },
          branch: { select: { name: true } },
          _count: { select: { members: true, classes: true } },
        },
      }),
    ]);

    sendPaginated(res, trainers, buildPaginationMeta(total, page, limit));
  } catch (e) {
    next(e);
  }
});

// Get single trainer
router.get('/:id', requireStaffOrAbove, async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    const { id } = req.params;

    const trainer = await prisma.trainer.findFirst({
      where: { id, ...(gymId ? { gymId } : {}) },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true, avatar: true } },
        branch: { select: { name: true } },
        members: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true } },
          },
        },
        classes: true,
        schedules: {
          include: { class: true },
          take: 10,
          orderBy: { startTime: 'desc' },
        },
      },
    });

    if (!trainer) throw new AppError('Trainer not found', 404);
    sendSuccess(res, trainer);
  } catch (e) {
    next(e);
  }
});

// Create trainer
router.post('/', requireGymOwner, async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    if (!gymId) throw new AppError('Gym context required', 400);

    const {
      email, password, firstName, lastName, phone,
      specializations, certifications, experience, salary, bio, branchId,
    } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new AppError('Email already registered', 409);

    const trainerCount = await prisma.trainer.count({ where: { gymId } });
    const employeeId = `TRN-${String(trainerCount + 1).padStart(3, '0')}`;

    const hashedPassword = await bcrypt.hash(password ?? 'Trainer@123!', 12);

    const trainer = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          role: 'TRAINER',
          gymId,
          isEmailVerified: true, // Auto verified for staff/trainers
        },
      });

      return tx.trainer.create({
        data: {
          gymId,
          branchId,
          userId: user.id,
          employeeId,
          specializations: specializations ?? [],
          certifications: certifications ?? [],
          experience: parseInt(experience ?? '0', 10),
          salary: salary ? parseFloat(salary) : null,
          bio,
        },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      });
    });

    sendCreated(res, trainer, 'Trainer created successfully');
  } catch (e) {
    next(e);
  }
});

// Update trainer
router.put('/:id', requireGymOwner, async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    const { id } = req.params;
    const {
      firstName, lastName, phone, specializations, certifications,
      experience, salary, bio, branchId, isActive,
    } = req.body;

    const trainer = await prisma.trainer.findFirst({
      where: { id, ...(gymId ? { gymId } : {}) },
    });
    if (!trainer) throw new AppError('Trainer not found', 404);

    const updated = await prisma.$transaction(async (tx) => {
      if (firstName || lastName || phone) {
        await tx.user.update({
          where: { id: trainer.userId },
          data: { firstName, lastName, phone },
        });
      }

      return tx.trainer.update({
        where: { id },
        data: {
          specializations,
          certifications,
          experience: experience !== undefined ? parseInt(experience, 10) : undefined,
          salary: salary !== undefined ? parseFloat(salary) : undefined,
          bio,
          branchId,
          isActive: isActive !== undefined ? !!isActive : undefined,
        },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      });
    });

    sendSuccess(res, updated, 'Trainer updated successfully');
  } catch (e) {
    next(e);
  }
});

// Delete trainer
router.delete('/:id', requireGymOwner, async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    const { id } = req.params;

    const trainer = await prisma.trainer.findFirst({
      where: { id, ...(gymId ? { gymId } : {}) },
    });
    if (!trainer) throw new AppError('Trainer not found', 404);

    await prisma.user.delete({ where: { id: trainer.userId } });

    sendSuccess(res, null, 'Trainer deleted successfully');
  } catch (e) {
    next(e);
  }
});

export default router;
