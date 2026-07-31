-- 냉장고 재료 인식 & 레시피 추천 앱 - 3단계(사용자 프로필/레시피 저장) 스키마
-- Supabase 대시보드 > SQL Editor 에서 전체를 붙여넣고 실행하세요.
-- auth.users 는 Supabase Auth가 기본 제공하는 테이블이라 별도 생성이 필요 없습니다.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default '',
  allergies text[] not null default '{}',
  preferred_cuisines text[] not null default '{}',
  preferred_difficulty text,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  difficulty text,
  cook_time_minutes int,
  servings int,
  used_ingredients text[] not null default '{}',
  missing_ingredients text[] not null default '{}',
  steps text[] not null default '{}',
  memo text not null default '',
  saved_at timestamptz not null default now()
);

create index if not exists saved_recipes_user_id_idx on public.saved_recipes (user_id);

-- 서버는 service_role 키로만 접근하며(회원가입/로그인 시 발급된 토큰을 서버가 검증한 뒤
-- 애플리케이션 코드에서 user_id로 필터링) RLS를 우회합니다. 그래도 방어적으로
-- anon/authenticated 키가 직접 이 테이블에 접근하는 경우를 막기 위해 RLS를 켜고
-- "본인 행만" 허용하는 정책을 추가해둠니다.
alter table public.profiles enable row level security;
alter table public.saved_recipes enable row level security;

drop policy if exists "profiles_owner_all" on public.profiles;
create policy "profiles_owner_all" on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "saved_recipes_owner_all" on public.saved_recipes;
create policy "saved_recipes_owner_all" on public.saved_recipes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
