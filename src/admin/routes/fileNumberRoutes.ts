import { Hono } from 'hono';
import * as fileNumberController from '../controllers/fileNumberController';
import { updateFileNumberTimelines } from '../controllers/strataController';

export const fileNumberRoutes = new Hono();

fileNumberRoutes.get('/file-numbers', fileNumberController.getFileNumbers);
fileNumberRoutes.get('/file-numbers/active', fileNumberController.getActiveByStrata);
fileNumberRoutes.get('/file-numbers/detail', fileNumberController.getFileNumberById);
fileNumberRoutes.post('/file-numbers', fileNumberController.createFileNumber);
fileNumberRoutes.delete('/file-numbers', fileNumberController.deleteFileNumber);
fileNumberRoutes.put('/file-numbers/:id/offer-appointment', fileNumberController.offerAppointment);
fileNumberRoutes.put('/file-numbers/:fileNumberId/timelines', updateFileNumberTimelines);
