import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes
router.post('/register', authRateLimiter, authController.register.bind(authController));
router.post('/login', authRateLimiter, authController.login.bind(authController));
router.post('/refresh', authController.refresh.bind(authController));
router.post('/logout', authController.logout.bind(authController));
router.get('/verify-email', authController.verifyEmail.bind(authController));
router.post('/forgot-password', authRateLimiter, authController.forgotPassword.bind(authController));
router.post('/reset-password', authController.resetPassword.bind(authController));

// Protected routes
router.use(authenticate);
router.get('/me', authController.getProfile.bind(authController));
router.put('/change-password', authController.changePassword.bind(authController));
router.post('/2fa/setup', authController.setup2FA.bind(authController));
router.post('/2fa/verify', authController.verify2FA.bind(authController));
router.post('/2fa/disable', authController.disable2FA.bind(authController));

export default router;
