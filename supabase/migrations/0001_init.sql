create table if not exists competitions (
  id uuid primary key,
  slug text not null unique,
  name text not null,
  subtitle text not null default '',
  status text not null check (status in ('setup', 'live', 'finished')),
  admin_passcode_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists players (
  id uuid primary key,
  competition_id uuid not null references competitions(id) on delete cascade,
  name text not null,
  nickname text not null default '',
  fact text not null default '',
  height text not null default '',
  weight text not null default '',
  vertical text not null default '',
  forty text not null default '',
  bench text not null default '',
  grip text not null default '',
  trash_talk text not null default '',
  sore_loser text not null default '',
  biggest_threat text not null default '',
  weakness text not null default '',
  photo_path text,
  active boolean not null default true,
  sort_order integer not null default 0
);

create table if not exists events (
  id uuid primary key,
  competition_id uuid not null references competitions(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('individual', 'team')),
  order_index integer not null default 0,
  status text not null check (status in ('upcoming', 'live', 'completed'))
);

create table if not exists partner_groups (
  id uuid primary key,
  competition_id uuid not null references competitions(id) on delete cascade,
  group_number integer not null
);

create table if not exists partner_group_members (
  partner_group_id uuid not null references partner_groups(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  slot integer not null default 0,
  primary key (partner_group_id, player_id)
);

create table if not exists results (
  id uuid primary key,
  event_id uuid not null references events(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  placement integer not null check (placement > 0)
);

create unique index if not exists idx_results_event_player
  on results (event_id, player_id);

create index if not exists idx_players_competition_sort
  on players (competition_id, sort_order);

create index if not exists idx_events_competition_order
  on events (competition_id, order_index);
