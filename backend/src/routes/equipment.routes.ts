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

// List equipment
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    if (!gymId) throw new AppError('Gym context required', 400);

    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const search = req.query.search as string | undefined;

    const where: Record<string, any> = { gymId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, equipment] = await Promise.all([
      prisma.equipment.count({ where }),
      prisma.equipment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          maintenanceRecords: {
            orderBy: { serviceDate: 'desc' },
            take: 3,
          },
        },
      }),
    ]);

    sendPaginated(res, equipment, buildPaginationMeta(total, page, limit));
  } catch (e) {
    next(e);
  }
});

// Create equipment
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    if (!gymId) throw new AppError('Gym context required', 400);

    const { name, category, brand, model, serialNumber, purchaseDate, purchasePrice, quantity, status, location, notes, warrantyExpiry } = req.body;

    const equipment = await prisma.equipment.create({
      data: {
        gymId,
        name,
        category,
        brand,
        model,
        serialNumber,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        quantity: quantity ? parseInt(quantity, 10) : 1,
        status: status ?? 'OPERATIONAL',
        location,
        notes,
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
      },
    });

    sendCreated(res, equipment, 'Equipment created successfully');
  } catch (e) {
    next(e);
  }
});

// Update equipment
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    const { id } = req.params;
    const { name, category, brand, model, serialNumber, purchaseDate, purchasePrice, quantity, status, location, notes, warrantyExpiry, lastServiceDate, nextServiceDate } = req.body;

    const equipment = await prisma.equipment.findFirst({
      where: { id, ...(gymId ? { gymId } : {}) },
    });
    if (!equipment) throw new AppError('Equipment not found', 404);

    const updated = await prisma.equipment.update({
      where: { id },
      data: {
        name,
        category,
        brand,
        model,
        serialNumber,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
        quantity: quantity ? parseInt(quantity, 10) : undefined,
        status,
        location,
        notes,
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : undefined,
        lastServiceDate: lastServiceDate ? new Date(lastServiceDate) : undefined,
        nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : undefined,
      },
    });

    sendSuccess(res, updated, 'Equipment updated successfully');
  } catch (e) {
    next(e);
  }
});

// Log equipment maintenance record
router.post('/:id/maintenance', async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    const { id } = req.params;
    const { type, description, cost, performedBy, serviceDate, nextServiceDate, notes } = req.body;

    const equipment = await prisma.equipment.findFirst({
      where: { id, ...(gymId ? { gymId } : {}) },
    });
    if (!equipment) throw new AppError('Equipment not found', 404);

    const record = await prisma.$transaction(async (tx) => {
      const rec = await tx.maintenanceRecord.create({
        data: {
          equipmentId: id,
          type,
          description,
          cost: cost ? parseFloat(cost) : null,
          performedBy,
          serviceDate: new Date(serviceDate),
          nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : null,
          notes,
        },
      });

      // Update parent equipment dates
      await tx.equipment.update({
        where: { id },
        data: {
          lastServiceDate: new Date(serviceDate),
          nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : null,
          status: type === 'REPAIR' ? 'OPERATIONAL' : undefined,
        },
      });

      return rec;
    });

    sendCreated(res, record, 'Maintenance record logged');
  } catch (e) {
    next(e);
  }
});

// Delete equipment
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    const { id } = req.params;

    const equipment = await prisma.equipment.findFirst({
      where: { id, ...(gymId ? { gymId } : {}) },
    });
    if (!equipment) throw new AppError('Equipment not found', 404);

    await prisma.equipment.delete({ where: { id } });
    sendSuccess(res, null, 'Equipment deleted successfully');
  } catch (e) {
    next(e);
  }
});

export default router;
