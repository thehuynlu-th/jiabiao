import { Profile, LeaveRequest, KitchenShift, DayShiftSummary } from '../types';

export const CHINESE_DAYS = ['日', '一', '二', '三', '四', '五', '六'];
export const CHINESE_DAYS_FULL = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

export function getDaysInMonth(year: number, month: number) {
  // month: 0-indexed (0 = Jan, 8 = Sep)
  const date = new Date(year, month, 1);
  const days: { dateStr: string; dayNumber: number; dayOfWeek: string; isWeekend: boolean }[] = [];
  
  while (date.getMonth() === month) {
    const dayOfWeekIndex = date.getDay();
    const dayNumber = date.getDate();
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const dateStr = `${year}-${pad(month + 1)}-${pad(dayNumber)}`;
    
    days.push({
      dateStr,
      dayNumber,
      dayOfWeek: CHINESE_DAYS[dayOfWeekIndex],
      isWeekend: dayOfWeekIndex === 0 || dayOfWeekIndex === 6,
    });
    
    date.setDate(date.getDate() + 1);
  }
  
  return days;
}

export function computeDailyShiftSummaries(
  year: number,
  month: number,
  staffList: Profile[],
  leaveRequests: LeaveRequest[]
): DayShiftSummary[] {
  const days = getDaysInMonth(year, month);
  
  // Create quick lookup map: `${user_id}_${date}` -> LeaveRequest
  const leaveMap = new Map<string, LeaveRequest>();
  for (const req of leaveRequests) {
    leaveMap.set(`${req.user_id}_${req.request_date}`, req);
  }

  return days.map(day => {
    const shiftCounts: Record<KitchenShift, number> = {
      '8': 0,
      '10/': 0,
      '12/': 0,
      '12//': 0,
      '14': 0,
      '15': 0,
      '16': 0,
      '17': 0,
      '14:00': 0,
      '15:00': 0,
      '16:00': 0,
      '17:00': 0,
    };

    let totalWorking = 0;
    let totalOnLeave = 0;
    let totalPending = 0;

    for (const staff of staffList) {
      const leave = leaveMap.get(`${staff.id}_${day.dateStr}`);
      
      if (leave?.status === 'approved') {
        totalOnLeave++;
      } else {
        // Working (or pending approval)
        totalWorking++;
        if (leave?.status === 'pending') {
          totalPending++;
        }
        // Count into shift
        if (staff.default_shift && shiftCounts[staff.default_shift] !== undefined) {
          shiftCounts[staff.default_shift]++;
        }
      }
    }

    return {
      date: day.dateStr,
      dayOfWeek: day.dayOfWeek,
      dayNumber: day.dayNumber,
      isWeekend: day.isWeekend,
      totalScheduled: staffList.length,
      totalWorking,
      totalOnLeave,
      totalPending,
      shiftCounts,
    };
  });
}

export function formatChineseDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${y}年${parseInt(m, 10)}月${parseInt(d, 10)}日`;
}

// Retain alias for backward compatibility if any file calls formatVietnameseDate
export const formatVietnameseDate = formatChineseDate;
