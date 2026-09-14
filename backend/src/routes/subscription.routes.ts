import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireGymOwner } from '../middleware/rbac';
import { prisma } from '../config/database';
import { getGymId } from '../middleware/rbac';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/error';
import { AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireGymOwner);

// Get current SaaS subscription details for the gym
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    if (!gymId) throw new AppError('Gym context required', 400);

    const subscription = await prisma.gymSubscription.findUnique({
      where: { gymId },
      include: { plan: true },
    });

    sendSuccess(res, subscription);
  } catch (e) {
    next(e);
  }
});

// Mock Upgrade Plan / Stripe Checkout Session placeholder
router.post('/upgrade', async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    if (!gymId) throw new AppError('Gym context required', 400);

    const { planId } = req.body;

    const plan = await prisma.saasPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) throw new AppError('Plan not found', 404);

    // Perform mock subscription update (placeholder for Stripe Session creation)
    const subscription = await prisma.gymSubscription.upsert({
      where: { gymId },
      update: {
        planId,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
      },
      create: {
        gymId,
        planId,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    sendSuccess(res, subscription, `Upgraded to ${plan.name} successfully (Stripe Mock Sandbox)`);
  } catch (e) {
    next(e);
  }
});

export default router;
