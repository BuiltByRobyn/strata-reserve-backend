import { success, error, asyncHandler } from '../../shared/helpers/responseHelper';
import * as serviceRequestService from '../../shared/services/serviceRequestService';

export const getClientDashboard = asyncHandler(async (c) => {
  return success(c, {
    companyName: 'Sample Company',
    totalReports: 8,
    latestReport: {
      id: 1,
      title: 'Annual Depreciation Report 2024',
      uploadDate: new Date().toISOString(),
      status: 'completed'
    },
    upcomingDeadlines: [
      { task: 'Review Q2 Report', dueDate: '2025-06-30' }
    ]
  });
}, 'Failed to fetch client dashboard');

export const getClientReports = asyncHandler(async (c) => {
  return success(c, [
    { id: 1, title: 'Annual Report 2024', status: 'completed', uploadDate: new Date().toISOString() },
    { id: 2, title: 'Q4 2024 Report', status: 'completed', uploadDate: new Date().toISOString() },
    { id: 3, title: 'Q1 2025 Report', status: 'pending', uploadDate: new Date().toISOString() },
  ]);
}, 'Failed to fetch client reports');

export const getActiveServiceRequest = asyncHandler(async (c) => {
  const user = c.get('user');
  const serviceRequest = await serviceRequestService.getActiveByProfile(user.id);
  return success(c, serviceRequest);
}, 'Failed to fetch active service request');

export const submitDocumentsForReview = asyncHandler(async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'));

  const serviceRequest = await serviceRequestService.getActiveByProfile(user.id);
  if (!serviceRequest || serviceRequest.serviceRequestId !== id) {
    return error(c, 'Service request not found or access denied', 404);
  }

  const updated = await serviceRequestService.submitForReview(id);
  return success(c, updated);
}, 'Failed to submit documents for review');
