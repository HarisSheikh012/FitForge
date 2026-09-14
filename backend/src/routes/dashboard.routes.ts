import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';
import { requireStaffOrAbove } from '../middleware/rbac';

const router = Router();

router.use(authenticate, requireStaffOrAbove);

router.get('/stats', dashboardController.getStats.bind(dashboardController));
router.get('/upcoming-classes', dashboardController.getUpcomingClasses.bind(dashboardController));
router.get('/absent-members', dashboardController.getAbsentMembers.bind(dashboardController));

export default router;
