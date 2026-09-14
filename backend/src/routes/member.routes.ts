import { Router } from 'express';
import { memberController } from '../controllers/member.controller';
import { authenticate } from '../middleware/auth';
import { requireStaffOrAbove } from '../middleware/rbac';

const router = Router();
router.use(authenticate, requireStaffOrAbove);

router.get('/', memberController.list.bind(memberController));
router.post('/', memberController.create.bind(memberController));
router.get('/:id', memberController.get.bind(memberController));
router.put('/:id', memberController.update.bind(memberController));
router.delete('/:id', memberController.delete.bind(memberController));
router.post('/:id/freeze', memberController.freezeMembership.bind(memberController));
router.get('/:id/qr-code', memberController.getQRCode.bind(memberController));

export default router;
