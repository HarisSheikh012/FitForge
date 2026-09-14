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

// List branches for a gym
router.get('/', requireStaffOrAbove, async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    if (!gymId) throw new AppError('Gym context required', 400);

    const branches = await prisma.branch.findMany({
      where: { gymId, isActive: true },
      orderBy: { isMain: 'desc' },
      include: {
        _count: {
          select: {
            members: true,
            trainers: true,
            staff: true,
          },
        },
      },
    });

    sendSuccess(res, branches);
  } catch (e) {
    next(e);
  }
});

// Create a branch
router.post('/', requireGymOwner, async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    if (!gymId) throw new AppError('Gym context required', 400);

    const { name, address, city, phone, email, isMain } = req.body;

    const branch = await prisma.$transaction(async (tx) => {
      if (isMain) {
        // Reset existing main branches
        await tx.branch.updateMany({
          where: { gymId, isMain: true },
          data: { isMain: false },
        });
      }

      return tx.branch.create({
        data: {
          gymId,
          name,
          address,
          city,
          phone,
          email,
          isMain: !!isMain,
        },
      });
    });

    sendCreated(res, branch, 'Branch created successfully');
  } catch (e) {
    next(e);
  }
});

// Update a branch
router.put('/:id', requireGymOwner, async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    const { id } = req.params;
    const { name, address, city, phone, email, isMain, isActive } = req.body;

    const existingBranch = await prisma.branch.findFirst({
      where: { id, ...(gymId ? { gymId } : {}) },
    });
    if (!existingBranch) throw new AppError('Branch not found', 404);

    const updated = await prisma.$transaction(async (tx) => {
      if (isMain && !existingBranch.isMain) {
        // Reset existing main branches
        await tx.branch.updateMany({
          where: { gymId: existingBranch.gymId, isMain: true },
          data: { isMain: false },
        });
      }

      return tx.branch.update({
        where: { id },
        data: {
          name,
          address,
          city,
          phone,
          email,
          isMain: isMain !== undefined ? !!isMain : undefined,
          isActive: isActive !== undefined ? !!isActive : undefined,
        },
      });
    });

    sendSuccess(res, updated, 'Branch updated successfully');
  } catch (e) {
    next(e);
  }
});

// Delete a branch (soft delete or check children first)
router.delete('/:id', requireGymOwner, async (req: AuthRequest, res, next) => {
  try {
    const gymId = getGymId(req);
    const { id } = req.params;

    const existingBranch = await prisma.branch.findFirst({
      where: { id, ...(gymId ? { gymId } : {}) },
    });
    if (!existingBranch) throw new AppError('Branch not found', 404);

    // Check count of members
    const memberCount = await prisma.member.count({ where: { branchId: id } });
    if (memberCount > 0) {
      throw new AppError('Cannot delete branch with active members assigned', 400);
    }

    await prisma.branch.delete({ where: { id } });
    sendSuccess(res, null, 'Branch deleted successfully');
  } catch (e) {
    next(e);
  }
});

export default router;
