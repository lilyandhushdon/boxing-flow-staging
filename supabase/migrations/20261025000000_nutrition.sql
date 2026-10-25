-- Boxing Flow: nutrition. Every table belongs to one signed-in person, and row-level security means a person can only ever see or change their own rows.

create table public.nutrition_profile (
  user_id        uuid primary key default auth.uid() references auth.users on delete cascade,
  sex            text check (sex in ('male', 'female')),
  birth_year     int,
  height_cm      numeric,
  weight_kg      numeric,
  activity       numeric not null default 1.55,
  goal           text not null default 'maintain' check (goal in ('lose', 'maintain', 'gain')),
  rate_kg_week   numeric not null default 0,
  kcal_target    int,
  protein_g      int,
  carbs_g        int,
  fat_g          int,
  manual_targets boolean not null default false,
  energy_unit    text not null default 'kcal' check (energy_unit in ('kcal', 'kj')),
  updated_at     timestamptz not null default now()
);

-- one row per food eaten. per100 keeps the nutrients per 100 g so the amount can be changed later and the totals worked out again.
create table public.food_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  day        date not null,
  meal       text not null check (meal in ('breakfast', 'lunch', 'dinner', 'snacks')),
  name       text not null,
  brand      text,
  source     text not null check (source in ('usda', 'off', 'custom', 'quick')),
  source_id  text,
  amount     numeric not null,
  unit_label text,
  grams      numeric,
  per100     jsonb,
  kcal       numeric not null default 0,
  protein    numeric not null default 0,
  carbs      numeric not null default 0,
  fat        numeric not null default 0,
  fibre      numeric,
  sugar      numeric,
  sodium_mg  numeric,
  created_at timestamptz not null default now()
);
create index food_entries_user_day on public.food_entries (user_id, day);

-- foods a person made themselves
create table public.custom_foods (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users on delete cascade,
  name          text not null,
  brand         text,
  per100        jsonb not null,
  serving_g     numeric,
  serving_label text,
  created_at    timestamptz not null default now()
);
create index custom_foods_user on public.custom_foods (user_id);

alter table public.nutrition_profile enable row level security;
alter table public.food_entries      enable row level security;
alter table public.custom_foods      enable row level security;

create policy "own profile"      on public.nutrition_profile for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own food entries" on public.food_entries      for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own custom foods" on public.custom_foods      for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.nutrition_profile, public.food_entries, public.custom_foods to authenticated;
