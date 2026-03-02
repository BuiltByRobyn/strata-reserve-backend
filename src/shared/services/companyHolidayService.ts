import prisma from '../lib/prismaClient';

export const getCompanyHolidays = async () => {
  return prisma.companyHoliday.findMany({
    orderBy: { holidayDate: 'asc' }
  });
};

export const getCompanyHolidayById = async (id: number) => {
  return prisma.companyHoliday.findUnique({
    where: { companyHolidayId: id }
  });
};

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

export const deleteCompanyHoliday = async (id: number) => {
  return prisma.companyHoliday.delete({
    where: { companyHolidayId: id }
  });
};

export const getHolidaysByYear = async (year: number) => {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  const holidays = await prisma.companyHoliday.findMany({
    where: {
      OR: [
        {
          holidayDate: {
            gte: startDate,
            lte: endDate
          },
          isRecurringAnnually: false
        },
        {
          isRecurringAnnually: true
        }
      ]
    },
    orderBy: { holidayDate: 'asc' }
  });

  return holidays
    .map(holiday => {
      if (!holiday.isRecurringAnnually) return holiday;

      const originalDate = new Date(holiday.holidayDate);
      const month = originalDate.getMonth();
      const day = originalDate.getDate();

      // Skip Feb 29 holidays in non-leap years
      if (month === 1 && day === 29) {
        const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        if (!isLeapYear) return null;
      }

      return { ...holiday, holidayDate: new Date(year, month, day) };
    })
    .filter((h): h is NonNullable<typeof h> => h !== null);
};

export const isHoliday = async (date: Date): Promise<boolean> => {
  const month = date.getMonth();
  const day = date.getDate();

  const holidays = await prisma.companyHoliday.findMany({
    where: {
      OR: [
        {
          holidayDate: date,
          isRecurringAnnually: false
        },
        {
          isRecurringAnnually: true
        }
      ]
    }
  });

  return holidays.some(holiday => {
    if (!holiday.isRecurringAnnually) {
      return holiday.holidayDate.getTime() === date.getTime();
    }
    const holidayMonth = holiday.holidayDate.getMonth();
    const holidayDay = holiday.holidayDate.getDate();
    return holidayMonth === month && holidayDay === day;
  });
};
