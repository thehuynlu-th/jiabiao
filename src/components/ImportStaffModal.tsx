import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Download,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Profile, KitchenShift, UserRole } from '../types';
import { SHIFTS } from '../data/mockData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImportStaff: (importedProfiles: Omit<Profile, 'id'>[]) => void;
  existingCount: number;
}

interface ParsedRow {
  code: string;
  name: string;
  hireDate: string;
  shift: KitchenShift;
  role: UserRole;
  isValid: boolean;
  error?: string;
}

const CSV_SAMPLE = `工號,姓名,到職日期,班別
NV-101,王小明,2024-03-01,14:00
NV-102,林雅婷,2024-04-15,14:00
NV-103,陳志豪,2024-05-10,15:00
NV-104,張美玲,2024-06-01,16:00
NV-105,黃冠宇,2024-07-20,17:00
CHEF-02,李大廚,2023-02-01,14:00`;

export default function ImportStaffModal({
  isOpen,
  onClose,
  onImportStaff,
  existingCount,
}: Props) {
  const [activeTab, setActiveTab] = useState<'upload' | 'manual' | 'sql'>('upload');
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [hasParsed, setHasParsed] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual fast text input state
  const [manualText, setManualText] = useState<string>(CSV_SAMPLE);

  if (!isOpen) return null;

  // Normalize shift from various input strings
  const normalizeShift = (rawShift: string): KitchenShift => {
    const s = rawShift.trim().toLowerCase();
    if (s.includes('10')) return '10:00';
    if (s.includes('14')) return '14:00';
    if (s.includes('15')) return '15:00';
    if (s.includes('16')) return '16:00';
    if (s.includes('17')) return '17:00';
    if (s.includes('18')) return '18:00';
    return '14:00'; // Default fallback
  };

  // Parse raw CSV / TSV text
  const parseTextData = (text: string): ParsedRow[] => {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) return [];

    // Check if line 0 is a header
    let startIndex = 0;
    const firstLineLower = lines[0].toLowerCase();
    if (
      firstLineLower.includes('tên') ||
      firstLineLower.includes('name') ||
      firstLineLower.includes('mã') ||
      firstLineLower.includes('ca') ||
      firstLineLower.includes('code') ||
      firstLineLower.includes('姓名') ||
      firstLineLower.includes('工號') ||
      firstLineLower.includes('班別')
    ) {
      startIndex = 1;
    }

    const rows: ParsedRow[] = [];

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      // Split by comma or tab or semicolon
      let parts: string[] = [];
      if (line.includes('\t')) {
        parts = line.split('\t');
      } else if (line.includes(';')) {
        parts = line.split(';');
      } else {
        // Basic CSV split
        parts = line.split(',');
      }

      parts = parts.map((p) => p.trim().replace(/^["']|["']$/g, ''));

      if (parts.length < 2) continue; // Skip empty or invalid lines

      let code = '';
      let name = '';
      let hireDate = '';
      let rawShift = '';

      if (
        /^(NV|CHEF|EMP|B|A|\d)/i.test(parts[0]) &&
        parts[1] &&
        !/^\d{4}-\d{2}-\d{2}$/.test(parts[1])
      ) {
        code = parts[0];
        name = parts[1];
        hireDate = parts[2] || '';
        rawShift = parts[3] || '14:00';
      } else {
        name = parts[0];
        code = parts[1] || '';
        hireDate = parts[2] || '';
        rawShift = parts[3] || '14:00';
      }

      if (hireDate && hireDate.includes('/')) {
        const dParts = hireDate.split('/');
        if (dParts.length === 3) {
          const [d, m, y] = dParts;
          hireDate = `${y.padStart(4, '20')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
      } else if (!hireDate || !/^\d{4}-\d{2}-\d{2}$/.test(hireDate)) {
        hireDate = new Date().toISOString().split('T')[0];
      }

      const shift = normalizeShift(rawShift);

      const isManager =
        code.toUpperCase().startsWith('CHEF') ||
        code.toUpperCase().startsWith('QL') ||
        code.toUpperCase().startsWith('MGR');

      const role: UserRole = isManager ? 'manager' : 'staff';
      const isValid = Boolean(name.trim() && code.trim());

      rows.push({
        code: code.trim(),
        name: name.trim(),
        hireDate,
        shift,
        role,
        isValid,
        error: !isValid ? '缺少姓名或員工工號' : undefined,
      });
    }

    return rows;
  };

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);
      const rows = parseTextData(content);
      setParsedRows(rows);
      setHasParsed(true);
    };
    reader.readAsText(file);
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);
      const rows = parseTextData(content);
      setParsedRows(rows);
      setHasParsed(true);
    };
    reader.readAsText(file);
  };

  // Parse manual text
  const handleParseManual = () => {
    const rows = parseTextData(manualText);
    setParsedRows(rows);
    setHasParsed(true);
  };

  // Download Sample CSV template
  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_SAMPLE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '廚房員工名單範本.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit imported profiles to App
  const handleConfirmImport = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    const avatars = [
      'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    ];

    const newStaffProfiles: Omit<Profile, 'id'>[] = validRows.map((r, idx) => ({
      employee_code: r.code,
      full_name: r.name,
      hire_date: r.hireDate,
      default_shift: r.shift,
      role: r.role,
      avatar_url: avatars[idx % avatars.length],
    }));

    onImportStaff(newStaffProfiles);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                匯入後廚員工名單
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  Excel / CSV
                </span>
              </h2>
              <p className="text-xs text-gray-500">
                匯入欄位：<strong>工號、姓名、到職日期、班別</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-gray-200 bg-white px-6 gap-2 pt-2">
          <button
            onClick={() => {
              setActiveTab('upload');
              if (fileContent) {
                const rows = parseTextData(fileContent);
                setParsedRows(rows);
                setHasParsed(true);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'upload'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            1. 上傳 Excel 檔案 (.csv, .tsv)
          </button>

          <button
            onClick={() => {
              setActiveTab('manual');
              const rows = parseTextData(manualText);
              setParsedRows(rows);
              setHasParsed(true);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'manual'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Plus className="w-4 h-4" />
            2. 從 Excel / 試算表直接貼上
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'sql'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            3. Supabase 資料庫匯入指南
          </button>
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 space-y-5">
          {/* Format specifications info banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-950 space-y-1">
                <div className="font-bold text-emerald-900">
                  系統自動辨識的 4 個資料欄位：
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="bg-white border border-emerald-300 text-emerald-800 font-mono px-2 py-0.5 rounded text-[11px] font-semibold">
                    1. 員工工號
                  </span>
                  <span className="bg-white border border-emerald-300 text-emerald-800 font-mono px-2 py-0.5 rounded text-[11px] font-semibold">
                    2. 員工姓名
                  </span>
                  <span className="bg-white border border-emerald-300 text-emerald-800 font-mono px-2 py-0.5 rounded text-[11px] font-semibold">
                    3. 到職日期 (YYYY-MM-DD)
                  </span>
                  <span className="bg-white border border-emerald-300 text-emerald-800 font-mono px-2 py-0.5 rounded text-[11px] font-semibold">
                    4. 班別 (14:00, 15:00, 16:00, 17:00...)
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold shrink-0 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              下載範本檔案 (.csv)
            </button>
          </div>

          {/* TAB 1: UPLOAD FILE */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/30 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,.txt,.tsv"
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-800">
                    {fileName ? (
                      <span className="text-emerald-700 font-semibold">{fileName}</span>
                    ) : (
                      '將 .CSV / .TSV 檔案拖曳至此，或點擊選擇檔案'
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    支援由 Excel、Google 試算表匯出的逗點或定位點分隔檔案
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANUAL PASTE TEXT */}
          {activeTab === 'manual' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700">
                  直接在此貼上試算表內容（以逗號或 Tab 分隔）：
                </label>
                <button
                  type="button"
                  onClick={handleParseManual}
                  className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  重新解析資料
                </button>
              </div>

              <textarea
                value={manualText}
                onChange={(e) => {
                  setManualText(e.target.value);
                  const rows = parseTextData(e.target.value);
                  setParsedRows(rows);
                  setHasParsed(true);
                }}
                rows={7}
                className="w-full p-3 font-mono text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                placeholder="工號,姓名,到職日期,班別..."
              />
            </div>
          )}

          {/* TAB 3: SQL GUIDE FOR SUPABASE DATABASE */}
          {activeTab === 'sql' && (
            <div className="space-y-4 bg-white p-5 rounded-2xl border border-gray-200">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                直接匯入 Supabase 資料庫方式
              </h3>
              <p className="text-xs text-gray-600">
                若需批次將員工資料寫入 Supabase Cloud 的{' '}
                <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-emerald-800">
                  profiles
                </code>{' '}
                資料表，提供以下兩種便捷方式：
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <div className="font-bold text-emerald-900">方式 1：Supabase 控制台介面 (點擊匯入)</div>
                  <ol className="list-decimal list-inside space-y-1 text-gray-600 leading-relaxed">
                    <li>前往 <strong>Table Editor</strong> → 選擇 <strong>profiles</strong> 表。</li>
                    <li>點選右上角 <strong>Insert</strong> → 選擇 <strong>Import data from CSV</strong>。</li>
                    <li>拖入 CSV 檔案，對應欄位：<code>employee_code</code>, <code>full_name</code>, <code>hire_date</code>, <code>default_shift</code>。</li>
                  </ol>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <div className="font-bold text-emerald-900">方式 2：執行 SQL 批次新增語法</div>
                  <p className="text-gray-600">
                    在 Supabase SQL Editor 中直接執行：
                  </p>
                  <pre className="bg-gray-900 text-emerald-400 p-2.5 rounded-lg text-[11px] font-mono overflow-x-auto">
{`INSERT INTO public.profiles 
(employee_code, full_name, hire_date, default_shift, role)
VALUES
('NV-101', '王小明', '2024-03-01', '14:00', 'staff'),
('NV-102', '林雅婷', '2024-04-15', '14:00', 'staff');`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* PREVIEW TABLE OF PARSED ROWS */}
          {(activeTab === 'upload' || activeTab === 'manual') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800 text-xs uppercase tracking-wider">
                    預覽解析結果（已辨識 {parsedRows.length} 名員工）
                  </span>
                  {parsedRows.some((r) => !r.isValid) && (
                    <span className="text-[11px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      部分資料格式有誤
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  目前系統員工總數：<strong>{existingCount}</strong>
                </span>
              </div>

              {parsedRows.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-gray-200 text-gray-400 text-xs">
                  尚無資料，請上傳檔案或在上方貼上文字。
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs max-h-[300px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gray-100/80 sticky top-0 text-gray-700 font-bold border-b border-gray-200">
                      <tr>
                        <th className="p-2.5">序號</th>
                        <th className="p-2.5">工號</th>
                        <th className="p-2.5">姓名</th>
                        <th className="p-2.5">到職日期</th>
                        <th className="p-2.5">預設班別</th>
                        <th className="p-2.5 text-center">狀態</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parsedRows.map((row, idx) => {
                        const shiftMeta = SHIFTS.find((s) => s.id === row.shift);

                        return (
                          <tr
                            key={idx}
                            className={`hover:bg-gray-50/80 transition-colors ${
                              !row.isValid ? 'bg-red-50/50' : ''
                            }`}
                          >
                            <td className="p-2.5 text-gray-400 font-mono">{idx + 1}</td>
                            <td className="p-2.5 font-bold font-mono text-emerald-800">
                              {row.code || <span className="text-red-500 italic">缺少工號</span>}
                            </td>
                            <td className="p-2.5 font-semibold text-gray-900">
                              {row.name || <span className="text-red-500 italic">缺少姓名</span>}
                            </td>
                            <td className="p-2.5 text-gray-600 font-mono">
                              {row.hireDate}
                            </td>
                            <td className="p-2.5">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${
                                  shiftMeta?.color || 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                班別 {row.shift}
                              </span>
                            </td>
                            <td className="p-2.5 text-center">
                              {row.isValid ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-100/70 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  有效
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] text-red-700 font-semibold bg-red-100 px-2 py-0.5 rounded-full">
                                  <AlertTriangle className="w-3 h-3 text-red-600" />
                                  {row.error}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-3.5 border-t border-gray-200 bg-white flex items-center justify-between text-xs">
          <span className="text-gray-500">
            {parsedRows.filter((r) => r.isValid).length > 0
              ? `已準備匯入 ${parsedRows.filter((r) => r.isValid).length} 名員工至排班表。`
              : '請選擇檔案或貼上名單以開始匯入。'}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors cursor-pointer"
            >
              取消
            </button>

            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={parsedRows.filter((r) => r.isValid).length === 0}
              className={`px-5 py-2 rounded-xl font-bold flex items-center gap-2 shadow-xs transition-all ${
                parsedRows.filter((r) => r.isValid).length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Upload className="w-4 h-4" />
              確認匯入至系統
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
