// Company Holiday Service - CRUD operations for company holidays
import prisma from '../lib/prismaClient';

// ============================================
// Get All Company Holidays
// ============================================
export const getCompanyHolidays = async () => {
  return prisma.companyHoliday.findMany({
    orderBy: { holidayDate: 'asc' }
  });
};

// ============================================
// Get Company Holiday by ID
// ============================================
export const getCompanyHolidayById = async (id: number) => {
  return prisma.companyHoliday.findUnique({
    where: { companyHolidayId: id }
  });
};

// ============================================
// Create Company Holiday
// ============================================
export const createCompanyHoliday = async (data: {
  holidayDate: Date;
  holidayName: string;
  isRecurringAnnually?: boolean;
}) => {
  return prisma.companyHoliday.create({
    data: {
      holidayDate: data.holidayDate,
      holidayName: data.holidayName,
      isRecurringAnnually: data.isRecurringAnnually ?? false
    }
  });
};

// ============================================
// Update Company Holiday
// ============================================
export const updateCompanyHoliday = async (
  id: number, 
  data: {
    holidayDate?: Date;
    holidayName?: string;
    isRecurringAnnually?: boolean;
  }
) => {
  return prisma.companyHoliday.update({
    where: { companyHolidayId: id },
    data
  });
};

// ============================================
// Delete Company Holiday
// ============================================
export const deleteCompanyHoliday = async (id: number) => {
  return prisma.companyHoliday.delete({
    where: { companyHolidayId: id }
  });
};

// ============================================
// Get Holidays by Year
// ============================================
export const getHolidaysByYear = async (year: number) => {
  const startDate = new Date(year, 0, 1); // January 1st
  const endDate = new Date(year, 11, 31); // December 31st

  return prisma.companyHoliday.findMany({
    where: {
      OR: [
        {
          // Non-recurring holidays in this year
          holidayDate: {
            gte: startDate,
            lte: endDate
          },
          isRecurringAnnually: false
        },
        {
          // All recurring holidays (will apply to any year)
          isRecurringAnnually: true
        }
      ]
    },
    orderBy: { holidayDate: 'asc' }
  });
};

// ============================================
// Check if Date is a Holiday
// ============================================
export const isHoliday = async (date: Date): Promise<boolean> => {
  const month = date.getMonth();
  const day = date.getDate();

  // Check for exact date match or recurring holiday on same month/day
  const holidays = await prisma.companyHoliday.findMany({
    where: {
      OR: [
        {
          // Exact date match (non-recurring)
          holidayDate: date,
          isRecurringAnnually: false
        },
        {
          // Recurring holiday - check month and day
          isRecurringAnnually: true
        }
      ]
    }
  });

  // For recurring holidays, check if month and day match
  return holidays.some(holiday => {
    if (!holiday.isRecurringAnnually) {
      return holiday.holidayDate.getTime() === date.getTime();
    }
    const holidayMonth = holiday.holidayDate.getMonth();
    const holidayDay = holiday.holidayDate.getDate();
    return holidayMonth === month && holidayDay === day;
  });
};
