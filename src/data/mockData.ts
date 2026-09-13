import { Profile, LeaveRequest, KitchenShift, ALLOWED_SHIFT_CODES, ShiftAssignments } from '../types';
import { getDaysInMonth } from '../lib/dateUtils';

export { ALLOWED_SHIFT_CODES };

export const SHIFTS: { id: string; label: string; time: string; color: string }[] = [
  { id: '8', label: '8 班', time: '08:00 - 16:30', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  { id: '10/', label: '10/ 班 (兩頭班)', time: '10:00 - 14:00 & 17:00 - 21:00', color: 'bg-teal-50 text-teal-800 border-teal-300' },
  { id: '12/', label: '12/ 班 (兩頭班)', time: '12:00 - 16:00 & 18:00 - 22:00', color: 'bg-cyan-50 text-cyan-800 border-cyan-300' },
  { id: '12//', label: '12// 班 (直通班)', time: '12:00 - 21:00', color: 'bg-sky-50 text-sky-800 border-sky-300' },
  { id: '14', label: '14 班', time: '14:00 - 22:30', color: 'bg-blue-50 text-blue-800 border-blue-300' },
  { id: '15', label: '15 班', time: '15:00 - 23:30', color: 'bg-indigo-50 text-indigo-800 border-indigo-300' },
  { id: '16', label: '16 班', time: '16:00 - 00:30', color: 'bg-purple-50 text-purple-800 border-purple-300' },
  { id: '17', label: '17 班', time: '17:00 - 01:30', color: 'bg-amber-50 text-amber-800 border-amber-300' },
  { id: '14:00', label: '14:00 班', time: '14:00 - 22:30', color: 'bg-blue-50 text-blue-800 border-blue-300' },
  { id: '15:00', label: '15:00 班', time: '15:00 - 23:30', color: 'bg-indigo-50 text-indigo-800 border-indigo-300' },
  { id: '16:00', label: '16:00 班', time: '16:00 - 00:30', color: 'bg-purple-50 text-purple-800 border-purple-300' },
  { id: '17:00', label: '17:00 班', time: '17:00 - 01:30', color: 'bg-amber-50 text-amber-800 border-amber-300' },
];

export const ADMIN_PROFILE: Profile = {
  id: 'u-admin-thehuyth',
  employee_code: 'thehuyth',
  full_name: 'thehuyth',
  role: 'manager',
  gender: 'male',
  hire_date: '100',
  dept_code: '100',
  position: '主廚 / 系統管理員',
};

// 15位廚房排班人員：
// 3位前排：14:00
// 5位接續：15:00
// 4位接續：16:00
// 3位最後：17:00
export const INITIAL_STAFF_PROFILES: Profile[] = [
  // 3 位：14:00
  {
    id: 'u-A0828',
    employee_code: 'A0828',
    full_name: '蘇諭呈',
    role: 'staff',
    gender: 'male',
    dept_code: '111',
    default_shift: '14:00',
    hire_date: '111',
    position: '廚房人員',
  },
  {
    id: 'u-A1078',
    employee_code: 'A1078',
    full_name: '何氏玄',
    role: 'staff',
    gender: 'female',
    dept_code: '113',
    default_shift: '14:00',
    hire_date: '113',
    position: '廚房人員',
  },
  {
    id: 'u-A1073',
    employee_code: 'A1073',
    full_name: '沈緯崙',
    role: 'staff',
    gender: 'male',
    dept_code: '113',
    default_shift: '14:00',
    hire_date: '113',
    position: '廚房人員',
  },
  // 5 位：15:00
  {
    id: 'u-A0765',
    employee_code: 'A0765',
    full_name: '游超為',
    role: 'staff',
    gender: 'male',
    dept_code: '109',
    default_shift: '15:00',
    hire_date: '109',
    position: '廚房人員',
  },
  {
    id: 'u-S0013',
    employee_code: 'S0013',
    full_name: '林建安',
    role: 'staff',
    gender: 'male',
    dept_code: '107',
    default_shift: '15:00',
    hire_date: '107',
    position: '廚房人員',
  },
  {
    id: 'u-A1146',
    employee_code: 'A1146',
    full_name: '柯旭宇',
    role: 'staff',
    gender: 'male',
    dept_code: '114',
    default_shift: '15:00',
    hire_date: '114',
    position: '廚房人員',
  },
  {
    id: 'u-A0548',
    employee_code: 'A0548',
    full_name: '陳炳志',
    role: 'staff',
    gender: 'male',
    dept_code: '105',
    default_shift: '15:00',
    hire_date: '105',
    position: '廚房人員',
  },
  {
    id: 'u-A1241',
    employee_code: 'A1241',
    full_name: '黃秋莊',
    role: 'staff',
    gender: 'female',
    dept_code: '114',
    default_shift: '15:00',
    hire_date: '114',
    position: '廚房人員',
  },
  // 4 位：16:00
  {
    id: 'u-A0573',
    employee_code: 'A0573',
    full_name: '阮進英',
    role: 'staff',
    gender: 'male',
    dept_code: '107',
    default_shift: '16:00',
    hire_date: '107',
    position: '廚房人員',
  },
  {
    id: 'u-A0059',
    employee_code: 'A0059',
    full_name: '曾宏昌',
    role: 'staff',
    gender: 'male',
    dept_code: '101',
    default_shift: '16:00',
    hire_date: '101',
    position: '廚房人員',
  },
  {
    id: 'u-A1266',
    employee_code: 'A1266',
    full_name: '黃文凱',
    role: 'staff',
    gender: 'male',
    dept_code: '114',
    default_shift: '16:00',
    hire_date: '114',
    position: '廚房人員',
  },
  {
    id: 'u-A1221',
    employee_code: 'A1221',
    full_name: '王昱凱',
    role: 'staff',
    gender: 'male',
    dept_code: '114',
    default_shift: '16:00',
    hire_date: '114',
    position: '廚房人員',
  },
  // 3 位：17:00
  {
    id: 'u-A0933',
    employee_code: 'A0933',
    full_name: '桃文度',
    role: 'staff',
    gender: 'male',
    dept_code: '111',
    default_shift: '17:00',
    hire_date: '111',
    position: '廚房人員',
  },
  {
    id: 'u-A0976',
    employee_code: 'A0976',
    full_name: '吳祥彬',
    role: 'staff',
    gender: 'male',
    dept_code: '111',
    default_shift: '17:00',
    hire_date: '111',
    position: '廚房人員',
  },
  {
    id: 'u-A1077',
    employee_code: 'A1077',
    full_name: '劉世輝',
    role: 'staff',
    gender: 'male',
    dept_code: '113',
    default_shift: '17:00',
    hire_date: '113',
    position: '廚房人員',
  },
];

export const INITIAL_PROFILES: Profile[] = [
  ADMIN_PROFILE,
  ...INITIAL_STAFF_PROFILES,
];

export const getInitialLeaveRequests = (_year?: number, _month?: number): LeaveRequest[] => {
  return [];
};

// Pre-fill initial month schedule using each staff's designated shift
export const getInitialAssignedShifts = (year = 2026, month = 8): ShiftAssignments => {
  const days = getDaysInMonth(year, month);
  const result: ShiftAssignments = {};
  for (const staff of INITIAL_STAFF_PROFILES) {
    if (staff.default_shift) {
      for (const day of days) {
        result[`${staff.id}_${day.dateStr}`] = staff.default_shift;
      }
    }
  }
  return result;
};

