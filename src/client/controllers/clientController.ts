import { success, asyncHandler } from '../../shared/helpers/responseHelper';

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
