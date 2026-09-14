import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Get user's notifications
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    sendSuccess(res, notifications);
  } catch (e) {
    next(e);
  }
});

// Mark notification as read
router.patch('/:id/read', async (req: AuthRequest, res, next) => {
  try {
    const updated = await prisma.notification.update({
      where: { id: req.params.id, userId: req.user!.id },
      data: { status: 'READ', readAt: new Date() },
    });

    sendSuccess(res, updated, 'Notification marked as read');
  } catch (e) {
    next(e);
  }
});

export default router;
