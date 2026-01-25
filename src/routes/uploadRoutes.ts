import { Hono } from 'hono';
import { UploadController } from '../controllers/uploadController';
import { authMiddleware } from '../middleware/auth';

export const uploadRoutes = new Hono();

uploadRoutes.post('/', authMiddleware, UploadController.uploadFile);
