import React, { useState } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Sparkles,
  Trash2,
  Check,
} from 'lucide-react';
import { Profile, ALLOWED_SHIFT_CODES } from '../types';
import { SHIFTS } from '../data/mockData';
import { StaffAvatar } from './StaffAvatar';
import { getShiftBadgeStyle } from './MatrixScheduleTable';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  staffList: Profile[];
  onSaveStaffShifts: (updates: Record<string, string | undefined>) => void;
}

export default function StaffShiftSettingsModal({
  isOpen,
  onClose,
  staffList,
  onSaveStaffShifts,
}: Props) {
  // Local state for edits: staffId -> shiftCode
  const [shiftMap, setShiftMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const staff of staffList) {
      if (staff.default_shift) {
        map[staff.id] = staff.default_shift;
      }
    }
    return map;
  });

  // Batch assignment state
  const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(new Set());
  const [batchShift, setBatchShift] = useState<string>('14');

  if (!isOpen) return null;

  const handleToggleSelectStaff = (id: string) => {
    setSelectedStaffIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedStaffIds.size === staffList.length) {
      setSelectedStaffIds(new Set());
    } else {
      setSelectedStaffIds(new Set(staffList.map((s) => s.id)));
    }
  };

  const handleApplyBatch = () => {
    if (selectedStaffIds.size === 0) return;
    setShiftMap((prev) => {
      const next = { ...prev };
      for (const id of selectedStaffIds) {
        if (batchShift === 'none') {
          delete next[id];
        } else {
          next[id] = batchShift;
        }
      }
      return next;
    });
    setSelectedStaffIds(new Set());
  };

  const handleClearAll = () => {
    if (window.confirm('您確定要清除所有員工的預設班別並重新設定嗎？')) {
      setShiftMap({});
      setSelectedStaffIds(new Set());
    }
  };

  const handleSave = () => {
    const finalUpdates: Record<string, string | undefined> = {};
    for (const staff of staffList) {
      finalUpdates[staff.id] = shiftMap[staff.id] || undefined;
    }
    onSaveStaffShifts(finalUpdates);
    onClose();
  };

  const assignedCount = Object.keys(shiftMap).filter((k) => !!shiftMap[k]).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shadow-2xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm md:text-base">
                設定員工預設排班班別
              </h3>
              <p className="text-xs text-gray-500">
                為每位後廚人員分配固定班別 ({ALLOWED_SHIFT_CODES.join(', ')})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Batch Bar */}
        <div className="p-3 bg-blue-50/60 border-b border-blue-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="font-semibold text-blue-700 hover:text-blue-900 cursor-pointer underline"
            >
              {selectedStaffIds.size === staffList.length ? '取消全選' : '全選'} ({selectedStaffIds.size}/{staffList.length})
            </button>
            {selectedStaffIds.size > 0 && (
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-gray-600">批次設定：</span>
                <select
                  value={batchShift}
                  onChange={(e) => setBatchShift(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold text-gray-800 focus:outline-none"
                >
                  <option value="none">-- 清除班別 --</option>
                  {ALLOWED_SHIFT_CODES.map((code) => (
                    <option key={code} value={code}>
                      班別 {code}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleApplyBatch}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-2xs cursor-pointer"
                >
                  套用
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-[11px]">
              已設定：<strong className="text-emerald-700">{assignedCount}/{staffList.length}</strong> 人
            </span>
            <button
              type="button"
              onClick={handleClearAll}
              className="flex items-center gap-1 text-[11px] text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>清空所有班別</span>
            </button>
          </div>
        </div>

        {/* Staff List Table */}
        <div className="overflow-y-auto p-4 flex-1 divide-y divide-gray-100">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50/50">
                <th className="p-2 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={selectedStaffIds.size === staffList.length && staffList.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="p-2">員工姓名</th>
                <th className="p-2 w-24">組別</th>
                <th className="p-2">預設上班班別</th>
                <th className="p-2 text-right">標籤預覽</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staffList.map((staff) => {
                const currentShift = shiftMap[staff.id] || '';
                const isSelected = selectedStaffIds.has(staff.id);

                return (
                  <tr
                    key={staff.id}
                    className={`hover:bg-gray-50/80 transition-colors ${
                      isSelected ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectStaff(staff.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <StaffAvatar profile={staff} size="xs" />
                        <div>
                          <div className="font-bold text-gray-900">{staff.full_name}</div>
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded">
                            {staff.employee_code}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      {staff.dept_code ? (
                        <span className="font-mono text-gray-600 font-semibold bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                          #{staff.dept_code}
                        </span>
                      ) : (
                        <span className="text-gray-400">--</span>
                      )}
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <select
                          value={currentShift}
                          onChange={(e) => {
                            const val = e.target.value;
                            setShiftMap((prev) => {
                              const copy = { ...prev };
                              if (val) {
                                copy[staff.id] = val;
                              } else {
                                delete copy[staff.id];
                              }
                              return copy;
                            });
                          }}
                          className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="">-- 未設定 --</option>
                          {ALLOWED_SHIFT_CODES.map((code) => {
                            const sObj = SHIFTS.find((s) => s.id === code);
                            return (
                              <option key={code} value={code}>
                                班別 {code} {sObj ? `(${sObj.time.split(' & ')[0]})` : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </td>
                    <td className="p-2 text-right">
                      {currentShift ? (
                        <span
                          className={`inline-block text-[11px] font-black px-2 py-0.5 rounded border shadow-2xs ${getShiftBadgeStyle(
                            currentShift
                          )}`}
                        >
                          班別 {currentShift}
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">未設定</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            可用班別：{ALLOWED_SHIFT_CODES.map((c) => `班別 ${c}`).join(' • ')}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-xl transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>儲存班別設定</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
