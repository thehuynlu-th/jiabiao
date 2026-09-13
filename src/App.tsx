import { useState, useMemo, useEffect } from 'react';
import {
  INITIAL_PROFILES,
  ADMIN_PROFILE,
  SHIFTS,
  getInitialAssignedShifts,
} from './data/mockData';
import { Profile, LeaveRequest, LeaveStatus, ShiftAssignments } from './types';
import Navbar from './components/Navbar';
import MatrixScheduleTable from './components/MatrixScheduleTable';
import PendingRequestsList from './components/PendingRequestsList';
import StaffCalendarView from './components/StaffCalendarView';
import SupabaseGuideModal from './components/SupabaseGuideModal';
import AddStaffModal from './components/AddStaffModal';
import ImportStaffModal from './components/ImportStaffModal';
import ImportScheduleModal from './components/ImportScheduleModal';
import StaffShiftSettingsModal from './components/StaffShiftSettingsModal';
import LoginModal from './components/LoginModal';
import { StaffAvatar, isFemaleStaff } from './components/StaffAvatar';
import { getDaysInMonth } from './lib/dateUtils';
import {
  Users,
  CalendarDays,
  Clock,
  CheckCircle2,
  FileCode2,
  Sparkles,
  AlertTriangle,
  KeyRound,
  UserCheck,
} from 'lucide-react';

export default function App() {
  const currentDate = new Date();
  const [year, setYear] = useState(() => currentDate.getFullYear());
  const [month, setMonth] = useState(() => currentDate.getMonth());

  const [profiles, setProfiles] = useState<Profile[]>(() => {
    try {
      localStorage.removeItem('kitchen_profiles_v5');
      localStorage.removeItem('kitchen_profiles_v6');
      localStorage.removeItem('kitchen_profiles_v7');
      const saved = localStorage.getItem('kitchen_profiles_v8');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PROFILES;
  });

  const [currentProfile, setCurrentProfile] = useState<Profile>(() => {
    try {
      localStorage.removeItem('kitchen_current_user_code_v5');
      localStorage.removeItem('kitchen_current_user_code_v6');
      localStorage.removeItem('kitchen_current_user_code_v7');
      const savedCode = localStorage.getItem('kitchen_current_user_code_v8');
      if (savedCode) {
        const found = profiles.find((p) => p.employee_code.toLowerCase() === savedCode.toLowerCase());
        if (found) return found;
      }
    } catch (e) {
      console.error(e);
    }
    return profiles.find((p) => p.role === 'manager') || ADMIN_PROFILE;
  });

  // Start with 0 leave requests so staff can cleanly register their days off
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    try {
      localStorage.removeItem('kitchen_leave_requests_v5');
      localStorage.removeItem('kitchen_leave_requests_v6');
      localStorage.removeItem('kitchen_leave_requests_v7');
      const saved = localStorage.getItem('kitchen_leave_requests_v8');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('kitchen_leave_requests_v8', JSON.stringify(leaveRequests));
    } catch (e) {
      console.error(e);
    }
  }, [leaveRequests]);

  useEffect(() => {
    try {
      localStorage.setItem('kitchen_profiles_v8', JSON.stringify(profiles));
    } catch (e) {
      console.error(e);
    }
  }, [profiles]);

  // Persistent assigned shifts state: key `${userId}_${date}` -> shiftCode ('8', '10/', '12/', '12//', '14', '15', '16', '17', '14:00'...)
  const [assignedShifts, setAssignedShifts] = useState<ShiftAssignments>(() => {
    try {
      localStorage.removeItem('kitchen_assigned_shifts_v5');
      localStorage.removeItem('kitchen_assigned_shifts_v6');
      localStorage.removeItem('kitchen_assigned_shifts_v7');
      const saved = localStorage.getItem('kitchen_assigned_shifts_v8');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    // Pre-populate with initial assigned shifts based on staff default shifts
    return getInitialAssignedShifts(currentDate.getFullYear(), currentDate.getMonth());
  });

  useEffect(() => {
    try {
      localStorage.setItem('kitchen_assigned_shifts_v8', JSON.stringify(assignedShifts));
    } catch (e) {
      console.error(e);
    }
  }, [assignedShifts]);

  const [activeView, setActiveView] = useState<'manager' | 'staff'>('manager');
  const [isDocOpen, setIsDocOpen] = useState(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isImportStaffOpen, setIsImportStaffOpen] = useState(false);
  const [isImportScheduleOpen, setIsImportScheduleOpen] = useState(false);
  const [isStaffShiftSettingsOpen, setIsStaffShiftSettingsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Filter 15 kitchen staff who take shifts (excluding admin thehuyth)
  const kitchenStaff = useMemo(
    () => profiles.filter((p) => p.role === 'staff'),
    [profiles]
  );

  // Clear all leave requests (Reset schedule to clean state)
  const handleClearAllLeaveRequests = () => {
    setLeaveRequests([]);
    try {
      localStorage.setItem('kitchen_leave_requests_v8', JSON.stringify([]));
    } catch (e) {
      console.error(e);
    }
  };

  // Shift assignment handlers
  const handleUpdateShift = (userId: string, date: string, shiftCode: string | null) => {
    setAssignedShifts((prev) => {
      const copy = { ...prev };
      const key = `${userId}_${date}`;
      if (shiftCode) {
        copy[key] = shiftCode;
      } else {
        delete copy[key];
      }
      return copy;
    });
  };

  const handleDeleteLeave = (reqId: string) => {
    setLeaveRequests((prev) => prev.filter((r) => r.id !== reqId));
  };

  const handleApplyImportedSchedule = (
    newShifts: ShiftAssignments,
    newLeaves: LeaveRequest[]
  ) => {
    setAssignedShifts((prev) => ({ ...prev, ...newShifts }));
    if (newLeaves.length > 0) {
      setLeaveRequests((prev) => {
        const map = new Map<string, LeaveRequest>();
        for (const req of prev) {
          map.set(`${req.user_id}_${req.request_date}`, req);
        }
        for (const req of newLeaves) {
          map.set(`${req.user_id}_${req.request_date}`, req);
        }
        return Array.from(map.values());
      });
    }
  };

  // Update single staff member's default shift
  const handleUpdateStaffDefaultShift = (staffId: string, defaultShift: string | undefined) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === staffId ? { ...p, default_shift: defaultShift } : p))
    );
  };

  // Batch save staff default shifts
  const handleSaveStaffShifts = (updates: Record<string, string | undefined>) => {
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id in updates) {
          return { ...p, default_shift: updates[p.id] };
        }
        return p;
      })
    );
  };

  const handleAutoFillMonthDefault = () => {
    const staffWithShift = kitchenStaff.filter((s) => !!s.default_shift);
    if (staffWithShift.length === 0) {
      alert(
        '尚未為員工設定預設班別！\n\n請點擊「員工班別設定」或點擊工號下方的「+ 設定班別」按鈕，為員工設定標準班次後再執行自動填入。'
      );
      setIsStaffShiftSettingsOpen(true);
      return;
    }

    const daysInMonth = getDaysInMonth(year, month);
    const newShifts: ShiftAssignments = {};
    for (const staff of staffWithShift) {
      const shiftCode = staff.default_shift!;
      for (const day of daysInMonth) {
        const isOff = leaveRequests.some(
          (l) => l.user_id === staff.id && l.request_date === day.dateStr && l.status === 'approved'
        );
        if (!isOff) {
          newShifts[`${staff.id}_${day.dateStr}`] = shiftCode;
        }
      }
    }
    setAssignedShifts((prev) => ({ ...prev, ...newShifts }));
  };

  const handleClearAllShifts = () => {
    const daysInMonth = getDaysInMonth(year, month);
    const dateSet = new Set(daysInMonth.map((d) => d.dateStr));
    setAssignedShifts((prev) => {
      const copy = { ...prev };
      for (const key of Object.keys(copy)) {
        const parts = key.split('_');
        const dateStr = parts[1];
        if (dateSet.has(dateStr)) {
          delete copy[key];
        }
      }
      return copy;
    });
  };

  // Change month navigator
  const handleChangeMonth = (delta: number) => {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    setMonth(newMonth);
    setYear(newYear);
  };

  // Pending requests count
  const pendingRequests = useMemo(() => {
    return leaveRequests.filter((r) => r.status === 'pending');
  }, [leaveRequests]);

  // Actions on Leave Requests
  const handleApprove = (id: string) => {
    setLeaveRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r))
    );
  };

  const handleReject = (id: string) => {
    setLeaveRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r))
    );
  };

  const handleApproveAll = () => {
    setLeaveRequests((prev) =>
      prev.map((r) => (r.status === 'pending' ? { ...r, status: 'approved' } : r))
    );
  };

  const handleUpdateLeaveStatus = (reqId: string, newStatus: LeaveStatus) => {
    setLeaveRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: newStatus } : r))
    );
  };

  const handleCreateLeave = (
    userId: string,
    date: string,
    status: LeaveStatus,
    reason: string
  ) => {
    const existing = leaveRequests.find((r) => r.user_id === userId && r.request_date === date);
    if (existing) {
      handleUpdateLeaveStatus(existing.id, status);
      return;
    }
    const newReq: LeaveRequest = {
      id: `req-${Date.now()}`,
      user_id: userId,
      request_date: date,
      status,
      reason,
      created_at: new Date().toISOString(),
    };
    setLeaveRequests((prev) => [...prev, newReq]);
  };

  const handleSubmitStaffRequest = (date: string, reason: string) => {
    const newReq: LeaveRequest = {
      id: `req-${Date.now()}`,
      user_id: currentProfile.id,
      request_date: date,
      status: 'pending',
      reason,
      created_at: new Date().toISOString(),
    };
    setLeaveRequests((prev) => [...prev, newReq]);
  };

  const handleCancelStaffRequest = (id: string) => {
    setLeaveRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddStaff = (newStaff: Omit<Profile, 'id'>) => {
    const id = `u-${Date.now()}`;
    setProfiles((prev) => [...prev, { ...newStaff, id }]);
  };

  const handleImportStaff = (importedProfiles: Omit<Profile, 'id'>[]) => {
    const timestamp = Date.now();
    const newProfilesWithId: Profile[] = importedProfiles.map((p, idx) => ({
      ...p,
      id: `u-${timestamp}-${idx + 1}`,
    }));
    setProfiles((prev) => [...prev, ...newProfilesWithId]);
  };

  return (
    <div className="min-h-screen bg-gray-50/70 text-gray-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        currentProfile={currentProfile}
        allProfiles={profiles}
        onSelectProfile={(p) => {
          setCurrentProfile(p);
          try {
            localStorage.setItem('kitchen_current_user_code_v8', p.employee_code);
          } catch (e) {
            console.error(e);
          }
        }}
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenDoc={() => setIsDocOpen(true)}
        onOpenAddStaff={() => setIsAddStaffOpen(true)}
        onOpenImportStaff={() => setIsImportStaffOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        currentMonth={month}
        currentYear={year}
        onChangeMonth={handleChangeMonth}
        pendingCount={pendingRequests.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Quick Guide / Architecture Hero Banner */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-emerald-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> 廚房排班與請假管理系統
              </span>
              <span className="text-xs text-gray-400">• 二館廚房排假運作</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              二館廚房排假系統
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              月度矩陣排班檢視、員工自主排休（OFF）登記、主廚審核與出勤人力即時自動統計。支援 14:00、15:00、16:00、17:00 等標準班別與兩頭班快速調度。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsLoginOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-gray-950" />
              <span>切換身分 / 登記排休</span>
            </button>
            <button
              onClick={() => setIsDocOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-900/30 cursor-pointer"
            >
              <FileCode2 className="w-4 h-4" />
              <span>系統資料庫架構說明</span>
            </button>
          </div>
        </div>

        {/* View Switch */}
        {activeView === 'manager' ? (
          <div className="space-y-6">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">{kitchenStaff.length}</div>
                  <div className="text-xs text-gray-500">廚房編制人員 (15 位)</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">{pendingRequests.length}</div>
                  <div className="text-xs text-gray-500">待主廚審核請假</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    {leaveRequests.filter((r) => r.status === 'approved').length}
                  </div>
                  <div className="text-xs text-gray-500">已核准請假天數</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    {Object.keys(assignedShifts).length} 班次已排
                  </div>
                  <div className="text-xs text-gray-500">班別：8, 10/, 12/, 14, 15, 16, 17</div>
                </div>
              </div>
            </div>

            {/* Pending Requests Review Component */}
            <PendingRequestsList
              requests={pendingRequests}
              profiles={profiles}
              onApprove={handleApprove}
              onReject={handleReject}
              onApproveAll={handleApproveAll}
            />

            {/* Matrix Schedule Table Component */}
            <MatrixScheduleTable
              year={year}
              month={month}
              staffList={kitchenStaff}
              leaveRequests={leaveRequests}
              assignedShifts={assignedShifts}
              onUpdateLeaveStatus={handleUpdateLeaveStatus}
              onCreateLeave={handleCreateLeave}
              onDeleteLeave={handleDeleteLeave}
              onUpdateShift={handleUpdateShift}
              onOpenImportStaff={() => setIsImportStaffOpen(true)}
              onOpenImportSchedule={() => setIsImportScheduleOpen(true)}
              onOpenStaffShiftSettings={() => setIsStaffShiftSettingsOpen(true)}
              onUpdateStaffDefaultShift={handleUpdateStaffDefaultShift}
              onClearAllLeaves={handleClearAllLeaveRequests}
              onClearAllShifts={handleClearAllShifts}
              onAutoFillMonthDefault={handleAutoFillMonthDefault}
            />
          </div>
        ) : (
          /* Staff Calendar View */
          <StaffCalendarView
            currentStaff={currentProfile}
            year={year}
            month={month}
            leaveRequests={leaveRequests}
            assignedShifts={assignedShifts}
            onSubmitLeaveRequest={handleSubmitStaffRequest}
            onCancelRequest={handleCancelStaffRequest}
          />
        )}
      </main>

      {/* Supabase SQL, Architecture & Code Documentation Modal */}
      <SupabaseGuideModal isOpen={isDocOpen} onClose={() => setIsDocOpen(false)} />

      {/* Add Staff Modal */}
      <AddStaffModal
        isOpen={isAddStaffOpen}
        onClose={() => setIsAddStaffOpen(false)}
        onAddStaff={handleAddStaff}
      />

      {/* Import Staff Modal (Excel / CSV / Bulk Paste / SQL) */}
      <ImportStaffModal
        isOpen={isImportStaffOpen}
        onClose={() => setIsImportStaffOpen(false)}
        onImportStaff={handleImportStaff}
        existingCount={profiles.length}
      />

      {/* Import Schedule Modal (Excel / CSV / Bulk Paste / Auto-fill) */}
      <ImportScheduleModal
        isOpen={isImportScheduleOpen}
        onClose={() => setIsImportScheduleOpen(false)}
        year={year}
        month={month}
        staffList={kitchenStaff}
        onApplySchedule={handleApplyImportedSchedule}
      />

      {/* Staff Shift Settings Modal (Setup Default Shifts 8, 10/, 12/, 14, 15, 16, 17) */}
      <StaffShiftSettingsModal
        isOpen={isStaffShiftSettingsOpen}
        onClose={() => setIsStaffShiftSettingsOpen(false)}
        staffList={kitchenStaff}
        onSaveStaffShifts={handleSaveStaffShifts}
      />

      {/* Login Modal for Staff and Manager */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        availableStaff={profiles}
        onLoginSuccess={(selected) => {
          setCurrentProfile(selected);
          try {
            localStorage.setItem('kitchen_current_user_code_v8', selected.employee_code);
          } catch (e) {
            console.error(e);
          }
          if (selected.role === 'manager') {
            setActiveView('manager');
          } else {
            setActiveView('staff');
          }
        }}
      />
    </div>
  );
}
