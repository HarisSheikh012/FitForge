import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { config } from '../config';

const storage = multer.diskStorage({
  destination: (req: Request, _file, cb) => {
    const folder = (req.query.folder as string) ?? 'general';
    const uploadPath = path.join(process.cwd(), config.upload.dir, folder);
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedImageMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const allowedDocMimes = [
    ...allowedImageMimes,
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedDocMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and documents are allowed.'));
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter,
});

export const uploadSingle = (fieldName: string) => upload.single(fieldName);
export const uploadMultiple = (fieldName: string, maxCount = 10) =>
  upload.array(fieldName, maxCount);
export const uploadFields = (fields: { name: string; maxCount?: number }[]) =>
  upload.fields(fields);
