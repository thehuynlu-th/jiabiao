import { useState, FormEvent } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import { Profile, KitchenShift, UserRole } from '../types';
import { SHIFTS } from '../data/mockData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddStaff: (newProfile: Omit<Profile, 'id'>) => void;
}

export default function AddStaffModal({ isOpen, onClose, onAddStaff }: Props) {
  const [employeeCode, setEmployeeCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [defaultShift, setDefaultShift] = useState<KitchenShift>('14:00');
  const [hireDate, setHireDate] = useState(() => new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    onAddStaff({
      employee_code: employeeCode.trim() || `NV-${Math.floor(100 + Math.random() * 900)}`,
      full_name: fullName.trim(),
      hire_date: hireDate,
      role,
      gender,
      default_shift: defaultShift,
      avatar_url: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?w=150&auto=format&fit=crop&q=80`,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-gray-900 text-sm">新增後廚員工</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="font-semibold text-gray-700 block mb-1">
                工號 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="A1001"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div className="col-span-2">
              <label className="font-semibold text-gray-700 block mb-1">
                員工姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="例如：張小明"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-gray-700 block mb-1">到職日期</label>
              <input
                type="date"
                value={hireDate}
                onChange={(e) => setHireDate(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">預設上班班別</label>
              <select
                value={defaultShift}
                onChange={(e) => setDefaultShift(e.target.value as KitchenShift)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {SHIFTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    班別 {s.id} ({s.time.split(' & ')[0]})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-gray-700 block mb-1">頭像配色</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
              >
                <option value="male">白色圖標藍色底 (預設)</option>
                <option value="female">白色圖標淺粉底 (女性成員)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">系統權限</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="staff">員工 (Staff)</option>
                <option value="manager">後廚主管 (Manager)</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-[11px] text-amber-900">
            <span className="font-bold">預設登入密碼：</span> <code>88888888</code>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
            >
              儲存員工資料
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
