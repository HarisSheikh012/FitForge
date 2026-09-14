import { Router } from 'express';
import { attendanceController } from '../controllers/attendance.controller';
import { authenticate } from '../middleware/auth';
import { requireStaffOrAbove } from '../middleware/rbac';

const router = Router();
router.use(authenticate);

router.get('/', requireStaffOrAbove, attendanceController.list.bind(attendanceController));
router.post('/check-in', attendanceController.checkIn.bind(attendanceController));
router.post('/check-out', attendanceController.checkOut.bind(attendanceController));
router.get('/today', requireStaffOrAbove, attendanceController.getToday.bind(attendanceController));

export default router;
