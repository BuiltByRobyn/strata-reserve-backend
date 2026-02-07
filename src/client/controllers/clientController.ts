import { Context } from 'hono';

export const getClientDashboard = async (c: Context) => {
  return c.json({
    message: 'Client Dashboard',
    data: {
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
    }
  });
};

export const getClientReports = async (c: Context) => {
  return c.json({
    message: 'Client Reports',
    reports: [
      { id: 1, title: 'Annual Report 2024', status: 'completed', uploadDate: new Date().toISOString() },
      { id: 2, title: 'Q4 2024 Report', status: 'completed', uploadDate: new Date().toISOString() },
      { id: 3, title: 'Q1 2025 Report', status: 'pending', uploadDate: new Date().toISOString() },
    ]
  });
};
