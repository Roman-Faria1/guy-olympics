alter table if exists competitions enable row level security;
alter table if exists players enable row level security;
alter table if exists events enable row level security;
alter table if exists partner_groups enable row level security;
alter table if exists partner_group_members enable row level security;
alter table if exists results enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'competitions' and policyname = 'public read competitions'
  ) then
    create policy "public read competitions" on competitions for select to anon, authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'players' and policyname = 'public read players'
  ) then
    create policy "public read players" on players for select to anon, authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'events' and policyname = 'public read events'
  ) then
    create policy "public read events" on events for select to anon, authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'partner_groups' and policyname = 'public read partner_groups'
  ) then
    create policy "public read partner_groups" on partner_groups for select to anon, authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'partner_group_members' and policyname = 'public read partner_group_members'
  ) then
    create policy "public read partner_group_members" on partner_group_members for select to anon, authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'results' and policyname = 'public read results'
  ) then
    create policy "public read results" on results for select to anon, authenticated using (true);
  end if;
end $$;

do $$
begin
  begin
    alter publication supabase_realtime add table competitions;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table players;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table events;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table partner_groups;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table partner_group_members;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table results;
  exception when duplicate_object then null;
  end;
end $$;
