import { useState, FormEvent } from 'react';
import {
  UtensilsCrossed,
  UserCheck,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  ChefHat,
  Sparkles,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { Profile } from '../types';
import { StaffAvatar, isFemaleStaff } from './StaffAvatar';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (profile: Profile) => void;
  availableStaff: Profile[];
}

export const DEFAULT_STAFF_PASSWORD = '88888888';

export default function LoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  availableStaff,
}: Props) {
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState(DEFAULT_STAFF_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [roleTab, setRoleTab] = useState<'staff' | 'manager'>('staff');

  if (!isOpen) return null;

  // Filter accounts for quick selection demo
  const filteredProfiles = availableStaff.filter((p) =>
    roleTab === 'manager' ? p.role === 'manager' : p.role === 'staff'
  );

  const handleQuickSelect = (profile: Profile) => {
    setEmployeeCode(profile.employee_code);
    setPassword(DEFAULT_STAFF_PASSWORD);
    setErrorMsg('');
  };

  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanCode = employeeCode.trim().toUpperCase();

    if (!cleanCode) {
      setErrorMsg('請輸入員工工號或管理員帳號（例如：thehuyth, S0013, A0828）。');
      return;
    }

    if (password !== DEFAULT_STAFF_PASSWORD) {
      setErrorMsg('密碼不正確。預設密碼為：88888888');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      // Match profile by employee_code first, fallback to matching name
      const matched = availableStaff.find(
        (p) =>
          p.employee_code.toUpperCase() === cleanCode ||
          p.full_name.toLowerCase().includes(employeeCode.toLowerCase().trim())
      );

      if (matched) {
        onLoginSuccess(matched);
        onClose();
      } else {
        setErrorMsg(`找不到工號為「${employeeCode}」的員工，請確認名單。`);
      }
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
        {/* Brand Header Banner */}
        <div className="relative bg-gradient-to-br from-gray-950 via-gray-900 to-amber-950 p-6 sm:p-7 text-white">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <UtensilsCrossed className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight">二館廚房排假系統</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  工號登入
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                使用員工工號登入系統，查看班表與提交休假申請
              </p>
            </div>
          </div>

          {/* Quick Role Switcher Tabs */}
          <div className="mt-4 flex rounded-xl bg-white/10 p-1 backdrop-blur-md border border-white/10 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setRoleTab('staff');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                roleTab === 'staff'
                  ? 'bg-white text-gray-900 shadow-md font-bold'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <ChefHat className="w-4 h-4 text-blue-600" />
              <span>廚房員工 ({availableStaff.filter((s) => s.role === 'staff').length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRoleTab('manager');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                roleTab === 'manager'
                  ? 'bg-white text-gray-900 shadow-md font-bold'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>主廚 / 管理者 ({availableStaff.filter((s) => s.role === 'manager').length})</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-7 space-y-5">
          {/* Quick login suggestion pills */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="font-semibold flex items-center gap-1.5 text-gray-700">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                快速選擇員工帳號：
              </span>
              <span className="text-[11px] text-gray-400">點擊自動帶入工號</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {filteredProfiles.map((p) => {
                const isSelected = employeeCode.toUpperCase() === p.employee_code.toUpperCase();
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleQuickSelect(p)}
                    className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 hover:border-emerald-400 hover:bg-emerald-50/40 cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500'
                        : 'border-gray-200 bg-gray-50/50'
                    }`}
                  >
                    <StaffAvatar profile={p} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-900 rounded">
                          {p.employee_code}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-gray-900 truncate mt-0.5">
                        {p.full_name}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate font-medium">
                        {p.role === 'manager'
                          ? '後廚主管'
                          : p.default_shift ? `預設班別: ${p.default_shift}` : '未設定班別'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actual Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Input Mã Nhân Viên */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 block">
                  員工工號 / 帳號
                </label>
                <span className="text-[11px] text-gray-400">管理員：thehuyth | 員工：S0013, A0828...</span>
              </div>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="輸入工號（如：thehuyth, S0013, A0828）"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-900 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:font-sans placeholder:font-normal placeholder:normal-case"
                />
              </div>
            </div>

            {/* Input Mật khẩu mặc định 88888888 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 block">
                  登入密碼
                </label>
                <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  預設密碼：<strong>88888888</strong>
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="88888888"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Help notification */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <KeyRound className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold">廚房系統登入規範：</div>
                <div className="text-[11px] text-amber-800">
                  同仁僅需輸入專屬<strong>員工工號</strong>及預設密碼 <code>88888888</code> 即可進入檢視班表及登記排休。無需電子郵件或職稱設定。
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>正在驗證員工身分...</span>
                </>
              ) : (
                <>
                  <span>登入系統</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Architecture note for Supabase */}
          <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-3 text-[11px] text-gray-600 space-y-1">
            <div className="flex items-center gap-1.5 text-gray-800 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Supabase 工號認證機制說明：</span>
            </div>
            <p className="text-gray-500 font-mono text-[10px] leading-relaxed">
              員工工號於 <code>profiles</code> 資料表為唯一鍵（<code>unique</code>）。登入時透過工號標識及預設通行密碼 88888888 快速完成身分切換與驗證。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
