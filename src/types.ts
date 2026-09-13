export type UserRole = 'manager' | 'staff';

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export type KitchenShift = '14:00' | '15:00' | '16:00' | '17:00' | string;

export const ALLOWED_SHIFT_CODES = ['8', '10/', '12/', '12//', '14', '15', '16', '17'] as const;
export type AllowedShiftCode = (typeof ALLOWED_SHIFT_CODES)[number] | string;

export interface Profile {
  id: string;
  employee_code: string; // 員工工號：A0828, A1078, S0013...
  full_name: string;
  role: UserRole;
  default_shift?: KitchenShift;
  dept_code?: string; // 111, 113, 109, 107, 114, 105, 101...
  gender?: 'male' | 'female';
  hire_date?: string; // 副代碼或到職資訊
  avatar_url?: string;
  position?: string;
  email?: string;
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  request_date: string; // YYYY-MM-DD
  status: LeaveStatus;
  reason?: string;
  created_at?: string;
  user?: Profile; // Joined data
}

export type ShiftAssignments = Record<string, string>; // key: `${user_id}_${request_date}` -> '8' | '10/' | '12/' | '12//' | '14' | '15' | '16' | '17'

export interface DayShiftSummary {
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  dayNumber: number;
  isWeekend: boolean;
  totalScheduled: number;
  totalWorking: number;
  totalOnLeave: number;
  totalPending: number;
  shiftCounts: Record<string, number>;
}
