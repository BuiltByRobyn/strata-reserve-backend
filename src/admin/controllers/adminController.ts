import { Context } from 'hono';

export const getAdminDashboard = async (c: Context) => {
  return c.json({
    message: 'Admin Dashboard',
    data: {
      totalClients: 42,
      totalReports: 128,
      pendingReviews: 7,
      recentActivity: [
        { id: 1, action: 'New client registered', timestamp: new Date().toISOString() },
        { id: 2, action: 'Report uploaded for Client XYZ', timestamp: new Date().toISOString() },
      ]
    }
  });
};

export const getAllClients = async (c: Context) => {
  return c.json({
    message: 'All Clients',
    clients: [
      { id: 1, companyName: 'ABC Strata', email: 'contact@abcstrata.com', status: 'active' },
      { id: 2, companyName: 'XYZ Properties', email: 'info@xyzproperties.com', status: 'active' },
    ]
  });
};

export const getAllReports = async (c: Context) => {
  return c.json({
    message: 'All Reports',
    reports: [
      { id: 1, clientId: 1, title: 'Q1 2025 Report', status: 'completed', uploadDate: new Date().toISOString() },
      { id: 2, clientId: 2, title: 'Annual Report 2024', status: 'pending', uploadDate: new Date().toISOString() },
    ]
  });
};
