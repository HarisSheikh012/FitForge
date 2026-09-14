import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendCreated, parsePagination, buildPaginationMeta, sendPaginated } from '../utils/response';
import { prisma } from '../config/database';
import { getGymId } from '../middleware/rbac';
import { AppError } from '../middleware/error';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';

export class MemberController {
  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const gymId = getGymId(req);
      if (!gymId) throw new AppError('Gym context required', 400);

      const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const trainerId = req.query.trainerId as string | undefined;

      const where: Record<string, unknown> = { gymId };
      if (status) where.membershipStatus = status;
      if (trainerId) where.trainerId = trainerId;
      if (search) {
        where.OR = [
          { user: { firstName: { contains: search, mode: 'insensitive' } } },
          { user: { lastName: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
          { user: { phone: { contains: search, mode: 'insensitive' } } },
          { memberId: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [total, members] = await Promise.all([
        prisma.member.count({ where }),
        prisma.member.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true, avatar: true } },
            trainer: {
              include: { user: { select: { firstName: true, lastName: true } } },
            },
            subscriptions: {
              where: { status: 'ACTIVE' },
              take: 1,
              include: { plan: { select: { name: true, durationDays: true } } },
              orderBy: { createdAt: 'desc' },
            },
          },
        }),
      ]);

      sendPaginated(res, members, buildPaginationMeta(total, page, limit));
    } catch (error) {
      next(error);
    }
  }

  async get(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const gymId = getGymId(req);
      const { id } = req.params;

      const member = await prisma.member.findFirst({
        where: { id, ...(gymId ? { gymId } : {}) },
        include: {
          user: { select: { firstName: true, lastName: true, email: true, phone: true, avatar: true, isEmailVerified: true, lastLoginAt: true } },
          trainer: { include: { user: { select: { firstName: true, lastName: true, avatar: true } } } },
          branch: { select: { name: true } },
          subscriptions: {
            include: { plan: true },
            orderBy: { createdAt: 'desc' },
          },
          payments: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
          attendances: {
            take: 30,
            orderBy: { checkIn: 'desc' },
          },
          documents: true,
          bodyMeasurements: {
            orderBy: { measuredAt: 'desc' },
            take: 5,
          },
          goals: { orderBy: { createdAt: 'desc' } },
        },
      });

      if (!member) throw new AppError('Member not found', 404);
      sendSuccess(res, member);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const gymId = getGymId(req);
      if (!gymId) throw new AppError('Gym context required', 400);

      const {
        email, password, firstName, lastName, phone,
        dateOfBirth, gender, address, city, bloodGroup,
        emergencyName, emergencyPhone, emergencyRelation,
        medicalNotes, trainerId, branchId,
      } = req.body;

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) throw new AppError('Email already registered', 409);

      // Count members for unique ID
      const memberCount = await prisma.member.count({ where: { gymId } });
      const memberId = `GYM-${String(memberCount + 1).padStart(4, '0')}`;

      const hashedPassword = await bcrypt.hash(password ?? 'Member@123!', 12);

      // Generate QR code
      const qrData = JSON.stringify({ memberId, gymId, type: 'checkin' });
      const qrCode = await QRCode.toDataURL(qrData);

      const member = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            phone,
            role: 'MEMBER',
            gymId,
            isEmailVerified: false,
          },
        });

        return tx.member.create({
          data: {
            gymId,
            branchId,
            userId: user.id,
            memberId,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
            gender,
            address,
            city,
            bloodGroup,
            emergencyName,
            emergencyPhone,
            emergencyRelation,
            medicalNotes,
            trainerId,
            qrCode,
            barcode: uuidv4().replace(/-/g, '').substring(0, 13),
            membershipStatus: 'PENDING',
          },
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        });
      });

      sendCreated(res, member, 'Member created successfully');
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const gymId = getGymId(req);
      const { id } = req.params;

      const member = await prisma.member.findFirst({ where: { id, ...(gymId ? { gymId } : {}) } });
      if (!member) throw new AppError('Member not found', 404);

      const {
        firstName, lastName, phone, dateOfBirth, gender, address, city,
        bloodGroup, emergencyName, emergencyPhone, emergencyRelation,
        medicalNotes, trainerId, branchId, membershipStatus,
      } = req.body;

      const updated = await prisma.$transaction(async (tx) => {
        if (firstName || lastName || phone) {
          await tx.user.update({
            where: { id: member.userId },
            data: { firstName, lastName, phone },
          });
        }

        return tx.member.update({
          where: { id },
          data: {
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
            gender, address, city, bloodGroup,
            emergencyName, emergencyPhone, emergencyRelation,
            medicalNotes, trainerId, branchId, membershipStatus,
          },
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        });
      });

      sendSuccess(res, updated, 'Member updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const gymId = getGymId(req);
      const { id } = req.params;

      const member = await prisma.member.findFirst({ where: { id, ...(gymId ? { gymId } : {}) } });
      if (!member) throw new AppError('Member not found', 404);

      await prisma.user.delete({ where: { id: member.userId } });

      sendSuccess(res, null, 'Member deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async freezeMembership(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const gymId = getGymId(req);
      const { id } = req.params;
      const { freezeUntil } = req.body;

      const member = await prisma.member.findFirst({ where: { id, ...(gymId ? { gymId } : {}) } });
      if (!member) throw new AppError('Member not found', 404);

      const activeSubscription = await prisma.subscription.findFirst({
        where: { memberId: id, status: 'ACTIVE' },
        include: { plan: true },
      });

      if (!activeSubscription) throw new AppError('No active subscription to freeze', 400);

      const freezeEnd = new Date(freezeUntil);
      const freezeDays = Math.ceil((freezeEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

      await prisma.$transaction([
        prisma.member.update({
          where: { id },
          data: { membershipStatus: 'FROZEN' },
        }),
        prisma.subscription.update({
          where: { id: activeSubscription.id },
          data: {
            status: 'FROZEN',
            freezeStartDate: new Date(),
            freezeEndDate: freezeEnd,
            freezeDaysUsed: activeSubscription.freezeDaysUsed + freezeDays,
            // Extend end date by freeze duration
            endDate: new Date(activeSubscription.endDate.getTime() + freezeDays * 24 * 60 * 60 * 1000),
          },
        }),
      ]);

      sendSuccess(res, null, `Membership frozen until ${freezeEnd.toDateString()}`);
    } catch (error) {
      next(error);
    }
  }

  async getQRCode(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const gymId = getGymId(req);
      const { id } = req.params;

      const member = await prisma.member.findFirst({
        where: { id, ...(gymId ? { gymId } : {}) },
        select: { qrCode: true, memberId: true },
      });

      if (!member) throw new AppError('Member not found', 404);

      sendSuccess(res, { qrCode: member.qrCode, memberId: member.memberId });
    } catch (error) {
      next(error);
    }
  }
}

export const memberController = new MemberController();
