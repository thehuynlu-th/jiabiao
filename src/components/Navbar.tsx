import {
  UtensilsCrossed,
  Database,
  UserCheck,
  Calendar,
  ShieldCheck,
  User,
  PlusCircle,
  KeyRound,
  FileSpreadsheet,
  LogOut,
  Lock,
} from 'lucide-react';
import { Profile } from '../types';
import { StaffAvatar, isFemaleStaff } from './StaffAvatar';

interface Props {
  currentProfile: Profile;
  allProfiles: Profile[];
  onSelectProfile: (profile: Profile) => void;
  activeView: 'manager' | 'staff';
  setActiveView: (view: 'manager' | 'staff') => void;
  onOpenDoc: () => void;
  onOpenAddStaff: () => void;
  onOpenImportStaff: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  currentMonth: number;
  currentYear: number;
  onChangeMonth: (delta: number) => void;
  pendingCount: number;
}

export default function Navbar({
  currentProfile,
  allProfiles,
  onSelectProfile,
  activeView,
  setActiveView,
  onOpenDoc,
  onOpenAddStaff,
  onOpenImportStaff,
  onOpenLogin,
  onLogout,
  currentMonth,
  currentYear,
  onChangeMonth,
  pendingCount,
}: Props) {
  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月',
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-xs">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Month Navigator */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 tracking-tight text-base sm:text-lg">
                  二館廚房排假系統
                </span>
                <span className="hidden sm:inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                  Kitchen Roster
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden sm:block">
                月度排班矩陣與廚房同仁排休管理
              </p>
            </div>
          </div>

          {/* Month / Year Navigator */}
          <div className="flex items-center bg-gray-100/90 rounded-lg p-1 border border-gray-200 text-xs">
            <button
              onClick={() => onChangeMonth(-1)}
              className="px-2 py-1 rounded hover:bg-white text-gray-700 font-medium transition-colors"
              title="上個月"
            >
              ‹
            </button>
            <span className="px-3 py-1 font-semibold text-gray-800 min-w-[110px] text-center">
              {currentYear}年 {monthNames[currentMonth]}
            </span>
            <button
              onClick={() => onChangeMonth(1)}
              className="px-2 py-1 rounded hover:bg-white text-gray-700 font-medium transition-colors"
              title="下個月"
            >
              ›
            </button>
          </div>
        </div>

        {/* View Switcher Tabs (Strict RBAC) */}
        {currentProfile.role === 'manager' ? (
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-semibold">
            <button
              onClick={() => setActiveView('manager')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeView === 'manager'
                  ? 'bg-white text-gray-900 shadow-xs font-bold'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>管理主管視角</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveView('staff')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeView === 'staff'
                  ? 'bg-white text-gray-900 shadow-xs font-bold'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>員工排休視角</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-blue-50/90 border border-blue-200/80 text-blue-900 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>員工個人排休專屬視角</span>
            <span className="text-[10px] bg-blue-200/80 text-blue-900 px-2 py-0.5 rounded-md font-mono font-bold">
              {currentProfile.employee_code}
            </span>
          </div>
        )}

        {/* Role & Switcher + Actions */}
        <div className="flex items-center gap-2.5">
          {/* User Profile Pill */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200/90 rounded-xl px-2.5 py-1.5">
            <div className="flex items-center gap-2">
              <StaffAvatar profile={currentProfile} size="sm" />
              <div className="text-left">
                <div className="text-xs font-bold text-gray-900 leading-tight flex items-center gap-1">
                  <span>{currentProfile.full_name}</span>
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 bg-gray-200 text-gray-800 rounded">
                    {currentProfile.employee_code}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 font-medium">
                  {currentProfile.role === 'manager' ? (
                    <span className="text-emerald-700 font-semibold">● 主廚/管理者</span>
                  ) : (
                    <span className="text-blue-700 font-semibold">
                      ● 廚房同仁 {currentProfile.default_shift ? `• 班別 ${currentProfile.default_shift}` : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* If manager: allow previewing other staff; If staff: locked */}
            {currentProfile.role === 'manager' && (
              <select
                value={currentProfile.id}
                onChange={(e) => {
                  const found = allProfiles.find(p => p.id === e.target.value);
                  if (found) {
                    onSelectProfile(found);
                    if (found.role === 'manager') {
                      setActiveView('manager');
                    } else {
                      setActiveView('staff');
                    }
                  }
                }}
                className="bg-transparent border-0 text-xs font-semibold text-gray-700 focus:ring-0 cursor-pointer pl-1 pr-2 py-1"
                aria-label="切換測試同仁"
                title="主管切換視角同仁"
              >
                <optgroup label="主管／管理員">
                  {allProfiles.filter(p => p.role === 'manager').map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.employee_code}] {p.full_name} (管理員)
                    </option>
                  ))}
                </optgroup>
                <optgroup label="廚房同仁 (15 位)">
                  {allProfiles.filter(p => p.role === 'staff').map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.employee_code}] {p.full_name} {p.default_shift ? `• 班別 ${p.default_shift}` : ''}
                    </option>
                  ))}
                </optgroup>
              </select>
            )}
          </div>

          {/* Add & Import Staff Buttons (for Manager) */}
          {currentProfile.role === 'manager' && (
            <div className="hidden lg:flex items-center gap-1.5">
              <button
                onClick={onOpenImportStaff}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                title="匯入人員清單：工號、姓名、到職日、預設班別"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>匯入 Excel / CSV</span>
              </button>

              <button
                onClick={onOpenAddStaff}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-gray-600" />
                <span>新增員工</span>
              </button>
            </div>
          )}

          {/* Switch User Modal Button */}
          <button
            onClick={onOpenLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 border border-amber-300/60 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            title="切換其他員工帳號"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">切換身分</span>
            <span className="sm:hidden">切換</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            title="登出目前帳號，返回身分驗證登入門戶"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span>登出</span>
          </button>

          {/* Open Supabase SQL & Next.js Docs */}
          <button
            onClick={onOpenDoc}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Database className="w-4 h-4" />
            <span>SQL架構說明</span>
          </button>
        </div>
      </div>
    </header>
  );
}
