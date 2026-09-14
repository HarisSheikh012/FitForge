import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireStaffOrAbove } from '../middleware/rbac';
import { prisma } from '../config/database';
import { getGymId } from '../middleware/rbac';
import { sendSuccess, sendCreated, parsePagination, buildPaginationMeta, sendPaginated } from '../utils/response';
import { AppError } from '../middleware/error';
import { AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireStaffOrAbove);

// List payments
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    if (!gymId) throw new AppError('Gym context required', 400);

    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const status = req.query.status as string | undefined;

    const where: Record<string, any> = { gymId };
    if (status) where.status = status;

    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          member: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
          subscription: {
            include: { plan: { select: { name: true } } },
          },
        },
      }),
    ]);

    sendPaginated(res, payments, buildPaginationMeta(total, page, limit));
  } catch (e) {
    next(e);
  }
});

// Record a manual payment
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    if (!gymId) throw new AppError('Gym context required', 400);

    const { memberId, subscriptionId, invoiceId, amount, method, notes } = req.body;

    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          gymId,
          memberId,
          subscriptionId,
          invoiceId,
          amount: parseFloat(amount),
          method,
          status: 'COMPLETED',
          paidAt: new Date(),
          notes,
        },
      });

      if (invoiceId) {
        // Mark invoice as paid
        await tx.invoice.update({
          where: { id: invoiceId },
          data: { status: 'PAID', paidAt: new Date() },
        });
      }

      return p;
    });

    sendCreated(res, payment, 'Payment recorded successfully');
  } catch (e) {
    next(e);
  }
});

// Refund a payment
router.post('/:id/refund', async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    const { id } = req.params;
    const { reason, amount } = req.body;

    const payment = await prisma.payment.findFirst({
      where: { id, ...(gymId ? { gymId } : {}) },
    });
    if (!payment) throw new AppError('Payment not found', 404);
    if (payment.status === 'REFUNDED') throw new AppError('Payment already refunded', 400);

    const refundAmt = amount ? parseFloat(amount) : payment.amount;

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id },
        data: {
          status: 'REFUNDED',
          refundedAt: new Date(),
          refundAmount: refundAmt,
          refundReason: reason,
        },
      });

      if (payment.invoiceId) {
        await tx.invoice.update({
          where: { id: payment.invoiceId },
          data: { status: 'REFUNDED' },
        });
      }

      return p;
    });

    sendSuccess(res, updated, 'Refund processed successfully');
  } catch (e) {
    next(e);
  }
});

export default router;
