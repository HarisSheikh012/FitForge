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

// List invoices
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    if (!gymId) throw new AppError('Gym context required', 400);

    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const status = req.query.status as string | undefined;

    const where: Record<string, any> = { gymId };
    if (status) where.status = status;

    const [total, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          member: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
        },
      }),
    ]);

    sendPaginated(res, invoices, buildPaginationMeta(total, page, limit));
  } catch (e) {
    next(e);
  }
});

// Get invoice by ID
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    const { id } = req.params;

    const invoice = await prisma.invoice.findFirst({
      where: { id, ...(gymId ? { gymId } : {}) },
      include: {
        member: {
          include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } },
        },
        payments: true,
      },
    });
    if (!invoice) throw new AppError('Invoice not found', 404);

    sendSuccess(res, invoice);
  } catch (e) {
    next(e);
  }
});

export default router;
