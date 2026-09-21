-- 반려동물·어린이 동반여행 서비스 - 초기 스키마
--
-- 사용법: Supabase 대시보드 → SQL Editor → 새 쿼리에 이 파일 전체를 붙여넣고
-- "Run" 실행. 딱 한 번만 실행하면 됩니다 (재실행해도 안전하도록
-- `if not exists`/`or replace`를 썼지만, 데이터가 있는 상태에서 반복 실행은
-- 권장하지 않아요).
--
-- 인증은 Supabase Auth(이메일/비밀번호)를 그대로 쓰고, 모든 테이블은
-- Row Level Security로 "본인 데이터만" 보이게 잠가둡니다.

create extension if not exists "pgcrypto";

create table if not exists public.travel_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  companion_type text not null check (companion_type in ('pet', 'child')),
  start_date date not null,
  end_date date not null,
  -- 추천 결과에서 선택한 Spot들을 그대로 스냅샷으로 저장합니다
  -- (src/types/index.ts의 Spot[] 구조와 동일한 JSON 배열).
  spots jsonb not null default '[]'::jsonb,
  companion_user_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.stamps (
  id uuid primary key default gen_random_uuid(),
  travel_plan_id uuid not null references public.travel_plans (id) on delete cascade,
  spot_id text not null,
  earned_at timestamptz not null default now(),
  unique (travel_plan_id, spot_id)
);

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  travel_plan_id uuid not null references public.travel_plans (id) on delete cascade unique,
  title text not null,
  description text not null,
  -- 아직 실제 매장에서 쓸 수 있는 코드는 아니에요 (완주 증표 성격) - src/lib/reward-code.ts에서 생성.
  code text not null default '',
  claimed_at timestamptz not null default now()
);

-- 이미 만든 테이블에 code 컬럼이 없다면 추가 (기존 스키마를 실행한 적이 있어도
-- 이 파일을 다시 실행하면 안전하게 따라갑니다).
alter table public.rewards add column if not exists code text not null default '';

alter table public.travel_plans enable row level security;
alter table public.stamps enable row level security;
alter table public.rewards enable row level security;

drop policy if exists "travel_plans_owner" on public.travel_plans;
create policy "travel_plans_owner" on public.travel_plans
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "stamps_owner" on public.stamps;
create policy "stamps_owner" on public.stamps
  for all
  using (
    exists (
      select 1 from public.travel_plans tp
      where tp.id = stamps.travel_plan_id and tp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.travel_plans tp
      where tp.id = stamps.travel_plan_id and tp.user_id = auth.uid()
    )
  );

drop policy if exists "rewards_owner" on public.rewards;
create policy "rewards_owner" on public.rewards
  for all
  using (
    exists (
      select 1 from public.travel_plans tp
      where tp.id = rewards.travel_plan_id and tp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.travel_plans tp
      where tp.id = rewards.travel_plan_id and tp.user_id = auth.uid()
    )
  );

create index if not exists travel_plans_user_id_idx on public.travel_plans (user_id);
create index if not exists stamps_travel_plan_id_idx on public.stamps (travel_plan_id);
create index if not exists rewards_travel_plan_id_idx on public.rewards (travel_plan_id);
