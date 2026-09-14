import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { uploadSingle } from '../middleware/upload';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/error';

const router = Router();
router.use(authenticate);

// Single file upload endpoint (e.g. for user avatar, gym logo)
router.post('/', (req, res, next) => {
  uploadSingle('file')(req, res, (err) => {
    if (err) {
      return next(new AppError(err.message, 400));
    }
    if (!req.file) {
      return next(new AppError('No file uploaded', 400));
    }

    // Determine target relative URL for public serving
    const folder = (req.query.folder as string) ?? 'general';
    const fileUrl = `/uploads/${folder}/${req.file.filename}`;

    sendSuccess(res, { url: fileUrl }, 'File uploaded successfully');
  });
});

export default router;
