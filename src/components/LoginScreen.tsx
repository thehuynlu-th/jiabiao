import { useState, FormEvent } from 'react';
import {
  UtensilsCrossed,
  ShieldCheck,
  ChefHat,
  Sparkles,
  Lock,
  UserCheck,
  Eye,
  EyeOff,
  ArrowRight,
  KeyRound,
  AlertCircle,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { Profile } from '../types';
import { StaffAvatar } from './StaffAvatar';
import { DEFAULT_STAFF_PASSWORD } from './LoginModal';

interface Props {
  availableStaff: Profile[];
  onLoginSuccess: (profile: Profile) => void;
}

export default function LoginScreen({ availableStaff, onLoginSuccess }: Props) {
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState(DEFAULT_STAFF_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [roleTab, setRoleTab] = useState<'staff' | 'manager'>('staff');

  const managers = availableStaff.filter((p) => p.role === 'manager');
  const staffMembers = availableStaff.filter((p) => p.role === 'staff');
  const displayedProfiles = roleTab === 'manager' ? managers : staffMembers;

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
      setErrorMsg('請輸入員工工號或管理員帳號（如：thehuyth, S0013, A0828 等）。');
      return;
    }

    if (password !== DEFAULT_STAFF_PASSWORD) {
      setErrorMsg('密碼不正確。系統預設通行密碼為：88888888');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      const matched = availableStaff.find(
        (p) =>
          p.employee_code.toUpperCase() === cleanCode ||
          p.full_name.toLowerCase().includes(employeeCode.toLowerCase().trim())
      );

      if (matched) {
        onLoginSuccess(matched);
      } else {
        setErrorMsg(`找不到工號為「${employeeCode}」的員工資料，請確認後重試。`);
      }
    }, 450);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-amber-950 flex flex-col justify-center items-center p-4 sm:p-6 text-white font-sans selection:bg-amber-500 selection:text-black">
      {/* Brand Header */}
      <div className="w-full max-w-4xl text-center mb-6 sm:mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-amber-300 text-xs font-semibold shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>二館廚房排假系統 • 權限驗證登入門戶</span>
        </div>

        <div className="flex items-center justify-center gap-3.5">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-600 flex items-center justify-center shadow-xl shadow-amber-500/25 border border-white/20">
            <UtensilsCrossed className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm">
              二館廚房排假系統
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 font-medium mt-0.5">
              請先登入員工工號進行身分與權限驗證，系統將依據身分分流操作介面
            </p>
          </div>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-4xl bg-white text-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100/90 grid grid-cols-1 lg:grid-cols-12">
        {/* Left Column: Role & Permissions Explanation + Quick Accounts */}
        <div className="lg:col-span-6 bg-gray-50/90 p-6 sm:p-7 border-b lg:border-b-0 lg:border-r border-gray-200/80 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>身分權限說明 (RBAC)</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mt-1">
                選擇或點擊您的員工帳號
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                主廚登入享有排班調度全權限；員工登入可登記個人月度排休（OFF）。
              </p>
            </div>

            {/* Role Tabs */}
            <div className="flex rounded-xl bg-gray-200/80 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setRoleTab('staff');
                  setErrorMsg('');
                }}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  roleTab === 'staff'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ChefHat className="w-4 h-4 text-blue-600" />
                <span>廚房員工 ({staffMembers.length} 位)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRoleTab('manager');
                  setErrorMsg('');
                }}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  roleTab === 'manager'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>主廚管理者 ({managers.length} 位)</span>
              </button>
            </div>

            {/* Accounts Quick Selection Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="font-semibold text-gray-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  點選快速帶入工號：
                </span>
                <span className="text-[11px] text-gray-400">點擊卡片</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 max-h-64 sm:max-h-72 overflow-y-auto pr-1">
                {displayedProfiles.map((p) => {
                  const isSelected = employeeCode.toUpperCase() === p.employee_code.toUpperCase();
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleQuickSelect(p)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 hover:border-emerald-400 hover:bg-emerald-50/40 cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/30'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <StaffAvatar profile={p} size="sm" />
                      <div className="min-w-0 flex-1">
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
                            ? '後廚主廚 (主管權限)'
                            : p.default_shift
                            ? `班別 ${p.default_shift}`
                            : '排班人員'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Role Summary Card */}
          <div className="mt-4 pt-3 border-t border-gray-200 text-[11px] text-gray-600 space-y-1">
            <div className="font-semibold text-gray-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {roleTab === 'manager' ? '主廚管理者權限：' : '廚房員工權限：'}
              </span>
            </div>
            <p className="text-gray-500 leading-relaxed text-[11px]">
              {roleTab === 'manager'
                ? '檢視全體 15 位員工班表矩陣、調整預設班次、審核/駁回排休申請、一鍵自動排班與人數統計。'
                : '檢視個人當月排班、提交排休（OFF）申請、查看核准狀態，受權限保護無法竄改他人班表。'}
            </p>
          </div>
        </div>

        {/* Right Column: Interactive Login Form */}
        <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between">
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider">
                <KeyRound className="w-4 h-4" />
                <span>憑證輸入</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mt-1">輸入工號與通行密碼</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                請輸入您的廚房工號以完成權限校驗
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Employee Code Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 block">
                    員工工號 / 帳號
                  </label>
                  <span className="text-[11px] text-gray-400">
                    例如：thehuyth, A0828, S0013
                  </span>
                </div>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="請輸入工號（如：thehuyth, A0828, S0013）"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-900 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:font-sans placeholder:font-normal placeholder:normal-case"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 block">
                    登入密碼
                  </label>
                  <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    系統預設通行碼：<strong>88888888</strong>
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

              {/* Notice Box */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>二館廚房身分安全機制：</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  系統已將全體 15 位廚房夥伴預設排班（14:00、15:00、16:00、17:00）建立完畢。登入後可立即進行排休登記或主廚審核。
                </p>
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
                    <span>正在校驗身分與配置權限...</span>
                  </>
                ) : (
                  <>
                    <span>登入並進入系統</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center text-[11px] text-gray-400">
            二館廚房排假系統 • 支援 Next.js & Supabase RBAC 權限架構
          </div>
        </div>
      </div>
    </div>
  );
}
