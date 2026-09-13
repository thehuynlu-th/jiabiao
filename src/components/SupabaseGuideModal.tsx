import { useState } from 'react';
import { X, Copy, Check, Database, FolderTree, Code2, BookOpen, ExternalLink, Terminal } from 'lucide-react';
import { SUPABASE_SQL, NEXTJS_STRUCTURE, MANAGER_DASHBOARD_CODE } from '../data/supabaseDocumentation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupabaseGuideModal({ isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'sql' | 'structure' | 'code' | 'guide'>('sql');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                Supabase + Next.js 技術文檔與程式碼範例
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                  Full-stack Kitchen System
                </span>
              </h2>
              <p className="text-xs text-gray-500">
                SQL Schema, 資料列安全設定 (RLS), App Router 結構及主管後台原始碼
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-200 bg-white px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'sql'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Terminal className="w-4 h-4" />
            1. Supabase SQL & RLS
          </button>

          <button
            onClick={() => setActiveTab('structure')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'structure'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            2. Next.js App Router 結構
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'code'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Code2 className="w-4 h-4" />
            3. 主管後台範例程式碼
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            4. 逐步部署指南 (Step-by-step)
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/40">
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">在 Supabase SQL Editor 執行的資料庫腳本</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    包含 <code className="text-emerald-700 font-mono">profiles</code>、<code className="text-emerald-700 font-mono">leave_requests</code> 資料表、自動建立 Profile 觸發器以及員工/主管權限 RLS 規則。
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(SUPABASE_SQL, 'sql')}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  {copiedKey === 'sql' ? (
                    <>
                      <Check className="w-4 h-4" /> 已複製！
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> 複製完整 SQL
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-gray-800 bg-gray-950 shadow-inner">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 text-xs text-gray-400 font-mono">
                  <span>supabase_schema_rls.sql</span>
                  <span>PostgreSQL 15+</span>
                </div>
                <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed max-h-[500px]">
                  {SUPABASE_SQL}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'structure' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">標準 Next.js (App Router) 專案目錄架構</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    清楚劃分 <code>(auth)</code> 與 <code>(dashboard)</code> 路由群組，整合 Server Components 與 Supabase Middleware。
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(NEXTJS_STRUCTURE, 'structure')}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  {copiedKey === 'structure' ? (
                    <>
                      <Check className="w-4 h-4" /> 已複製！
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> 複製專案架構
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-gray-800 bg-gray-950 shadow-inner">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 text-xs text-gray-400 font-mono">
                  <span>Project Directory Architecture</span>
                </div>
                <pre className="p-4 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed max-h-[500px]">
                  {NEXTJS_STRUCTURE}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">範例程式碼：主管儀表板頁面 (Next.js Server Component)</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    讀取員工資料與月度排班休假紀錄，並渲染包含每日各班別統計的排班矩陣表。
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(MANAGER_DASHBOARD_CODE, 'code')}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  {copiedKey === 'code' ? (
                    <>
                      <Check className="w-4 h-4" /> 已複製！
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> 複製程式碼
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-gray-800 bg-gray-950 shadow-inner">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 text-xs text-gray-400 font-mono">
                  <span>app/(dashboard)/manager/page.tsx</span>
                  <span>TypeScript / React Server Component</span>
                </div>
                <pre className="p-4 text-xs font-mono text-amber-300 overflow-x-auto leading-relaxed max-h-[500px]">
                  {MANAGER_DASHBOARD_CODE}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-6 text-sm text-gray-700 bg-white p-6 rounded-xl border border-gray-200">
              <div className="space-y-3">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">1</span>
                  建立 Supabase 專案
                </h3>
                <ol className="list-decimal list-inside pl-2 space-y-1.5 text-gray-600">
                  <li>造訪 <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-medium inline-flex items-center gap-1">supabase.com <ExternalLink className="w-3 h-3" /></a> 並點擊 <strong>New Project</strong>。</li>
                  <li>設定專案名稱（例如：<code className="bg-gray-100 px-1 py-0.5 rounded">restaurant-kitchen-scheduler</code>）並設定資料庫密碼。</li>
                  <li>開啟左側選單的 <strong>SQL Editor</strong>，點擊 <strong>New query</strong>。</li>
                  <li>貼上第 <strong>1. Supabase SQL & RLS</strong> 標籤頁中的完整 SQL 語法並點擊 <strong>Run</strong>。</li>
                </ol>
              </div>

              <div className="space-y-3 border-t border-gray-100 pt-4">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">2</span>
                  建立 Next.js 專案並安裝套件
                </h3>
                <div className="bg-gray-950 text-gray-100 p-3 rounded-lg font-mono text-xs space-y-1">
                  <p className="text-gray-400"># 建立 Next.js app（TypeScript, Tailwind CSS, App Router）</p>
                  <p className="text-emerald-400">npx create-next-app@latest kitchen-scheduler --typescript --tailwind --eslint --app</p>
                  <p className="text-gray-400 mt-2"># 安裝 Supabase SSR 與圖示庫</p>
                  <p className="text-emerald-400">npm install @supabase/supabase-js @supabase/ssr lucide-react</p>
                </div>
              </div>

              <div className="space-y-3 border-t border-gray-100 pt-4">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">3</span>
                  配置環境變數 (.env.local)
                </h3>
                <p className="text-xs text-gray-500">在 Supabase 的 <strong>Project Settings → API</strong> 取得 Project URL 與 Anon Key：</p>
                <div className="bg-gray-950 text-emerald-300 p-3 rounded-lg font-mono text-xs">
                  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co<br />
                  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
                </div>
              </div>

              <div className="space-y-3 border-t border-gray-100 pt-4">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">4</span>
                  部署至 GitHub 與 Vercel
                </h3>
                <ol className="list-decimal list-inside pl-2 space-y-1.5 text-gray-600">
                  <li>初始化 git 儲存庫並推送到 <strong>GitHub</strong>。</li>
                  <li>前往 <strong>Vercel.com</strong>，點選 <strong>Add New Project</strong> 並匯入該 repository。</li>
                  <li>在 Vercel 專案設定的 <strong>Environment Variables</strong> 中，填入 <code className="bg-gray-100 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code> 與 <code className="bg-gray-100 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>。</li>
                  <li>點擊 <strong>Deploy</strong>，2 分鐘內即可上線運行！</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <span>提示：您可直接在下方畫面體驗主廚主管與員工身分的排班系統功能。</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors cursor-pointer"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
}
