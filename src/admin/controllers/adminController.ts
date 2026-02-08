import { success } from '../../shared/helpers/responseHelper';
import { asyncHandler } from '../../shared/helpers/responseHelper';

export const getAdminDashboard = asyncHandler(async (c) => {
  return success(c, {
    totalClients: 42,
    totalReports: 128,
    pendingReviews: 7,
    recentActivity: [
      { id: 1, action: 'New client registered', timestamp: new Date().toISOString() },
      { id: 2, action: 'Report uploaded for Client XYZ', timestamp: new Date().toISOString() },
    ]
  });
}, 'Failed to fetch admin dashboard');

export const getAllClients = asyncHandler(async (c) => {
  return success(c, [
    { id: 1, companyName: 'ABC Strata', email: 'contact@abcstrata.com', status: 'active' },
    { id: 2, companyName: 'XYZ Properties', email: 'info@xyzproperties.com', status: 'active' },
  ]);
}, 'Failed to fetch clients');

export const getAllReports = asyncHandler(async (c) => {
  return success(c, [
    { id: 1, clientId: 1, title: 'Q1 2025 Report', status: 'completed', uploadDate: new Date().toISOString() },
    { id: 2, clientId: 2, title: 'Annual Report 2024', status: 'pending', uploadDate: new Date().toISOString() },
  ]);
}, 'Failed to fetch reports');
