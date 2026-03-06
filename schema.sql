-- ================================================================
-- FITLOG - Supabase Schema
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 실행하세요
-- ================================================================

-- 1. 운동 기록
create table if not exists workouts (
  id         bigint primary key generated always as identity,
  user_id    uuid references auth.users not null,
  date       text not null,
  exercise   text not null,
  weight     numeric default 0,
  sets       integer default 0,
  reps       integer default 0,
  created_at timestamptz default now()
);
alter table workouts enable row level security;
create policy "own workouts" on workouts for all using (auth.uid() = user_id);

-- 2. 식단 기록
create table if not exists foods (
  id         bigint primary key generated always as identity,
  user_id    uuid references auth.users not null,
  date       text not null,
  name       text not null,
  kcal       numeric default 0,
  carb       numeric default 0,
  protein    numeric default 0,
  fat        numeric default 0,
  created_at timestamptz default now()
);
alter table foods enable row level security;
create policy "own foods" on foods for all using (auth.uid() = user_id);

-- 3. 몸무게 기록 (날짜당 1개)
create table if not exists weight_logs (
  id         bigint primary key generated always as identity,
  user_id    uuid references auth.users not null,
  date       text not null,
  value      numeric not null,
  created_at timestamptz default now(),
  unique (user_id, date)
);
alter table weight_logs enable row level security;
create policy "own weight_logs" on weight_logs for all using (auth.uid() = user_id);

-- 4. 프로필 (유저당 1개)
create table if not exists profiles (
  user_id       uuid primary key references auth.users,
  name          text default '',
  avatar        text default '⚖️',
  height        text default '',
  target_weight text default '',
  target_kcal   text default '2000',
  goal          text default ''
);
alter table profiles enable row level security;
create policy "own profile" on profiles for all using (auth.uid() = user_id);

-- 5. 운동 DB (기본 + 사용자 추가)
create table if not exists exercise_db (
  id         bigint primary key generated always as identity,
  user_id    uuid references auth.users not null,
  name       text not null,
  tip        text default '',
  is_default boolean default false
);
alter table exercise_db enable row level security;
create policy "own exercise_db" on exercise_db for all using (auth.uid() = user_id);

-- 6. 음식 DB (기본 + 사용자 추가)
create table if not exists food_db (
  id         bigint primary key generated always as identity,
  user_id    uuid references auth.users not null,
  name       text not null,
  kcal       numeric default 0,
  carb       numeric default 0,
  protein    numeric default 0,
  fat        numeric default 0,
  tip        text default '',
  is_default boolean default false
);
alter table food_db enable row level security;
create policy "own food_db" on food_db for all using (auth.uid() = user_id);
