import { Check, X, Clock, AlertTriangle, CalendarDays, User, ChevronRight } from 'lucide-react';
import { LeaveRequest, Profile } from '../types';
import { formatChineseDate } from '../lib/dateUtils';
import { StaffAvatar, isFemaleStaff } from './StaffAvatar';

interface Props {
  requests: LeaveRequest[];
  profiles: Profile[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onApproveAll?: () => void;
}

export default function PendingRequestsList({
  requests,
  profiles,
  onApprove,
  onReject,
  onApproveAll,
}: Props) {
  if (requests.length === 0) {
    return (
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-900">目前沒有待審核的排休或請假申請</h3>
            <p className="text-xs text-emerald-700 mt-0.5">
              所有廚房同仁提交的休假與排休申請均已處理完畢。
            </p>
          </div>
        </div>
        <div className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
          全體人力運作正常
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-amber-200/90 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
            {requests.length}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              待主廚審核之排休與請假申請
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                待審核
              </span>
            </h3>
            <p className="text-xs text-gray-500">
              審核前請確認各班次在席人力，確保廚房正常出餐運作。
            </p>
          </div>
        </div>

        {requests.length > 1 && onApproveAll && (
          <button
            onClick={onApproveAll}
            className="text-xs font-semibold px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            一鍵全數核准 ({requests.length})
          </button>
        )}
      </div>

      {/* Grid of pending requests */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {requests.map((req) => {
          const staff = profiles.find((p) => p.id === req.user_id);

          return (
            <div
              key={req.id}
              className="relative p-4 rounded-xl border border-amber-200/80 bg-amber-50/30 hover:bg-amber-50/60 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                {/* Staff info */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <StaffAvatar profile={staff} size="sm" />
                    <div>
                      <div className="text-xs font-bold text-gray-900">
                        {staff?.full_name || '同仁'}
                      </div>
                      <div className="text-[11px] text-gray-500 font-medium">
                        <span className="text-emerald-700 font-semibold">
                          {staff?.default_shift ? `班別 ${staff.default_shift}` : '未指定班別'}
                        </span>
                        {' • '}
                        {staff?.dept_code ? `組別 ${staff.dept_code}` : (staff?.position || '廚房同仁')}
                      </div>
                    </div>
                  </div>

                  {staff && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-emerald-300 bg-emerald-100 text-emerald-900 shrink-0">
                      {staff.employee_code}
                    </span>
                  )}
                </div>

                {/* Request details */}
                <div className="bg-white/80 p-2.5 rounded-lg border border-amber-100 space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-gray-800">
                    <CalendarDays className="w-3.5 h-3.5 text-amber-600" />
                    <span>申請排休日：{formatChineseDate(req.request_date)}</span>
                  </div>
                  {req.reason && (
                    <p className="text-gray-600 italic text-[11px] line-clamp-2">
                      &ldquo;{req.reason}&rdquo;
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1 border-t border-amber-100/60">
                <button
                  onClick={() => onApprove(req.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  核准 (Approve)
                </button>
                <button
                  onClick={() => onReject(req.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  退回 (Reject)
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
