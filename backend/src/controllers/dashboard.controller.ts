import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess } from '../utils/response';
import { prisma } from '../config/database';
import { getGymId } from '../middleware/rbac';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths, format } from 'date-fns';

export class DashboardController {
  async getStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const gymId = getGymId(req);
      const gymFilter = gymId ? { gymId } : {};

      const today = new Date();
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);

      const [
        totalMembers,
        activeMembers,
        todayCheckIns,
        expiringSoon,
        monthRevenue,
        totalRevenue,
        totalTrainers,
        totalClasses,
        recentPayments,
        attendanceByDay,
        revenueByMonth,
        membershipByStatus,
      ] = await Promise.all([
        // Total members
        prisma.member.count({ where: { ...gymFilter } }),

        // Active members
        prisma.member.count({ where: { ...gymFilter, membershipStatus: 'ACTIVE' } }),

        // Today's check-ins
        prisma.attendance.count({
          where: { ...gymFilter, checkIn: { gte: todayStart, lte: todayEnd } },
        }),

        // Memberships expiring in next 7 days
        prisma.subscription.count({
          where: {
            member: { ...gymFilter },
            status: 'ACTIVE',
            endDate: {
              gte: today,
              lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),

        // Current month revenue
        prisma.payment.aggregate({
          where: {
            ...gymFilter,
            status: 'COMPLETED',
            paidAt: { gte: monthStart, lte: monthEnd },
          },
          _sum: { amount: true },
        }),

        // Total revenue
        prisma.payment.aggregate({
          where: { ...gymFilter, status: 'COMPLETED' },
          _sum: { amount: true },
        }),

        // Total trainers
        prisma.trainer.count({ where: { ...gymFilter, isActive: true } }),

        // Total classes
        prisma.class.count({ where: { ...gymFilter, isActive: true } }),

        // Recent payments
        prisma.payment.findMany({
          where: { ...gymFilter, status: 'COMPLETED' },
          take: 10,
          orderBy: { paidAt: 'desc' },
          include: {
            member: {
              include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
            },
          },
        }),

        // Attendance last 7 days
        prisma.$queryRaw<{ date: string; count: bigint }[]>`
          SELECT DATE(check_in) as date, COUNT(*) as count
          FROM attendances
          WHERE ${gymId ? `gym_id = '${gymId}' AND` : ''}
            check_in >= ${new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)}
          GROUP BY DATE(check_in)
          ORDER BY date ASC
        `,

        // Revenue last 6 months
        prisma.$queryRaw<{ month: string; revenue: number }[]>`
          SELECT TO_CHAR(paid_at, 'Mon YYYY') as month, SUM(amount) as revenue
          FROM payments
          WHERE status = 'COMPLETED'
            ${gymId ? `AND gym_id = '${gymId}'` : ''}
            AND paid_at >= ${subMonths(today, 6)}
          GROUP BY TO_CHAR(paid_at, 'Mon YYYY'), DATE_TRUNC('month', paid_at)
          ORDER BY DATE_TRUNC('month', paid_at) ASC
        `,

        // Membership status breakdown
        prisma.member.groupBy({
          by: ['membershipStatus'],
          where: { ...gymFilter },
          _count: { id: true },
        }),
      ]);

      sendSuccess(res, {
        stats: {
          totalMembers,
          activeMembers,
          inactiveMembers: totalMembers - activeMembers,
          todayCheckIns,
          expiringSoon,
          monthRevenue: monthRevenue._sum.amount ?? 0,
          totalRevenue: totalRevenue._sum.amount ?? 0,
          totalTrainers,
          totalClasses,
        },
        recentPayments: recentPayments.map((p) => ({
          id: p.id,
          amount: p.amount,
          method: p.method,
          status: p.status,
          paidAt: p.paidAt,
          member: p.member ? {
            name: `${p.member.user.firstName} ${p.member.user.lastName}`,
            avatar: p.member.user.avatar,
          } : null,
        })),
        charts: {
          attendance: attendanceByDay.map((r) => ({
            date: r.date,
            count: Number(r.count),
          })),
          revenue: revenueByMonth.map((r) => ({
            month: r.month,
            revenue: Number(r.revenue),
          })),
          membershipStatus: membershipByStatus.map((s) => ({
            status: s.membershipStatus,
            count: s._count.id,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getUpcomingClasses(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const gymId = getGymId(req);
      const now = new Date();

      const schedules = await prisma.schedule.findMany({
        where: {
          class: { ...(gymId ? { gymId } : {}), isActive: true },
          startTime: { gte: now },
          status: 'SCHEDULED',
        },
        take: 5,
        orderBy: { startTime: 'asc' },
        include: {
          class: true,
          trainer: { include: { user: { select: { firstName: true, lastName: true, avatar: true } } } },
          _count: { select: { bookings: true } },
        },
      });

      sendSuccess(res, schedules);
    } catch (error) {
      next(error);
    }
  }

  async getAbsentMembers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const gymId = getGymId(req);
      const today = startOfDay(new Date());

      const absentMembers = await prisma.member.findMany({
        where: {
          ...(gymId ? { gymId } : {}),
          membershipStatus: 'ACTIVE',
          attendances: {
            none: {
              checkIn: { gte: today },
            },
          },
        },
        take: 10,
        include: {
          user: { select: { firstName: true, lastName: true, avatar: true, phone: true } },
        },
      });

      sendSuccess(res, absentMembers);
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
