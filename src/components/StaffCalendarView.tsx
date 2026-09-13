import { useState, useMemo, FormEvent, ReactNode } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  XCircle,
  PlusCircle,
  AlertCircle,
  Info,
  Trash2,
} from 'lucide-react';
import { Profile, LeaveRequest, LeaveStatus, ShiftAssignments } from '../types';
import { getDaysInMonth, formatChineseDate } from '../lib/dateUtils';
import { StaffAvatar } from './StaffAvatar';
import { getShiftBadgeStyle } from './MatrixScheduleTable';

interface Props {
  currentStaff: Profile;
  year: number;
  month: number;
  leaveRequests: LeaveRequest[];
  assignedShifts?: ShiftAssignments;
  onSubmitLeaveRequest: (date: string, reason: string) => void;
  onCancelRequest?: (id: string) => void;
}

export default function StaffCalendarView({
  currentStaff,
  year,
  month,
  leaveRequests,
  assignedShifts = {},
  onSubmitLeaveRequest,
  onCancelRequest,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Staff's leave requests
  const myRequests = useMemo(() => {
    return leaveRequests.filter((r) => r.user_id === currentStaff.id);
  }, [leaveRequests, currentStaff.id]);

  // Leave map for quick day lookup
  const myLeaveMap = useMemo(() => {
    const map = new Map<string, LeaveRequest>();
    for (const req of myRequests) {
      map.set(req.request_date, req);
    }
    return map;
  }, [myRequests]);

  // Days in month
  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);

  // First day offset for calendar grid layout
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon...

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
      setErrorMsg('請選擇欲申請排休的日期。');
      return;
    }

    if (myLeaveMap.has(selectedDate)) {
      setErrorMsg('您已在此日期提交過休假申請！');
      return;
    }

    onSubmitLeaveRequest(selectedDate, reason.trim() || '個人休假');
    setSelectedDate(null);
    setReason('');
    setErrorMsg('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Staff profile summary banner */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <StaffAvatar profile={currentStaff} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900">{currentStaff.full_name}</h2>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                {currentStaff.employee_code}
              </span>
              {currentStaff.default_shift ? (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold border bg-blue-50 text-blue-800 border-blue-200">
                  預設班別：{currentStaff.default_shift}
                </span>
              ) : (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium border bg-gray-50 text-gray-600 border-gray-200">
                  未設定班別
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              {currentStaff.dept_code && (
                <span>
                  組別：<strong className="text-gray-700">{currentStaff.dept_code}</strong>
                </span>
              )}
              {currentStaff.hire_date && !currentStaff.dept_code && (
                <span>
                  到職日：<strong className="text-gray-700">{currentStaff.hire_date}</strong>
                </span>
              )}
              <span>•</span>
              <span className="text-gray-700 font-medium">
                排休登記：{' '}
                <strong className="text-rose-600">
                  {myRequests.filter((r) => r.status === 'approved').length} 天已核准
                </strong>
                {myRequests.filter((r) => r.status === 'pending').length > 0 && (
                  <span className="text-amber-700">
                    ，{myRequests.filter((r) => r.status === 'pending').length} 天待審核
                  </span>
                )}
              </span>
            </p>
          </div>
        </div>

        {/* Legend pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 text-gray-700 border border-gray-200">
            <span className="w-2 h-2 rounded-full bg-gray-300"></span>
            <span>上班（出勤）</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>審核中</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
            <CheckCircle2 className="w-3 h-3 text-rose-600" />
            <span>已排休 (OFF)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View (2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-gray-900 text-sm">
                選擇 {year} 年 {month + 1} 月排休日期
              </h3>
            </div>
            <span className="text-xs text-gray-500">點選日期以登記排休</span>
          </div>

          {/* Calendar Table Grid */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Days of week header */}
            <div className="grid grid-cols-7 border-b border-gray-200 text-center text-xs font-bold py-2.5">
              <span className="text-rose-700 bg-rose-100/70 py-1">週日</span>
              <span className="text-gray-600 bg-gray-50 py-1">週一</span>
              <span className="text-gray-600 bg-gray-50 py-1">週二</span>
              <span className="text-gray-600 bg-gray-50 py-1">週三</span>
              <span className="text-gray-600 bg-gray-50 py-1">週四</span>
              <span className="text-gray-600 bg-gray-50 py-1">週五</span>
              <span className="text-amber-700 bg-amber-100/70 py-1">週六</span>
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {/* Offset blanks */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`blank-${i}`} className="bg-gray-50/60 min-h-[85px] p-2" />
              ))}

              {/* Real days */}
              {days.map((day) => {
                const leave = myLeaveMap.get(day.dateStr);
                const assignedShift = assignedShifts[`${currentStaff.id}_${day.dateStr}`];
                const isSelected = selectedDate === day.dateStr;
                const isSat = day.dayOfWeek === '六' || day.dayOfWeek === 'T7';
                const isSun = day.dayOfWeek === '日' || day.dayOfWeek === 'CN';

                let statusBadge: ReactNode = null;

                // Base day background with special weekend highlighting
                let dayBg = isSun
                  ? 'bg-rose-50/40 hover:bg-rose-100/50 cursor-pointer'
                  : isSat
                  ? 'bg-amber-50/40 hover:bg-amber-100/50 cursor-pointer'
                  : 'bg-white hover:bg-emerald-50/40 cursor-pointer';

                if (leave?.status === 'approved') {
                  dayBg = 'bg-rose-100/90 hover:bg-rose-200/80 border border-rose-300 cursor-pointer';
                  statusBadge = (
                    <span className="text-[10px] font-black text-rose-950 bg-rose-200/90 px-1.5 py-0.5 rounded flex items-center gap-1 shadow-2xs">
                      <CheckCircle2 className="w-2.5 h-2.5 text-rose-700" /> 排休 (OFF)
                    </span>
                  );
                } else if (leave?.status === 'pending') {
                  dayBg = 'bg-amber-100/90 hover:bg-amber-200/80 border border-amber-300 cursor-pointer animate-pulse';
                  statusBadge = (
                    <span className="text-[10px] font-bold text-amber-950 bg-amber-200 px-1.5 py-0.5 rounded flex items-center gap-1 shadow-2xs">
                      <Clock className="w-2.5 h-2.5 text-amber-700" /> 待審核
                    </span>
                  );
                } else if (leave?.status === 'rejected') {
                  dayBg = 'bg-gray-100 hover:bg-gray-200 cursor-pointer';
                  statusBadge = (
                    <span className="text-[10px] font-medium text-gray-500 bg-gray-200 px-1.5 py-0.2 rounded">
                      已婉拒
                    </span>
                  );
                } else if (assignedShift) {
                  statusBadge = (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded shadow-2xs border ${getShiftBadgeStyle(assignedShift)}`}>
                      班別 {assignedShift}
                    </span>
                  );
                }

                if (isSelected) {
                  dayBg = 'bg-emerald-100 ring-2 ring-emerald-600 ring-inset cursor-pointer';
                }

                return (
                  <div
                    key={day.dateStr}
                    onClick={() => {
                      setSelectedDate(day.dateStr);
                      setErrorMsg('');
                    }}
                    className={`min-h-[85px] p-2 flex flex-col justify-between transition-all ${dayBg}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                          isSelected
                            ? 'bg-emerald-600 text-white font-bold'
                            : isSun
                            ? 'bg-rose-500 text-white font-black'
                            : isSat
                            ? 'bg-amber-500 text-white font-black'
                            : 'text-gray-800'
                        }`}
                      >
                        {day.dayNumber}
                      </span>

                      {leave && (
                        <span
                          className={`w-2 h-2 rounded-full ${
                            leave.status === 'approved'
                              ? 'bg-rose-600'
                              : leave.status === 'pending'
                              ? 'bg-amber-600'
                              : 'bg-gray-400'
                          }`}
                        />
                      )}
                    </div>

                    <div className="mt-1 flex flex-col items-center">
                      {statusBadge || (
                        <span className="text-[10px] text-gray-400 font-medium">
                          班別 {currentStaff.default_shift || '14:00'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right side: Request Form & Request History */}
        <div className="space-y-5">
          {/* Create Request Form */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-xs space-y-4">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              登記排休日期
            </h3>

            {selectedDate ? (
              (() => {
                const existingLeave = myLeaveMap.get(selectedDate);
                if (existingLeave) {
                  return (
                    <div className="space-y-3">
                      <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-amber-900 font-semibold">已登記日期：</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              existingLeave.status === 'approved'
                                ? 'bg-rose-100 text-rose-800'
                                : existingLeave.status === 'pending'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {existingLeave.status === 'approved'
                              ? '已核准排休 (OFF)'
                              : existingLeave.status === 'pending'
                              ? '正在等待主廚審核'
                              : '已婉拒'}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-amber-950">
                          {formatChineseDate(selectedDate)}
                        </div>
                        <div className="text-gray-600 text-[11px]">
                          原因：「{existingLeave.reason || '個人休假'}」
                        </div>
                      </div>

                      {onCancelRequest && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onCancelRequest(existingLeave.id);
                              setSelectedDate(null);
                            }}
                            className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>取消此日排休申請</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedDate(null)}
                            className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold cursor-pointer"
                          >
                            關閉
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 text-xs">
                      <span className="text-emerald-900 font-semibold block">欲排休之日期：</span>
                      <span className="text-sm font-bold text-emerald-950">
                        {formatChineseDate(selectedDate)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-gray-700 block">
                          請假/休假原因 (選填)
                        </label>
                        <span className="text-[11px] text-gray-400">非必填</span>
                      </div>
                      <input
                        type="text"
                        placeholder="事假 / 家庭事務 / 個人排休..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    {errorMsg && (
                      <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errorMsg}
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>確認送出排休</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedDate(null)}
                        className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        取消
                      </button>
                    </div>
                  </form>
                );
              })()
            ) : (
              <div className="p-6 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-center space-y-2">
                <CalendarIcon className="w-8 h-8 text-gray-400 mx-auto" />
                <p className="text-xs text-gray-600 font-medium">
                  尚未選擇排休日期。
                </p>
                <p className="text-[11px] text-gray-400">
                  請直接點選左側日曆中任意日期以申請排休。
                </p>
              </div>
            )}
          </div>

          {/* History of Requests */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-xs space-y-3">
            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-gray-500">
              已申請排休記錄清單 ({myRequests.length})
            </h4>

            {myRequests.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2">目前尚無任何排休登記。</p>
            ) : (
              <div className="space-y-2">
                {myRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-xl border border-gray-200 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">
                        {formatChineseDate(req.request_date)}
                      </span>
                      {req.status === 'approved' && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                          已核准 (OFF)
                        </span>
                      )}
                      {req.status === 'pending' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> 審核中
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold">
                          已婉拒
                        </span>
                      )}
                    </div>

                    {req.reason && (
                      <p className="text-gray-600 text-[11px] italic">「{req.reason}」</p>
                    )}

                    {req.status === 'pending' && onCancelRequest && (
                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={() => onCancelRequest(req.id)}
                          className="text-[11px] text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          取消此日申請
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
