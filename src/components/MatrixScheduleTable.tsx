import { useState, useMemo, ReactNode } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  Info,
  FileSpreadsheet,
  Trash2,
  Sparkles,
  Plus,
  Check,
  X,
  Wand2,
} from 'lucide-react';
import { Profile, LeaveRequest, LeaveStatus, ShiftAssignments, ALLOWED_SHIFT_CODES } from '../types';
import { getDaysInMonth, formatChineseDate } from '../lib/dateUtils';
import { StaffAvatar } from './StaffAvatar';

export const getShiftBadgeStyle = (code: string): string => {
  switch (code) {
    case '8':
      return 'bg-emerald-100 text-emerald-950 border-emerald-300 font-black';
    case '10/':
      return 'bg-teal-100 text-teal-950 border-teal-300 font-black';
    case '12/':
      return 'bg-cyan-100 text-cyan-950 border-cyan-300 font-black';
    case '12//':
      return 'bg-sky-100 text-sky-950 border-sky-300 font-black';
    case '14':
    case '14:00':
      return 'bg-blue-100 text-blue-950 border-blue-300 font-black';
    case '15':
    case '15:00':
      return 'bg-indigo-100 text-indigo-950 border-indigo-300 font-black';
    case '16':
    case '16:00':
      return 'bg-purple-100 text-purple-950 border-purple-300 font-black';
    case '17':
    case '17:00':
      return 'bg-amber-100 text-amber-950 border-amber-300 font-black';
    default:
      return 'bg-slate-100 text-slate-900 border-slate-300 font-bold';
  }
};

interface Props {
  year: number;
  month: number;
  staffList: Profile[];
  leaveRequests: LeaveRequest[];
  assignedShifts?: ShiftAssignments;
  onUpdateLeaveStatus?: (reqId: string, newStatus: LeaveStatus) => void;
  onCreateLeave?: (userId: string, date: string, status: LeaveStatus, reason: string) => void;
  onDeleteLeave?: (reqId: string) => void;
  onUpdateShift?: (userId: string, date: string, shiftCode: string | null) => void;
  onOpenImportStaff?: () => void;
  onOpenImportSchedule?: () => void;
  onOpenStaffShiftSettings?: () => void;
  onUpdateStaffDefaultShift?: (staffId: string, defaultShift: string | undefined) => void;
  onClearAllLeaves?: () => void;
  onClearAllShifts?: () => void;
  onAutoFillMonthDefault?: () => void;
}

export default function MatrixScheduleTable({
  year,
  month,
  staffList,
  leaveRequests,
  assignedShifts = {},
  onUpdateLeaveStatus,
  onCreateLeave,
  onDeleteLeave,
  onUpdateShift,
  onOpenImportStaff,
  onOpenImportSchedule,
  onOpenStaffShiftSettings,
  onUpdateStaffDefaultShift,
  onClearAllLeaves,
  onClearAllShifts,
  onAutoFillMonthDefault,
}: Props) {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [activeStaffPopoverId, setActiveStaffPopoverId] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<{
    staff: Profile;
    date: string;
    dayOfWeek: string;
    leave?: LeaveRequest;
    currentShift?: string;
  } | null>(null);

  const [customShiftInput, setCustomShiftInput] = useState('');

  // Computed days in month
  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);

  // Available default shifts in current staff list
  const availableShifts = useMemo(() => {
    const set = new Set<string>();
    for (const s of staffList) {
      if (s.default_shift) set.add(s.default_shift);
    }
    return Array.from(set).sort();
  }, [staffList]);

  // Leave map for quick lookup: `${userId}_${date}`
  const leaveMap = useMemo(() => {
    const map = new Map<string, LeaveRequest>();
    for (const req of leaveRequests) {
      map.set(`${req.user_id}_${req.request_date}`, req);
    }
    return map;
  }, [leaveRequests]);

  // Count leave requests per staff
  const staffLeaveCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const req of leaveRequests) {
      if (req.status === 'approved' || req.status === 'pending') {
        map.set(req.user_id, (map.get(req.user_id) || 0) + 1);
      }
    }
    return map;
  }, [leaveRequests]);

  // Count assigned shifts per staff
  const staffShiftCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const [key, shift] of Object.entries(assignedShifts)) {
      if (shift) {
        const staffId = key.split('_')[0];
        map.set(staffId, (map.get(staffId) || 0) + 1);
      }
    }
    return map;
  }, [assignedShifts]);

  // Filtered staff
  const filteredStaff = useMemo(() => {
    return staffList.filter((staff) => {
      const matchName =
        staff.full_name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        (staff.employee_code && staff.employee_code.toLowerCase().includes(searchKeyword.toLowerCase())) ||
        (staff.dept_code && staff.dept_code.toLowerCase().includes(searchKeyword.toLowerCase())) ||
        (staff.default_shift && staff.default_shift.toLowerCase().includes(searchKeyword.toLowerCase()));

      const hasLeave = (staffLeaveCounts.get(staff.id) || 0) > 0;

      if (!matchName) return false;
      if (selectedFilter === 'has_leave') return hasLeave;
      if (selectedFilter === 'has_shift') return !!staff.default_shift;
      if (selectedFilter === 'no_shift') return !staff.default_shift;
      if (selectedFilter.startsWith('shift_')) {
        const code = selectedFilter.replace('shift_', '');
        return staff.default_shift === code;
      }
      return true;
    });
  }, [staffList, searchKeyword, selectedFilter, staffLeaveCounts]);

  // Daily statistics: Total off requests, working shifts, and shift breakdowns
  const dailyStats = useMemo(() => {
    return days.map((day) => {
      let approvedCount = 0;
      let pendingCount = 0;
      let scheduledWorkingCount = 0;
      const shiftCounts: Record<string, number> = {};

      for (const staff of staffList) {
        const leave = leaveMap.get(`${staff.id}_${day.dateStr}`);
        const shift = assignedShifts[`${staff.id}_${day.dateStr}`];

        if (leave?.status === 'approved') {
          approvedCount++;
        } else if (leave?.status === 'pending') {
          pendingCount++;
        }

        if (shift) {
          scheduledWorkingCount++;
          shiftCounts[shift] = (shiftCounts[shift] || 0) + 1;
        }
      }

      const totalLeave = approvedCount + pendingCount;
      const available = staffList.length - approvedCount;

      return {
        dateStr: day.dateStr,
        dayNumber: day.dayNumber,
        dayOfWeek: day.dayOfWeek,
        isWeekend: day.isWeekend,
        approvedCount,
        pendingCount,
        totalLeave,
        available,
        scheduledWorkingCount,
        shiftCounts,
      };
    });
  }, [days, staffList, leaveMap, assignedShifts]);

  // Total shifts count in entire month
  const totalShiftsAssignedInMonth = useMemo(() => {
    let count = 0;
    for (const day of days) {
      for (const staff of staffList) {
        if (assignedShifts[`${staff.id}_${day.dateStr}`]) count++;
      }
    }
    return count;
  }, [days, staffList, assignedShifts]);

  // Handle cell shift assignment
  const handleAssignShift = (shiftCode: string | null) => {
    if (!selectedCell) return;
    const { staff, date, leave } = selectedCell;

    // Update the shift
    onUpdateShift?.(staff.id, date, shiftCode);

    // If there was a leave on this cell and we're assigning a working shift, clear/delete the leave
    if (shiftCode && leave && onDeleteLeave) {
      onDeleteLeave(leave.id);
    }

    setSelectedCell(null);
    setCustomShiftInput('');
  };

  // Handle marking cell as OFF (approved leave)
  const handleMarkAsOff = () => {
    if (!selectedCell) return;
    const { staff, date, leave } = selectedCell;

    // Clear any assigned shift
    onUpdateShift?.(staff.id, date, null);

    if (leave) {
      onUpdateLeaveStatus?.(leave.id, 'approved');
    } else {
      onCreateLeave?.(staff.id, date, 'approved', '主廚設定排休 (OFF)');
    }

    setSelectedCell(null);
  };

  // Handle clearing cell (both shift and leave)
  const handleClearCell = () => {
    if (!selectedCell) return;
    const { staff, date, leave } = selectedCell;

    onUpdateShift?.(staff.id, date, null);
    if (leave && onDeleteLeave) {
      onDeleteLeave(leave.id);
    } else if (leave && onUpdateLeaveStatus) {
      onUpdateLeaveStatus(leave.id, 'rejected');
    }

    setSelectedCell(null);
  };

  return (
    <div className="space-y-4">
      {/* Table Controls / Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search staff */}
          <div className="relative min-w-[210px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜尋姓名、工號 (A0828, A1078...)..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Shift & Leave Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium cursor-pointer"
            >
              <option value="all">全體人員 ({staffList.length} 位)</option>
              <option value="has_leave">有排休申請 (OFF)</option>
              <option value="has_shift">已設定預設班別 ({staffList.filter((s) => !!s.default_shift).length})</option>
              <option value="no_shift">尚未設定班別 ({staffList.filter((s) => !s.default_shift).length})</option>
              {availableShifts.map((code) => {
                const count = staffList.filter((s) => s.default_shift === code).length;
                return (
                  <option key={code} value={`shift_${code}`}>
                    班別 {code} ({count} 位)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Staff Shift Settings Button */}
          {onOpenStaffShiftSettings && (
            <button
              type="button"
              onClick={onOpenStaffShiftSettings}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              title="設定與調整 15 位廚房人員之預設班次 (14:00, 15:00, 16:00, 17:00)"
            >
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>員工班別設定</span>
            </button>
          )}

          {/* Import Schedule from Excel Button */}
          {onOpenImportSchedule && (
            <button
              type="button"
              onClick={onOpenImportSchedule}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="由 Excel/CSV 匯入排班表或貼上資料"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>匯入 Excel 班表</span>
            </button>
          )}

          {/* Auto Fill Month Default Button */}
          {onAutoFillMonthDefault && (
            <button
              type="button"
              onClick={onAutoFillMonthDefault}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="自動將員工預設班次填入當月全月（已排休者保留 OFF）"
            >
              <Wand2 className="w-3.5 h-3.5 text-blue-600" />
              <span>自動填入預設班次</span>
            </button>
          )}

          {/* Clear Shifts Button */}
          {onClearAllShifts && totalShiftsAssignedInMonth > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`確定要清除當月已排之 ${totalShiftsAssignedInMonth} 個工作班次嗎？`)) {
                  onClearAllShifts();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="清除當月全體排班記錄"
            >
              <Trash2 className="w-3.5 h-3.5 text-amber-600" />
              <span>清除班次 ({totalShiftsAssignedInMonth})</span>
            </button>
          )}

          {/* Clear all leave requests button */}
          {onClearAllLeaves && leaveRequests.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('確定要清除所有排休（OFF）登記記錄嗎？')) {
                  onClearAllLeaves();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="清除全體排休紀錄"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>清除排休 ({leaveRequests.length})</span>
            </button>
          )}
        </div>

        {/* Legend for Allowed Shifts */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
          <span className="font-bold text-gray-700 text-[11px]">排班班別：</span>
          <div className="flex flex-wrap items-center gap-1">
            {ALLOWED_SHIFT_CODES.map((c) => (
              <span
                key={c}
                className={`font-mono text-[10px] px-1.5 py-0.2 rounded border shadow-2xs ${getShiftBadgeStyle(c)}`}
              >
                {c}
              </span>
            ))}
            <span className="font-mono text-[10px] font-black px-1.5 py-0.2 bg-rose-100 text-rose-950 border border-rose-300 rounded shadow-2xs">
              OFF
            </span>
          </div>

          <div className="flex items-center gap-1 pl-2 border-l border-gray-200">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">週六</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">週日</span>
          </div>
        </div>
      </div>

      {/* Main Matrix Table Wrapper with horizontal scroll */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto max-h-[750px] relative scrollbar-thin">
          <table className="w-full border-collapse text-left text-xs">
            {/* Header: Days in month */}
            <thead className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-xs border-b border-gray-200">
              <tr>
                {/* Fixed column: Staff information */}
                <th className="sticky left-0 z-30 bg-gray-100/95 backdrop-blur-xs p-3 min-w-[240px] max-w-[240px] font-bold text-gray-800 border-r border-gray-200 shadow-[2px_0_5px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-600" />
                      <span>人員名單 ({filteredStaff.length})</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-semibold">工號 • 預設班次</span>
                  </div>
                </th>

                {/* Day columns */}
                {days.map((day, idx) => {
                  const stat = dailyStats[idx];
                  const isSat = day.dayOfWeek === '六' || day.dayOfWeek === 'T7';
                  const isSun = day.dayOfWeek === '日' || day.dayOfWeek === 'CN';

                  // Header coloring for Sat and Sun
                  const thBg = isSun
                    ? 'bg-rose-100/90 text-rose-950 border-b-2 border-rose-400'
                    : isSat
                    ? 'bg-amber-100/90 text-amber-950 border-b-2 border-amber-400'
                    : 'text-gray-700';

                  const badgeBg = isSun
                    ? 'bg-rose-500 text-white font-black shadow-xs'
                    : isSat
                    ? 'bg-amber-500 text-white font-black shadow-xs'
                    : 'text-gray-800 font-bold';

                  return (
                    <th
                      key={day.dateStr}
                      className={`p-1.5 text-center min-w-[38px] max-w-[42px] border-r border-gray-200/80 select-none ${thBg}`}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${badgeBg}`}
                        >
                          {day.dayNumber}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold tracking-wider ${
                            isSun
                              ? 'text-rose-700'
                              : isSat
                              ? 'text-amber-800'
                              : 'text-gray-400'
                          }`}
                        >
                          {day.dayOfWeek}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Table Body: Staff Rows */}
            <tbody className="divide-y divide-gray-100">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td
                    colSpan={days.length + 1}
                    className="p-12 text-center text-gray-400 font-medium"
                  >
                    未找到符合條件的廚房同仁。
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const leavesCount = staffLeaveCounts.get(staff.id) || 0;
                  const shiftsCount = staffShiftCounts.get(staff.id) || 0;

                  return (
                    <tr
                      key={staff.id}
                      className="hover:bg-gray-50/80 transition-colors group"
                    >
                      {/* Fixed Left Column: Staff Info with Avatar, Code, and Default Shift underneath */}
                      <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50/90 p-2.5 border-r border-gray-200 shadow-[2px_0_5px_rgba(0,0,0,0.03)]">
                        <div className="flex items-center gap-2.5">
                          <StaffAvatar profile={staff} size="sm" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-gray-900 truncate text-xs">
                                {staff.full_name}
                              </span>
                              {staff.dept_code && (
                                <span className="font-mono text-[9px] text-gray-400">
                                  #{staff.dept_code}
                                </span>
                              )}
                            </div>
                            {/* Employee Code & Default Shift directly underneath */}
                            <div className="flex items-center justify-between gap-1 mt-1">
                              <div className="flex items-center gap-1.5 relative">
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded">
                                  {staff.employee_code}
                                </span>
                                {staff.default_shift ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveStaffPopoverId((prev) => (prev === staff.id ? null : staff.id));
                                    }}
                                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded border shadow-2xs hover:opacity-80 transition cursor-pointer ${getShiftBadgeStyle(
                                      staff.default_shift
                                    )}`}
                                    title="點擊變更此員工的預設班次"
                                  >
                                    班別 {staff.default_shift}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveStaffPopoverId((prev) => (prev === staff.id ? null : staff.id));
                                    }}
                                    className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-dashed border-amber-300 transition cursor-pointer"
                                    title="點擊為此員工指派預設班次"
                                  >
                                    + 設定班別
                                  </button>
                                )}

                                {/* Inline Shift Popover */}
                                {activeStaffPopoverId === staff.id && (
                                  <div
                                    className="absolute left-0 top-full mt-1.5 z-40 bg-white rounded-xl shadow-xl border border-gray-200 p-2.5 w-56 animate-in fade-in zoom-in-95 duration-100 text-left"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 mb-1.5">
                                      <span className="text-[11px] font-bold text-gray-800 truncate">
                                        設定班別：{staff.full_name}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setActiveStaffPopoverId(null)}
                                        className="text-gray-400 hover:text-gray-600 p-0.5"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    <div className="text-[10px] text-gray-500 mb-1 font-medium">選擇班別：</div>
                                    <div className="grid grid-cols-4 gap-1">
                                      {ALLOWED_SHIFT_CODES.map((code) => (
                                        <button
                                          key={code}
                                          type="button"
                                          onClick={() => {
                                            onUpdateStaffDefaultShift?.(staff.id, code);
                                            setActiveStaffPopoverId(null);
                                          }}
                                          className={`text-[11px] font-bold py-1 px-1 rounded border transition text-center cursor-pointer ${
                                            staff.default_shift === code
                                              ? 'ring-2 ring-emerald-500 font-black ' + getShiftBadgeStyle(code)
                                              : 'bg-gray-50 hover:bg-emerald-50 text-gray-700 border-gray-200'
                                          }`}
                                        >
                                          {code}
                                        </button>
                                      ))}
                                    </div>

                                    {staff.default_shift && (
                                      <div className="pt-1.5 border-t border-gray-100 mt-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            onUpdateStaffDefaultShift?.(staff.id, undefined);
                                            setActiveStaffPopoverId(null);
                                          }}
                                          className="w-full text-center text-[10px] text-red-600 hover:text-red-700 font-semibold py-0.5 hover:bg-red-50 rounded transition cursor-pointer"
                                        >
                                          清除預設班次
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-[9px]">
                                {shiftsCount > 0 && (
                                  <span className="font-bold text-emerald-700 bg-emerald-50 px-1 rounded">
                                    {shiftsCount} 班
                                  </span>
                                )}
                                {leavesCount > 0 && (
                                  <span className="font-bold text-rose-600 bg-rose-50 px-1 rounded">
                                    {leavesCount} OFF
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Day cells for this staff */}
                      {days.map((day) => {
                        const leave = leaveMap.get(`${staff.id}_${day.dateStr}`);
                        const assignedShift = assignedShifts[`${staff.id}_${day.dateStr}`];
                        const isSat = day.dayOfWeek === '六' || day.dayOfWeek === 'T7';
                        const isSun = day.dayOfWeek === '日' || day.dayOfWeek === 'CN';

                        // Base column tint for Sat and Sun
                        let cellBg = isSun
                          ? 'bg-rose-50/45 hover:bg-rose-100/60 border-r border-rose-200/60 cursor-pointer'
                          : isSat
                          ? 'bg-amber-50/45 hover:bg-amber-100/60 border-r border-amber-200/60 cursor-pointer'
                          : 'bg-white hover:bg-emerald-50/50 border-r border-gray-100 cursor-pointer';

                        let cellContent: ReactNode = null;

                        if (leave?.status === 'approved') {
                          cellBg = 'bg-rose-100 hover:bg-rose-200 text-rose-950 border-r border-rose-200 cursor-pointer';
                          cellContent = (
                            <span
                              className="text-[10px] font-black px-1.5 py-0.5 bg-rose-200/95 text-rose-950 rounded shadow-2xs border border-rose-300/80"
                              title={`排休 (OFF)：${leave.reason || '休假'}`}
                            >
                              OFF
                            </span>
                          );
                        } else if (leave?.status === 'pending') {
                          cellBg =
                            'bg-amber-100 hover:bg-amber-200 text-amber-950 border-r border-amber-200 cursor-pointer animate-pulse';
                          cellContent = (
                            <span
                              className="text-[9px] font-bold px-1 py-0.5 bg-amber-200 text-amber-950 rounded flex items-center gap-0.5 shadow-2xs"
                              title={`待核准請假：${leave.reason || '申請排休'}`}
                            >
                              <Clock className="w-2.5 h-2.5" /> 待審
                            </span>
                          );
                        } else if (assignedShift) {
                          // Display assigned shift (8, 10/, 12/, 12//, 14, 15, 16, 17, 14:00, 15:00...)
                          cellBg = isSun
                            ? 'bg-rose-50/60 hover:bg-rose-100 border-r border-rose-200/60 cursor-pointer'
                            : isSat
                            ? 'bg-amber-50/60 hover:bg-amber-100 border-r border-amber-200/60 cursor-pointer'
                            : 'bg-white hover:bg-blue-50/70 border-r border-gray-100 cursor-pointer';

                          cellContent = (
                            <span
                              className={`text-[10px] font-black px-1.5 py-0.5 rounded shadow-2xs border ${getShiftBadgeStyle(assignedShift)}`}
                              title={`工作班次：${assignedShift}`}
                            >
                              {assignedShift}
                            </span>
                          );
                        } else {
                          // Empty cell: faint hover indicator
                          cellContent = (
                            <span className="text-[10px] text-gray-300 group-hover/cell:text-gray-500 opacity-0 group-hover:opacity-60 transition-opacity">
                              +
                            </span>
                          );
                        }

                        return (
                          <td
                            key={day.dateStr}
                            onClick={() =>
                              setSelectedCell({
                                staff,
                                date: day.dateStr,
                                dayOfWeek: day.dayOfWeek,
                                leave,
                                currentShift: assignedShift,
                              })
                            }
                            className={`p-1 text-center transition-colors select-none group/cell ${cellBg}`}
                          >
                            <div className="flex items-center justify-center min-h-[34px]">
                              {cellContent}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Sticky Footer: Total Leave Requests & Available Staff */}
            <tfoot className="sticky bottom-0 z-20 bg-gray-100/95 backdrop-blur-md border-t-2 border-gray-300 shadow-[0_-3px_10px_rgba(0,0,0,0.05)]">
              {/* Row 1: 每日排休 (OFF) 人數 */}
              <tr className="border-b border-gray-200 font-bold">
                <td className="sticky left-0 z-30 bg-gray-200/95 backdrop-blur-xs p-2.5 border-r border-gray-300 text-xs text-gray-900 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-rose-950 font-bold">
                      <Clock className="w-4 h-4 text-rose-600" />
                      排休人數 (OFF)
                    </span>
                    <span className="text-[10px] text-gray-500">人/日</span>
                  </div>
                </td>
                {dailyStats.map((stat) => {
                  const isSat = stat.dayOfWeek === '六' || stat.dayOfWeek === 'T7';
                  const isSun = stat.dayOfWeek === '日' || stat.dayOfWeek === 'CN';
                  const hasLeave = stat.totalLeave > 0;

                  return (
                    <td
                      key={`leave-${stat.dateStr}`}
                      className={`p-1.5 text-center font-mono text-xs font-bold border-r ${
                        isSun
                          ? 'border-r-rose-200/80'
                          : isSat
                          ? 'border-r-amber-200/80'
                          : 'border-r-gray-200/80'
                      } ${
                        hasLeave
                          ? 'bg-rose-100 text-rose-900 font-black'
                          : isSun
                          ? 'bg-rose-50/40 text-gray-400'
                          : isSat
                          ? 'bg-amber-50/40 text-gray-400'
                          : 'text-gray-300'
                      }`}
                    >
                      {stat.totalLeave > 0 ? stat.totalLeave : '0'}
                    </td>
                  );
                })}
              </tr>

              {/* Row 2: 每日排班工作人數 */}
              <tr className="border-b border-gray-200 font-bold text-[11px]">
                <td className="sticky left-0 z-30 bg-gray-150/95 backdrop-blur-xs p-2.5 border-r border-gray-300 text-gray-900 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-blue-950 font-bold">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      出勤班次數
                    </span>
                    <span className="text-[10px] text-gray-500">班/日</span>
                  </div>
                </td>
                {dailyStats.map((stat) => {
                  const isSat = stat.dayOfWeek === '六' || stat.dayOfWeek === 'T7';
                  const isSun = stat.dayOfWeek === '日' || stat.dayOfWeek === 'CN';

                  return (
                    <td
                      key={`scheduled-${stat.dateStr}`}
                      className={`p-1.5 text-center font-mono font-bold text-xs border-r ${
                        stat.scheduledWorkingCount > 0
                          ? 'bg-blue-100/90 text-blue-950 font-black'
                          : isSun
                          ? 'border-r-rose-200/80 bg-rose-50/30 text-gray-400'
                          : isSat
                          ? 'border-r-amber-200/80 bg-amber-50/30 text-gray-400'
                          : 'border-r-gray-200/60 text-gray-300'
                      }`}
                    >
                      {stat.scheduledWorkingCount > 0 ? stat.scheduledWorkingCount : '0'}
                    </td>
                  );
                })}
              </tr>

              {/* Row 3: 可出勤在席人力 */}
              <tr className="font-bold text-[11px]">
                <td className="sticky left-0 z-30 bg-gray-100/95 backdrop-blur-xs p-2.5 border-r border-gray-300 text-gray-800 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-emerald-950 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      在席可動用人力
                    </span>
                    <span className="text-[10px] text-gray-500">人</span>
                  </div>
                </td>
                {dailyStats.map((stat) => {
                  const isSat = stat.dayOfWeek === '六' || stat.dayOfWeek === 'T7';
                  const isSun = stat.dayOfWeek === '日' || stat.dayOfWeek === 'CN';

                  return (
                    <td
                      key={`avail-${stat.dateStr}`}
                      className={`p-1.5 text-center font-mono font-bold text-xs border-r ${
                        isSun
                          ? 'border-r-rose-200/80 bg-rose-50/50 text-rose-950'
                          : isSat
                          ? 'border-r-amber-200/80 bg-amber-50/50 text-amber-950'
                          : 'border-r-gray-200/60 text-emerald-900 bg-emerald-50/40'
                      }`}
                    >
                      {stat.available}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer info & helper */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500 shrink-0" />
            <span>
              點擊表格中任意儲存格即可手動指派班別 (8, 10/, 12/, 14, 15, 16, 17) 或標記為排休 (OFF)。
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 font-medium">
            <span>標準班別：</span>
            <span className="font-bold text-gray-800">14:00 • 15:00 • 16:00 • 17:00</span>
          </div>
        </div>
      </div>

      {/* Interactive Modal on Cell Click: Choose Shift or OFF */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center gap-3">
                <StaffAvatar profile={selectedCell.staff} size="md" />
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">
                    {selectedCell.staff.full_name}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-500">
                    <span className="font-mono font-bold text-emerald-900 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300">
                      {selectedCell.staff.employee_code}
                    </span>
                    <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                      預設班別：{selectedCell.staff.default_shift || '14:00'}
                    </span>
                    {selectedCell.staff.dept_code && (
                      <span className="text-[11px] font-mono text-gray-500">
                        組別：{selectedCell.staff.dept_code}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5">
              {/* Selected Day Status */}
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-medium">所選日期：</span>
                  <span className="font-bold text-gray-900 text-sm">
                    週{selectedCell.dayOfWeek}, {formatChineseDate(selectedCell.date)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-medium">目前排程狀態：</span>
                  <div>
                    {selectedCell.leave?.status === 'approved' && (
                      <span className="font-black px-2.5 py-0.5 rounded-lg bg-rose-100 text-rose-900 border border-rose-300">
                        已排休 (OFF)
                      </span>
                    )}
                    {selectedCell.leave?.status === 'pending' && (
                      <span className="font-bold px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300">
                        待審核請假
                      </span>
                    )}
                    {!selectedCell.leave && selectedCell.currentShift && (
                      <span className={`font-black px-2.5 py-0.5 rounded-lg border ${getShiftBadgeStyle(selectedCell.currentShift)}`}>
                        排定班別：{selectedCell.currentShift}
                      </span>
                    )}
                    {!selectedCell.leave && !selectedCell.currentShift && (
                      <span className="text-gray-500 italic">空白（未排班）</span>
                    )}
                  </div>
                </div>
                {selectedCell.leave?.reason && (
                  <div className="pt-2 border-t border-gray-200 text-gray-600 italic">
                    請假原因：「{selectedCell.leave.reason}」
                  </div>
                )}
              </div>

              {/* SECTION 1: ALLOWED SHIFT CODES (1-Click) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    指派班別（常用廚房班次）：
                  </label>
                  <span className="text-[11px] text-gray-400">點選即可立即指派</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {ALLOWED_SHIFT_CODES.map((code) => {
                    const isSelected = selectedCell.currentShift === code;
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => handleAssignShift(code)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 hover:scale-102 shadow-2xs ${
                          isSelected
                            ? 'ring-2 ring-emerald-500 bg-emerald-50 font-black'
                            : 'hover:bg-gray-50'
                        } ${getShiftBadgeStyle(code)}`}
                      >
                        <span className="font-mono text-sm font-black">{code}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: QUICK ACTION - DEFAULT SHIFT */}
              {selectedCell.staff.default_shift ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedCell.staff.default_shift) {
                        handleAssignShift(selectedCell.staff.default_shift);
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-blue-600" />
                    <span>
                      套用預設班別（班別 {selectedCell.staff.default_shift}）
                    </span>
                  </button>
                </div>
              ) : (
                <div className="p-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-500 flex items-center justify-between">
                  <span>此員工尚未指派預設班別。</span>
                  {onOpenStaffShiftSettings && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCell(null);
                        onOpenStaffShiftSettings();
                      }}
                      className="text-blue-600 font-bold hover:underline ml-2"
                    >
                      立即設定
                    </button>
                  )}
                </div>
              )}

              {/* SECTION 3: CUSTOM SHIFT INPUT */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="或自訂輸入其他班次（例如：8, 10/, 12/...）"
                  value={customShiftInput}
                  onChange={(e) => setCustomShiftInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  disabled={!customShiftInput.trim()}
                  onClick={() => handleAssignShift(customShiftInput.trim())}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  套用
                </button>
              </div>

              {/* SECTION 4: MARK AS OFF OR CLEAR */}
              <div className="pt-2 border-t border-gray-100 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleMarkAsOff}
                    className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <span>標記為排休 (OFF)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearCell}
                    className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-gray-500" />
                    <span>清除班次／留白</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 text-right">
              <button
                type="button"
                onClick={() => setSelectedCell(null)}
                className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
