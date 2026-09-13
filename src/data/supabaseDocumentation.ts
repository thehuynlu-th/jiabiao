export const SUPABASE_SQL = `-- =========================================================
-- 1. 員工資料表 PROFILES (擴充自 Supabase auth.users)
-- =========================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  employee_code text unique not null, -- 員工登入工號：A0828, S0013, thehuyth...
  full_name text not null,            -- 員工姓名
  hire_date date default current_date, -- 到職日期 (YYYY-MM-DD)
  role text not null check (role in ('manager', 'staff')) default 'staff',
  default_shift text not null check (default_shift in ('8', '10/', '12/', '12//', '14', '15', '16', '17', '14:00', '15:00', '16:00', '17:00')) default '14:00',
  avatar_url text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- =========================================================
-- 廚房工號登入與預設通行碼 88888888 說明
-- =========================================================
-- 建立新同仁時，可透過 RPC 函數或 Admin API 建立使用者：
-- 內部信箱規則：<employee_code>@kitchen.internal (例如：A0828@kitchen.internal)
-- 預設通行碼：'88888888'
-- 員工僅需輸入工號 (例如：A0828) 與預設密碼 88888888 即可登入。

-- 啟用資料列安全 (Row Level Security, RLS)
alter table public.profiles enable row level security;

-- =========================================================
-- 2. 請假/排休資料表 LEAVE_REQUESTS
-- =========================================================
create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  request_date date not null,
  status text not null check (status in ('pending', 'approved', 'rejected')) default 'pending',
  reason text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  -- 每位員工每日僅能有一筆排休/請假紀錄
  constraint unique_user_request_date unique (user_id, request_date)
);

-- 啟用 Row Level Security (RLS)
alter table public.leave_requests enable row level security;

-- 索引優化（依日期與員工查詢）
create index idx_leave_requests_user_date on public.leave_requests(user_id, request_date);
create index idx_leave_requests_date_status on public.leave_requests(request_date, status);

-- =========================================================
-- 3. 管理者權限檢查函數 (避免 RLS 遞迴 - Security Definer)
-- =========================================================
create or replace function public.is_manager()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'manager'
  );
$$;

-- =========================================================
-- 4. PROFILES 資料表存取政策 (RLS Policies)
-- =========================================================
-- 所有已登入同仁皆可檢視同事資料以顯示班表
create policy "Authenticated users can view all profiles"
  on public.profiles
  for select
  to authenticated
  using (true);

-- 員工僅能更新個人資料 (或主管協助更新)
create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id or public.is_manager());

-- 主管有權新增或設定同仁資料
create policy "Managers can insert profiles"
  on public.profiles
  for insert
  to authenticated
  with check (public.is_manager() or auth.uid() = id);

-- =========================================================
-- 5. LEAVE_REQUESTS 資料表存取政策
-- =========================================================
-- SELECT: 員工僅查看自己的申請單，主管可檢視全體
create policy "Staff view own requests, Manager views all"
  on public.leave_requests
  for select
  to authenticated
  using (
    auth.uid() = user_id or public.is_manager()
  );

-- INSERT: 員工提交排休申請，主管亦可代為新增
create policy "Staff can insert their own leave requests"
  on public.leave_requests
  for insert
  to authenticated
  with check (
    auth.uid() = user_id or public.is_manager()
  );

-- UPDATE: 僅主管有權核准/駁回 (更新 status)；員工僅能在 pending 狀態修改
create policy "Manager can update all, Staff can update pending own"
  on public.leave_requests
  for update
  to authenticated
  using (
    public.is_manager() or (auth.uid() = user_id and status = 'pending')
  )
  with check (
    public.is_manager() or (auth.uid() = user_id and status = 'pending')
  );

-- DELETE: 員工可取消待審核中的申請；主管可刪除任意紀錄
create policy "Staff delete pending own, Manager delete any"
  on public.leave_requests
  for delete
  to authenticated
  using (
    public.is_manager() or (auth.uid() = user_id and status = 'pending')
  );

-- =========================================================
-- 6. 自動註冊觸發器 (新使用者建立時自動產生 profile)
-- =========================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, default_shift, position)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', '新進同仁'),
    coalesce(new.raw_user_meta_data->>'role', 'staff'),
    coalesce(new.raw_user_meta_data->>'default_shift', '14:00'),
    coalesce(new.raw_user_meta_data->>'position', '廚房人員')
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
`;

export const NEXTJS_STRUCTURE = `
my-kitchen-scheduler/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx              # 工號登入頁面 (Supabase Auth)
│   │   └── register/
│   │       └── page.tsx              # 員工帳號註冊頁面
│   ├── (dashboard)/
│   │   ├── layout.tsx                # 全域版型：側邊欄導航、頂部標題、身分驗證守衛
│   │   ├── manager/
│   │   │   ├── page.tsx              # 主管儀表板：後廚班表矩陣與每日各班次人數統計
│   │   │   └── requests/
│   │   │       └── page.tsx          # 待審核休假清單 (Pending Requests)
│   │   ├── staff/
│   │   │   ├── page.tsx              # 員工個人月曆：點選登記排休
│   │   │   └── my-requests/
│   │   │       └── page.tsx          # 歷史排休與審核狀態
│   │   └── unauthorized/
│   │       └── page.tsx              # 無主管權限警示頁面
│   ├── api/                          # Next.js Route Handlers (匯出報表/Webhooks)
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts              # 處理 Supabase Session 回呼
│   ├── layout.tsx                    # 根版型與全域字型
│   ├── page.tsx                      # 首頁 / 依角色智慧導向
│   └── globals.css                   # Tailwind CSS 樣式表
├── components/
│   ├── ui/                           # UI 元件 (Button, Dialog, Badge, Table, Tooltip...)
│   ├── kitchen/
│   │   ├── MatrixScheduleTable.tsx   # 核心排班矩陣表：員工列表 x 當月日期
│   │   ├── ShiftCoverageBar.tsx      # 各班次出勤人力統計列 (14:00, 15:00, 16:00, 17:00...)
│   │   ├── PendingRequestsList.tsx   # 待審核請假清單與一鍵核准/駁回
│   │   ├── StaffCalendar.tsx         # 員工互動式排休月曆
│   │   └── RequestLeaveModal.tsx     # 登記排休對話框
│   └── layout/
│       ├── Header.tsx                # 頂部導航列：廚房資訊、使用者身分、切換帳號
│       └── Sidebar.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # createBrowserClient (客戶端元件)
│   │   ├── server.ts                 # createServerClient (伺服端元件)
│   │   └── middleware.ts             # 透過 Cookies 同步 Supabase Session
│   ├── types.ts                      # 資料型別定義 (Profiles, LeaveRequests, Shifts)
│   └── utils.ts                      # 班表運算與日期格式化工具函式
├── middleware.ts                     # 路由中介層：限制員工進入 /manager 頁面
├── .env.local                        # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
├── package.json
└── tailwind.config.ts
`;

export const MANAGER_DASHBOARD_CODE = `// app/(dashboard)/manager/page.tsx
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import MatrixScheduleTable from '@/components/kitchen/MatrixScheduleTable';
import PendingRequestsList from '@/components/kitchen/PendingRequestsList';

export const revalidate = 0; // 隨時取得最新班表資料

export default async function ManagerDashboardPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string };
}) {
  const supabase = createServerClient();

  // 1. 檢查 session 與主廚主管權限
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'manager') {
    redirect('/staff');
  }

  // 2. 確定目前檢視之月份與年份
  const today = new Date();
  const currentYear = searchParams.year ? parseInt(searchParams.year) : today.getFullYear();
  const currentMonth = searchParams.month ? parseInt(searchParams.month) : today.getMonth() + 1;

  // 月初與月底日期計算
  const startDate = \`\${currentYear}-\${String(currentMonth).padStart(2, '0')}-01\`;
  const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
  const endDate = \`\${currentYear}-\${String(currentMonth).padStart(2, '0')}-\${lastDayOfMonth}\`;

  // 3. 取得全體廚房人員名冊
  const { data: staffList } = await supabase
    .from('profiles')
    .select('*')
    .order('role', { ascending: false })
    .order('default_shift', { ascending: true });

  // 4. 取得當月排休紀錄
  const { data: leaveRequests } = await supabase
    .from('leave_requests')
    .select('*, profiles(full_name, default_shift)')
    .gte('request_date', startDate)
    .lte('request_date', endDate);

  // 5. 取得待審核的請假申請
  const { data: pendingRequests } = await supabase
    .from('leave_requests')
    .select('*, profiles(full_name, default_shift, position)')
    .eq('status', 'pending')
    .order('request_date', { ascending: true });

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* 標題與月份資訊 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">後廚專業排班管理系統</h1>
          <p className="text-sm text-gray-500">
            {currentYear} 年 {currentMonth} 月 • 主管：{profile.full_name}
          </p>
        </div>
      </div>

      {/* 待審核請假申請清單 */}
      <PendingRequestsList requests={pendingRequests || []} />

      {/* 排班矩陣表與每日各班別出勤人數統計 */}
      <MatrixScheduleTable
        year={currentYear}
        month={currentMonth}
        staffList={staffList || []}
        leaveRequests={leaveRequests || []}
      />
    </div>
  );
}
`;
