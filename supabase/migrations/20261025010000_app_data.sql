-- Boxing Flow: everything the app remembers (calendar plan, session log, goals, camp, widget layout, film study, heart rate settings, quiz progress, coach choice...).
-- The app keeps each of these as a named piece of text on the device; this table holds the same pieces in the person's account, so any device they sign in on gets them.
-- deleted marks a piece that was cleared on a device, so clearing it on one device clears it on the others.
create table public.app_data (
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  key        text not null,
  value      text,
  deleted    boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.app_data enable row level security;
create policy "own app data" on public.app_data for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.app_data to authenticated;
