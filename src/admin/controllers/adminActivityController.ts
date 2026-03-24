import { success, error, asyncHandler } from '../../shared/helpers/responseHelper';
import { getRecentProfileActivities } from '../../shared/services/clientActivityService';

export const getProfileActivities = asyncHandler(async (c) => {
  const hoursParam = c.req.query('hours');
  if (!hoursParam) {
    return error(c, 'hours is required', 400);
  }
  const hours = parseInt(hoursParam, 10);
  if (isNaN(hours) || hours <= 0) {
    return error(c, 'hours must be a positive integer', 400);
  }
  const activities = await getRecentProfileActivities(hours);
  return success(c, activities);
}, 'Failed to fetch profile activities');
