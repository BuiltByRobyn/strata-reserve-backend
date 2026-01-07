import { Hono } from 'hono';
import { UploadController } from '../controllers/uploadController';

export const uploadRoutes = new Hono();

uploadRoutes.post('/', UploadController.uploadFile);
