import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendCreated, parsePagination, buildPaginationMeta, sendPaginated } from '../utils/response';
import { prisma } from '../config/database';
import { getGymId } from '../middleware/rbac';
import { AppError } from '../middleware/error';
import bcrypt from 'bcryptjs';

export class AttendanceController {
  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const gymId = getGymId(req);
      if (!gymId) throw new AppError('Gym context required', 400);

      const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
      const date = req.query.date as string | undefined;
      const memberId = req.query.memberId as string | undefined;

      const where: Record<string, unknown> = { gymId };
      if (memberId) where.memberId = memberId;
      if (date) {
        const d = new Date(date);
        where.checkIn = {
          gte: new Date(d.setHours(0, 0, 0, 0)),
          lte: new Date(d.setHours(23, 59, 59, 999)),
        };
      }

      const [total, records] = await Promise.all([
        prisma.attendance.count({ where }),
        prisma.attendance.findMany({
          where,
          skip,
          take: limit,
          orderBy: { checkIn: 'desc' },
          include: {
            member: {
              include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
            },
          },
        }),
      ]);

      sendPaginated(res, records, buildPaginationMeta(total, page, limit));
    } catch (error) {
      next(error);
    }
  }

  async checkIn(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const gymId = getGymId(req);
      if (!gymId) throw new AppError('Gym context required', 400);

      const { memberId, method = 'MANUAL', qrData } = req.body;

      // Find member
      let member;
      if (qrData) {
        const parsed = JSON.parse(qrData);
        member = await prisma.member.findFirst({
          where: { memberId: parsed.memberId, gymId },
          include: { user: { select: { firstName: true, lastName: true } } },
        });
      } else {
        member = await prisma.member.findFirst({
          where: { id: memberId, gymId },
          include: { user: { select: { firstName: true, lastName: true } } },
        });
      }

      if (!member) throw new AppError('Member not found', 404);
      if (member.membershipStatus !== 'ACTIVE') {
        throw new AppError(`Member membership is ${member.membershipStatus.toLowerCase()}`, 400);
      }

      // Check if already checked in today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const existingCheckIn = await prisma.attendance.findFirst({
        where: {
          gymId,
          memberId: member.id,
          checkIn: { gte: today },
          status: 'CHECKED_IN',
        },
      });

      if (existingCheckIn) {
        throw new AppError('Member is already checked in', 409);
      }

      const attendance = await prisma.attendance.create({
        data: {
          gymId,
          memberId: member.id,
          checkIn: new Date(),
          method,
          status: 'CHECKED_IN',
        },
        include: {
          member: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
        },
      });

      sendCreated(res, attendance, `${member.user.firstName} checked in successfully`);
    } catch (error) {
      next(error);
    }
  }

  async checkOut(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const gymId = getGymId(req);
      if (!gymId) throw new AppError('Gym context required', 400);

      const { memberId } = req.body;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const attendance = await prisma.attendance.findFirst({
        where: {
          gymId,
          memberId,
          checkIn: { gte: today },
          status: 'CHECKED_IN',
          checkOut: null,
        },
      });

      if (!attendance) throw new AppError('No active check-in found for this member', 404);

      const updated = await prisma.attendance.update({
        where: { id: attendance.id },
        data: { checkOut: new Date(), status: 'CHECKED_OUT' },
      });

      sendSuccess(res, updated, 'Check-out recorded successfully');
    } catch (error) {
      next(error);
    }
  }

  async getToday(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const gymId = getGymId(req);
      if (!gymId) throw new AppError('Gym context required', 400);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const records = await prisma.attendance.findMany({
        where: { gymId, checkIn: { gte: today } },
        orderBy: { checkIn: 'desc' },
        include: {
          member: {
            include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
          },
        },
      });

      const stats = {
        totalCheckIns: records.length,
        currentlyIn: records.filter((r) => r.status === 'CHECKED_IN').length,
        checkedOut: records.filter((r) => r.status === 'CHECKED_OUT').length,
      };

      sendSuccess(res, { stats, records });
    } catch (error) {
      next(error);
    }
  }
}

export const attendanceController = new AttendanceController();
