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

// List membership plans for a gym
router.get('/plans', requireStaffOrAbove, async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    if (!gymId) throw new AppError('Gym context required', 400);

    const plans = await prisma.membershipPlan.findMany({
      where: { gymId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    sendSuccess(res, plans);
  } catch (e) {
    next(e);
  }
});

// Create membership plan
router.post('/plans', requireGymOwner, async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    if (!gymId) throw new AppError('Gym context required', 400);

    const { name, description, durationDays, price, discountPrice, maxFreeze, features, isFeatured, sortOrder } = req.body;

    const plan = await prisma.membershipPlan.create({
      data: {
        gymId,
        name,
        description,
        durationDays: parseInt(durationDays, 10),
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        maxFreeze: maxFreeze ? parseInt(maxFreeze, 10) : 0,
        features: features ?? [],
        isFeatured: !!isFeatured,
        sortOrder: sortOrder ? parseInt(sortOrder, 10) : 0,
      },
    });

    sendCreated(res, plan, 'Membership plan created');
  } catch (e) {
    next(e);
  }
});

// Update membership plan
router.put('/plans/:id', requireGymOwner, async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    const { id } = req.params;
    const { name, description, durationDays, price, discountPrice, maxFreeze, features, isFeatured, sortOrder, isActive } = req.body;

    const plan = await prisma.membershipPlan.findFirst({
      where: { id, ...(gymId ? { gymId } : {}) },
    });
    if (!plan) throw new AppError('Membership plan not found', 404);

    const updated = await prisma.membershipPlan.update({
      where: { id },
      data: {
        name,
        description,
        durationDays: durationDays !== undefined ? parseInt(durationDays, 10) : undefined,
        price: price !== undefined ? parseFloat(price) : undefined,
        discountPrice: discountPrice !== undefined ? (discountPrice ? parseFloat(discountPrice) : null) : undefined,
        maxFreeze: maxFreeze !== undefined ? parseInt(maxFreeze, 10) : undefined,
        features,
        isFeatured: isFeatured !== undefined ? !!isFeatured : undefined,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder, 10) : undefined,
        isActive: isActive !== undefined ? !!isActive : undefined,
      },
    });

    sendSuccess(res, updated, 'Membership plan updated');
  } catch (e) {
    next(e);
  }
});

// Delete plan
router.delete('/plans/:id', requireGymOwner, async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    const { id } = req.params;

    const plan = await prisma.membershipPlan.findFirst({
      where: { id, ...(gymId ? { gymId } : {}) },
    });
    if (!plan) throw new AppError('Membership plan not found', 404);

    // Instead of deleting, soft delete / deactivate if it has active subscriptions
    const subCount = await prisma.subscription.count({ where: { planId: id } });
    if (subCount > 0) {
      await prisma.membershipPlan.update({
        where: { id },
        data: { isActive: false },
      });
      sendSuccess(res, null, 'Plan deactivated (cannot delete as it is in use by members)');
      return;
    }

    await prisma.membershipPlan.delete({ where: { id } });
    sendSuccess(res, null, 'Membership plan deleted successfully');
  } catch (e) {
    next(e);
  }
});

// Subscribe a member to a plan
router.post('/subscribe', requireStaffOrAbove, async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    const { memberId, planId, couponCode, startDate = new Date(), customPrice } = req.body;

    const member = await prisma.member.findFirst({
      where: { id: memberId, ...(gymId ? { gymId } : {}) },
    });
    if (!member) throw new AppError('Member not found', 404);

    const plan = await prisma.membershipPlan.findFirst({
      where: { id: planId, ...(gymId ? { gymId } : {}) },
    });
    if (!plan) throw new AppError('Plan not found', 404);

    const start = new Date(startDate);
    const end = new Date(start.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    let price = customPrice ? parseFloat(customPrice) : (plan.discountPrice ?? plan.price);
    let discount = 0;
    let couponId = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: { code: couponCode, isActive: true, validFrom: { lte: new Date() }, validUntil: { gte: new Date() } },
      });
      if (coupon) {
        couponId = coupon.id;
        if (coupon.discountType === 'PERCENT') {
          discount = (price * coupon.discountValue) / 100;
        } else {
          discount = coupon.discountValue;
        }
        price = Math.max(0, price - discount);

        // Update coupon usage
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    const subscription = await prisma.$transaction(async (tx) => {
      // Deactivate other active subscriptions for this member
      await tx.subscription.updateMany({
        where: { memberId, status: 'ACTIVE' },
        data: { status: 'EXPIRED' },
      });

      // Create new subscription
      const sub = await tx.subscription.create({
        data: {
          memberId,
          planId,
          startDate: start,
          endDate: end,
          status: 'ACTIVE',
          price,
          discount,
          couponId,
        },
      });

      // Update member status
      await tx.member.update({
        where: { id: memberId },
        data: { membershipStatus: 'ACTIVE' },
      });

      // Generate invoice
      const invoiceCount = await tx.invoice.count({ where: { gymId: member.gymId } });
      const invoiceNo = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(5, '0')}`;

      await tx.invoice.create({
        data: {
          gymId: member.gymId,
          memberId,
          invoiceNo,
          amount: price + discount,
          discount,
          total: price,
          status: 'PAID',
          dueDate: new Date(),
          paidAt: new Date(),
          items: [
            {
              name: `Membership: ${plan.name}`,
              qty: 1,
              price: plan.price,
              total: price,
            },
          ],
        },
      });

      return sub;
    });

    sendSuccess(res, subscription, 'Subscription activated successfully');
  } catch (e) {
    next(e);
  }
});

export default router;
