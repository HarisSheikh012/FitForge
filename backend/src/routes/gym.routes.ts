import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireGymOwner, requireStaffOrAbove } from '../middleware/rbac';
import { prisma } from '../config/database';
import { getGymId } from '../middleware/rbac';
import { sendSuccess, sendCreated, parsePagination, buildPaginationMeta, sendPaginated } from '../utils/response';
import { AppError } from '../middleware/error';
import { AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/gyms - list all gyms (super admin)
router.get('/', requireGymOwner, async (req: AuthRequest, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const search = req.query.search as string | undefined;
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {};
    const [total, gyms] = await Promise.all([
      prisma.gym.count({ where }),
      prisma.gym.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { owner: { select: { firstName: true, lastName: true, email: true } }, _count: { select: { members: true, trainers: true, staff: true } } } }),
    ]);
    sendPaginated(res, gyms, buildPaginationMeta(total, page, limit));
  } catch (e) { next(e); }
});

// GET /api/gyms/:id - get gym by id
router.get('/:id', requireStaffOrAbove, async (req: AuthRequest, res, next) => {
  try {
    const gym = await prisma.gym.findUnique({
      where: { id: req.params.id },
      include: {
        owner: { select: { firstName: true, lastName: true, email: true } },
        branches: true,
        operatingHours: true,
        subscription: { include: { plan: true } },
        membershipPlans: { where: { isActive: true } },
        _count: { select: { members: true, trainers: true, staff: true, classes: true } },
      },
    });
    if (!gym) throw new AppError('Gym not found', 404);
    sendSuccess(res, gym);
  } catch (e) { next(e); }
});

// PUT /api/gyms/:id - update gym
router.put('/:id', requireGymOwner, async (req: AuthRequest, res, next) => {
  try {
    const { name, description, email, phone, address, city, state, country, zipCode, website, timezone, currency, taxRate } = req.body;
    const gym = await prisma.gym.update({
      where: { id: req.params.id },
      data: { name, description, email, phone, address, city, state, country, zipCode, website, timezone, currency, taxRate },
    });
    sendSuccess(res, gym, 'Gym updated successfully');
  } catch (e) { next(e); }
});

// PUT /api/gyms/:id/hours - update operating hours
router.put('/:id/hours', requireGymOwner, async (req: AuthRequest, res, next) => {
  try {
    const { hours } = req.body as { hours: Array<{ dayOfWeek: string; openTime: string; closeTime: string; isClosed: boolean }> };
    const results = await Promise.all(
      hours.map((h) =>
        prisma.operatingHour.upsert({
          where: { gymId_dayOfWeek: { gymId: req.params.id, dayOfWeek: h.dayOfWeek as any } },
          update: { openTime: h.openTime, closeTime: h.closeTime, isClosed: h.isClosed },
          create: { gymId: req.params.id, dayOfWeek: h.dayOfWeek as any, openTime: h.openTime, closeTime: h.closeTime, isClosed: h.isClosed },
        })
      )
    );
    sendSuccess(res, results, 'Operating hours updated');
  } catch (e) { next(e); }
});

export default router;
