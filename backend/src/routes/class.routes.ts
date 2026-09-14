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

// List classes
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    if (!gymId) throw new AppError('Gym context required', 400);

    const classes = await prisma.class.findMany({
      where: { gymId, isActive: true },
      include: {
        trainer: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        branch: { select: { name: true } },
      },
    });

    sendSuccess(res, classes);
  } catch (e) {
    next(e);
  }
});

// Create Class
router.post('/', requireStaffOrAbove, async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    if (!gymId) throw new AppError('Gym context required', 400);

    const { name, description, category, capacity, duration, level, trainerId, branchId } = req.body;

    const classObj = await prisma.class.create({
      data: {
        gymId,
        branchId,
        trainerId,
        name,
        description,
        category,
        capacity: parseInt(capacity ?? '20', 10),
        duration: parseInt(duration ?? '60', 10),
        level: level ?? 'ALL',
      },
    });

    sendCreated(res, classObj, 'Class created successfully');
  } catch (e) {
    next(e);
  }
});

// Update class
router.put('/:id', requireStaffOrAbove, async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    const { id } = req.params;
    const { name, description, category, capacity, duration, level, trainerId, branchId, isActive } = req.body;

    const classObj = await prisma.class.findFirst({
      where: { id, ...(gymId ? { gymId } : {}) },
    });
    if (!classObj) throw new AppError('Class not found', 404);

    const updated = await prisma.class.update({
      where: { id },
      data: {
        name,
        description,
        category,
        capacity: capacity ? parseInt(capacity, 10) : undefined,
        duration: duration ? parseInt(duration, 10) : undefined,
        level,
        trainerId,
        branchId,
        isActive: isActive !== undefined ? !!isActive : undefined,
      },
    });

    sendSuccess(res, updated, 'Class updated successfully');
  } catch (e) {
    next(e);
  }
});

// Delete class
router.delete('/:id', requireStaffOrAbove, async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    const { id } = req.params;

    const classObj = await prisma.class.findFirst({
      where: { id, ...(gymId ? { gymId } : {}) },
    });
    if (!classObj) throw new AppError('Class not found', 404);

    await prisma.class.update({
      where: { id },
      data: { isActive: false },
    });

    sendSuccess(res, null, 'Class archived successfully');
  } catch (e) {
    next(e);
  }
});

// List class schedules
router.get('/schedules', async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    if (!gymId) throw new AppError('Gym context required', 400);

    const schedules = await prisma.schedule.findMany({
      where: {
        class: { gymId, isActive: true },
      },
      include: {
        class: true,
        trainer: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        bookings: {
          include: {
            member: {
              include: { user: { select: { firstName: true, lastName: true } } },
            },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    sendSuccess(res, schedules);
  } catch (e) {
    next(e);
  }
});

// Create schedule slot
router.post('/schedules', requireStaffOrAbove, async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    const { classId, trainerId, startTime, endTime, notes } = req.body;

    const classObj = await prisma.class.findFirst({
      where: { id: classId, ...(gymId ? { gymId } : {}) },
    });
    if (!classObj) throw new AppError('Class not found', 404);

    const schedule = await prisma.schedule.create({
      data: {
        classId,
        trainerId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        notes,
      },
    });

    sendCreated(res, schedule, 'Class schedule slot added');
  } catch (e) {
    next(e);
  }
});

// Book a class schedule
router.post('/schedules/:id/book', async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    const { id } = req.params; // Schedule ID
    const memberId = req.body.memberId ?? req.user?.id; // If member calls, use auth, otherwise staff passes it

    // Get member profile id
    const memberObj = await prisma.member.findFirst({
      where: {
        OR: [
          { id: memberId },
          { userId: memberId },
        ],
        ...(gymId ? { gymId } : {}),
      },
    });
    if (!memberObj) throw new AppError('Member not found', 404);

    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: { class: true },
    });
    if (!schedule) throw new AppError('Schedule not found', 404);

    // Check capacity
    const currentBookings = await prisma.booking.count({
      where: { scheduleId: id, status: 'BOOKED' },
    });

    let status: 'BOOKED' | 'WAITING' = 'BOOKED';
    let waitlistPos = null;

    if (currentBookings >= schedule.class.capacity) {
      status = 'WAITING';
      const waitingCount = await prisma.booking.count({
        where: { scheduleId: id, status: 'WAITING' },
      });
      waitlistPos = waitingCount + 1;
    }

    const booking = await prisma.booking.create({
      data: {
        scheduleId: id,
        memberId: memberObj.id,
        status,
        waitlistPos,
      },
    });

    // Update booked/waitlisted counts
    await prisma.schedule.update({
      where: { id },
      data: {
        booked: status === 'BOOKED' ? { increment: 1 } : undefined,
        waitlisted: status === 'WAITING' ? { increment: 1 } : undefined,
      },
    });

    sendSuccess(
      res,
      booking,
      status === 'BOOKED' ? 'Class booked successfully' : 'Class full. Added to waiting list.'
    );
  } catch (e) {
    next(e);
  }
});

export default router;
