import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireStaffOrAbove } from '../middleware/rbac';
import { prisma } from '../config/database';
import { getGymId } from '../middleware/rbac';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/error';
import { AuthRequest } from '../middleware/auth';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

const router = Router();
router.use(authenticate, requireStaffOrAbove);

// Revenue Report
router.get('/revenue', async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    if (!gymId) throw new AppError('Gym context required', 400);

    const today = new Date();
    const sixMonthsAgo = subMonths(today, 6);

    const payments = await prisma.payment.findMany({
      where: {
        gymId,
        status: 'COMPLETED',
        paidAt: { gte: sixMonthsAgo },
      },
      select: {
        amount: true,
        paidAt: true,
        method: true,
      },
    });

    sendSuccess(res, payments);
  } catch (e) {
    next(e);
  }
});

// Attendance Summary Report
router.get('/attendance', async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    if (!gymId) throw new AppError('Gym context required', 400);

    const attendances = await prisma.attendance.findMany({
      where: {
        gymId,
        checkIn: { gte: subMonths(new Date(), 1) },
      },
      select: {
        checkIn: true,
        checkOut: true,
        status: true,
        method: true,
      },
    });

    sendSuccess(res, attendances);
  } catch (e) {
    next(e);
  }
});

export default router;
