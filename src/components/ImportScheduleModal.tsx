import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Check,
  Sparkles,
  Calendar,
  Layers,
  Wand2,
} from 'lucide-react';
import { Profile, LeaveRequest, ShiftAssignments, ALLOWED_SHIFT_CODES } from '../types';
import { getDaysInMonth } from '../lib/dateUtils';
import { StaffAvatar } from './StaffAvatar';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  month: number;
  staffList: Profile[];
  onApplySchedule: (newShifts: ShiftAssignments, newLeaves: LeaveRequest[]) => void;
}

interface ParsedScheduleRow {
  staff?: Profile;
  rawCode: string;
  rawName: string;
  days: Record<number, string>; // day 1..31 -> '8' | '10/' | '12/' | '12//' | '14' | '15' | '16' | '17' | 'OFF' | ''
  isValid: boolean;
}

export default function ImportScheduleModal({
  isOpen,
  onClose,
  year,
  month,
  staffList,
  onApplySchedule,
}: Props) {
  const [activeTab, setActiveTab] = useState<'paste' | 'upload' | 'template' | 'autofill'>('paste');
  const [pastedText, setPastedText] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedScheduleRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [hasParsed, setHasParsed] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const numDays = daysInMonth.length;

  // Generate sample CSV/TSV template text for copy/paste
  const sampleTemplateText = useMemo(() => {
    const header = ['工號', '姓名', '預設班別', ...Array.from({ length: numDays }, (_, i) => `${i + 1}`)].join('\t');
    const rows = staffList.map((s, idx) => {
      // Create a nice realistic pattern (e.g. 6 days work, 1 day off)
      const rowVals = Array.from({ length: numDays }, (_, d) => {
        const dayNum = d + 1;
        // Simple rotating day off
        if ((dayNum + idx) % 7 === 0) return 'OFF';
        // Short shift format: 14:00 -> 14
        const shiftShort = s.default_shift ? s.default_shift.replace(':00', '') : '14';
        return shiftShort;
      });
      return [s.employee_code, s.full_name, s.default_shift || '14:00', ...rowVals].join('\t');
    });
    return [header, ...rows].join('\n');
  }, [staffList, numDays]);

  if (!isOpen) return null;

  // Normalize cell value to recognized shift code or 'OFF'
  const normalizeCellValue = (val: string): string => {
    if (!val) return '';
    const clean = val.trim().toUpperCase();
    if (clean === 'OFF' || clean === '休' || clean === '休假' || clean === 'NGHỈ' || clean === 'NGHI' || clean === 'X' || clean === 'O') {
      return 'OFF';
    }

    const raw = val.trim();
    // Check if it matches allowed codes: '8', '10/', '12/', '12//', '14', '15', '16', '17'
    for (const code of ALLOWED_SHIFT_CODES) {
      if (raw === code || raw === `${code}:00`) {
        return code;
      }
    }

    // Check full shifts e.g. "14:00" -> "14"
    if (raw === '14:00') return '14';
    if (raw === '15:00') return '15';
    if (raw === '16:00') return '16';
    if (raw === '17:00') return '17';
    if (raw === '8:00' || raw === '08:00') return '8';

    return raw; // Return as custom shift string if provided
  };

  // Parse 2D raw array into structured staff schedule rows
  const parseMatrixData = (matrix: string[][]) => {
    if (matrix.length === 0) return;

    // Determine if first row is header
    let startRowIndex = 0;
    const firstRow = matrix[0].map(c => (c || '').toString().trim().toLowerCase());
    const isHeader =
      firstRow.some(c => c.includes('mã') || c.includes('code') || c.includes('tên') || c.includes('name') || c.includes('工號') || c.includes('姓名')) ||
      firstRow.some(c => !isNaN(parseInt(c)) && parseInt(c) >= 1 && parseInt(c) <= 31);

    if (isHeader) {
      startRowIndex = 1;
    }

    const results: ParsedScheduleRow[] = [];

    for (let r = startRowIndex; r < matrix.length; r++) {
      const row = matrix[r];
      if (!row || row.length === 0 || row.every(c => !c || c.toString().trim() === '')) continue;

      const col0 = (row[0] || '').toString().trim();
      const col1 = (row[1] || '').toString().trim();

      // Find staff by employee code (Col 0 or Col 1) or Name
      let matchedStaff = staffList.find(
        s =>
          s.employee_code.toLowerCase() === col0.toLowerCase() ||
          s.employee_code.toLowerCase() === col1.toLowerCase()
      );

      if (!matchedStaff) {
        matchedStaff = staffList.find(
          s =>
            s.full_name.toLowerCase() === col0.toLowerCase() ||
            s.full_name.toLowerCase() === col1.toLowerCase()
        );
      }

      // Find which column day 1 starts at
      // If col 0 is code, col 1 is name, col 2 is default shift, day 1 is at col 3 (or col 2)
      let dayStartCol = 1;
      if (col0 && col1) {
        // Check if col 2 is a shift header like "14:00" or dept
        const col2 = (row[2] || '').toString().trim();
        if (col2.includes(':00') || col2 === '14' || col2 === '15' || col2 === '16' || col2 === '17') {
          dayStartCol = 3;
        } else {
          dayStartCol = 2;
        }
      }

      const daysData: Record<number, string> = {};
      for (let d = 1; d <= numDays; d++) {
        const cellVal = (row[dayStartCol + (d - 1)] || '').toString().trim();
        daysData[d] = normalizeCellValue(cellVal);
      }

      results.push({
        staff: matchedStaff,
        rawCode: col0,
        rawName: col1,
        days: daysData,
        isValid: !!matchedStaff,
      });
    }

    setParsedRows(results);
    setHasParsed(true);
  };

  // Handle parsing pasted text (TSV/CSV)
  const handleParseText = (text: string) => {
    if (!text.trim()) {
      setParsedRows([]);
      setHasParsed(false);
      return;
    }

    const lines = text.split(/\r\n|\n|\r/).filter(l => l.trim().length > 0);
    const delimiter = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';

    const matrix = lines.map(line => {
      return line.split(delimiter).map(cell => cell.trim().replace(/^["']|["']$/g, ''));
    });

    parseMatrixData(matrix);
  };

  // Handle file upload (.xlsx, .xls, .csv, .tsv)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonMatrix = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

        parseMatrixData(jsonMatrix);
      } catch (err) {
        console.error('Error reading Excel file:', err);
        alert('讀取 Excel 檔案時發生錯誤，請確認檔案格式是否正確。');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Download official Excel template
  const handleDownloadExcel = () => {
    const header = ['工號', '姓名', '預設班別', ...Array.from({ length: numDays }, (_, i) => `${i + 1}`)];
    const dataRows = staffList.map((s, idx) => {
      const daysCols = Array.from({ length: numDays }, (_, d) => {
        const dayNum = d + 1;
        if ((dayNum + idx) % 7 === 0) return 'OFF';
        return s.default_shift ? s.default_shift.replace(':00', '') : '14';
      });
      return [s.employee_code, s.full_name, s.default_shift || '14:00', ...daysCols];
    });

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...dataRows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${year}年${month + 1}月排班表`);
    XLSX.writeFile(workbook, `廚房排班表_${year}年${month + 1}月.xlsx`);
  };

  // Copy sample TSV to clipboard
  const handleCopyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(sampleTemplateText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // Auto-fill default shift for all active days (except already requested OFF)
  const handleAutoFillDefaultShifts = () => {
    const staffWithShifts = staffList.filter((s) => !!s.default_shift);
    if (staffWithShifts.length === 0) {
      alert('尚未有員工設定預設班別，請先至員工設定中指派班別。');
      return;
    }
    const newShifts: ShiftAssignments = {};
    for (const staff of staffWithShifts) {
      const shiftCode = staff.default_shift!;
      for (const day of daysInMonth) {
        newShifts[`${staff.id}_${day.dateStr}`] = shiftCode;
      }
    }
    onApplySchedule(newShifts, []);
    onClose();
  };

  // Commit parsed data to the schedule
  const handleCommit = () => {
    const newShifts: ShiftAssignments = {};
    const newLeaves: LeaveRequest[] = [];

    for (const row of parsedRows) {
      if (!row.staff) continue;
      const staffId = row.staff.id;

      for (let d = 1; d <= numDays; d++) {
        const val = row.days[d];
        if (!val) continue;

        const dayObj = daysInMonth[d - 1];
        if (!dayObj) continue;
        const dateStr = dayObj.dateStr;

        if (val === 'OFF') {
          newLeaves.push({
            id: `leave-imported-${staffId}-${dateStr}-${Date.now()}`,
            user_id: staffId,
            request_date: dateStr,
            status: 'approved',
            reason: '休假登記 (由 Excel 匯入)',
            created_at: new Date().toISOString(),
          });
        } else {
          // Shift code: 8, 10/, 12/, 12//, 14, 15, 16, 17, etc.
          newShifts[`${staffId}_${dateStr}`] = val;
        }
      }
    }

    onApplySchedule(newShifts, newLeaves);
    onClose();
  };

  // Statistics from parsed data
  const stats = useMemo(() => {
    let totalShifts = 0;
    let totalLeaves = 0;
    const matchedCount = parsedRows.filter(r => r.isValid).length;

    for (const r of parsedRows) {
      if (!r.isValid) continue;
      for (let d = 1; d <= numDays; d++) {
        const val = r.days[d];
        if (val === 'OFF') totalLeaves++;
        else if (val) totalShifts++;
      }
    }

    return { totalShifts, totalLeaves, matchedCount };
  }, [parsedRows, numDays]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                  {year}年{month + 1}月 ({numDays} 天)
                </span>
                <span className="text-xs text-gray-300">• 15 位廚房同仁</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white mt-0.5">
                匯入排班與休假表 (Excel / CSV)
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50/90 px-4 sm:px-6 pt-2 shrink-0 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'paste'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-xs'
                : 'text-gray-500 hover:text-gray-900 border-transparent'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>貼上 Excel 複製內容 (Ctrl+V)</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-xs'
                : 'text-gray-500 hover:text-gray-900 border-transparent'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>上傳 Excel 檔案 (.xlsx, .csv)</span>
          </button>

          <button
            onClick={() => setActiveTab('template')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'template'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-xs'
                : 'text-gray-500 hover:text-gray-900 border-transparent'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>下載 15 人排班範本</span>
          </button>

          <button
            onClick={() => setActiveTab('autofill')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'autofill'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-xs'
                : 'text-gray-500 hover:text-gray-900 border-transparent'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-600" />
            <span>自動套用預設班別</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Quick guide on supported shift codes */}
          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                支援的排班代碼：
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {ALLOWED_SHIFT_CODES.map((c) => (
                  <span
                    key={c}
                    className="font-mono font-bold px-2 py-0.5 bg-white text-emerald-900 rounded-md border border-emerald-300 shadow-2xs"
                  >
                    {c}
                  </span>
                ))}
                <span className="font-mono font-black px-2 py-0.5 bg-rose-100 text-rose-900 rounded-md border border-rose-300 shadow-2xs">
                  OFF
                </span>
                <span className="text-gray-500 text-[11px]">（或空白）</span>
              </div>
            </div>
            <span className="text-gray-600 text-[11px]">
              自動對應 15 位員工編號：A0828, A1078, S0013...
            </span>
          </div>

          {/* TAB 1: PASTE FROM EXCEL */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <label className="font-bold text-gray-800 flex items-center gap-1.5">
                  <Copy className="w-3.5 h-3.5 text-emerald-600" />
                  貼上由 Excel 複製的儲存格區域（框選後按 Ctrl+V）：
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setPastedText(sampleTemplateText);
                    handleParseText(sampleTemplateText);
                  }}
                  className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                >
                  貼上示範資料
                </button>
              </div>

              <textarea
                value={pastedText}
                onChange={(e) => {
                  setPastedText(e.target.value);
                  handleParseText(e.target.value);
                }}
                placeholder="在此貼上 Excel 資料...（欄 1：工號，欄 2：姓名，後續欄位：1, 2, 3 日...）"
                rows={7}
                className="w-full p-3 font-mono text-xs bg-gray-50 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white resize-y shadow-inner"
              />
            </div>
          )}

          {/* TAB 2: UPLOAD EXCEL FILE */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer bg-gray-50/50 hover:bg-emerald-50/30 transition-all flex flex-col items-center justify-center space-y-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    將 Excel 檔案拖曳至此，或點擊選擇檔案
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    支援格式：<code>.xlsx</code>, <code>.xls</code>, <code>.csv</code>, <code>.tsv</code>
                  </p>
                </div>
                {fileName && (
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>已載入檔案：{fileName}</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv, .tsv, .txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {/* TAB 3: DOWNLOAD / COPY TEMPLATE */}
          {activeTab === 'template' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    廚房排班範本檔案（{year}年{month + 1}月）
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    已預先填入完整 15 位員工、預設班別（14:00, 15:00, 16:00, 17:00）及 {numDays} 天欄位。
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadExcel}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>下載 .XLSX Excel 檔案</span>
                  </button>
                  <button
                    onClick={handleCopyTemplate}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{isCopied ? '已複製！' : '複製表格文字'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-gray-200 font-mono text-[11px] text-gray-600 overflow-x-auto max-h-48 whitespace-pre">
                {sampleTemplateText}
              </div>
            </div>
          )}

          {/* TAB 4: AUTOFILL DEFAULT SHIFTS */}
          {activeTab === 'autofill' && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-900 flex items-center justify-center shrink-0">
                  <Wand2 className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    自動將預設班別套用至 {year}年{month + 1}月 全月份
                  </h3>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    此功能會將每位員工已設定好的預設班別直接套用至本月份的所有天數：
                  </p>
                  <div className="text-xs text-gray-700 mt-2.5 max-h-48 overflow-y-auto space-y-1.5 pr-1 bg-white/70 p-2.5 rounded-xl border border-amber-200/80">
                    {staffList.map((staff) => (
                      <div key={staff.id} className="flex items-center justify-between text-[11px] py-1 border-b border-amber-100 last:border-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-900 rounded text-[10px]">
                            {staff.employee_code}
                          </span>
                          <span className="font-semibold text-gray-900">{staff.full_name}</span>
                        </div>
                        {staff.default_shift ? (
                          <span className="font-black text-blue-800 bg-blue-100 px-2 py-0.5 rounded text-[10px]">
                            班別 {staff.default_shift}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-[10px]">未設定班別</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAutoFillDefaultShifts}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>立即自動套用排班</span>
                </button>
              </div>
            </div>
          )}

          {/* PARSED PREVIEW SECTION */}
          {hasParsed && parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    解析資料預覽：
                  </h3>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold">
                      成功比對 {stats.matchedCount} / {parsedRows.length} 位員工
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 font-bold">
                      {stats.totalShifts} 個班次
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 font-bold">
                      {stats.totalLeaves} 天休假 (OFF)
                    </span>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs bg-white">
                <div className="max-h-72 overflow-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gray-100 sticky top-0 z-10 text-gray-700 font-bold border-b border-gray-200">
                      <tr>
                        <th className="p-2.5 sticky left-0 bg-gray-100 z-20 min-w-[140px] border-r border-gray-200">
                          員工
                        </th>
                        {Array.from({ length: numDays }, (_, i) => (
                          <th
                            key={i + 1}
                            className="p-1.5 text-center font-mono border-r border-gray-200 min-w-[32px]"
                          >
                            {i + 1}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parsedRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-gray-50/80 ${
                            !row.isValid ? 'bg-rose-50/50' : ''
                          }`}
                        >
                          <td className="p-2 sticky left-0 bg-white border-r border-gray-200 font-medium">
                            {row.staff ? (
                              <div className="flex items-center gap-1.5">
                                <StaffAvatar profile={row.staff} size="xs" />
                                <div className="min-w-0">
                                  <div className="font-bold text-gray-900 truncate text-[11px]">
                                    {row.staff.full_name}
                                  </div>
                                  <div className="text-[9px] font-mono text-gray-500">
                                    {row.staff.employee_code} • {row.staff.default_shift || '14:00'}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-rose-600 font-bold text-[11px]">
                                {row.rawCode || row.rawName} (未匹配到員工)
                              </span>
                            )}
                          </td>

                          {Array.from({ length: numDays }, (_, i) => {
                            const val = row.days[i + 1];
                            const isOff = val === 'OFF';
                            return (
                              <td
                                key={i + 1}
                                className={`p-1 text-center font-mono text-[10px] font-bold border-r border-gray-100 ${
                                  isOff
                                    ? 'bg-rose-100 text-rose-900 font-black'
                                    : val
                                    ? 'bg-blue-50 text-blue-900'
                                    : 'text-gray-300'
                                }`}
                              >
                                {val || '-'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-gray-500">
            {hasParsed && parsedRows.length > 0 ? (
              <span>
                準備將排班更新至 <strong>{stats.matchedCount} 位員工</strong>。
              </span>
            ) : (
              <span>請貼上 Excel 內容或上傳檔案以預覽資料。</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              取消
            </button>

            <button
              type="button"
              disabled={!hasParsed || parsedRows.filter(r => r.isValid).length === 0}
              onClick={handleCommit}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                hasParsed && parsedRows.filter(r => r.isValid).length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>確認套用至排班表</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
