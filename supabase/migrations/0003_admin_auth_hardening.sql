create table if not exists admin_login_attempts (
  competition_slug text not null,
  key_hash text not null,
  failed_count integer not null default 0,
  first_failed_at timestamptz not null default now(),
  last_failed_at timestamptz not null default now(),
  blocked_until timestamptz,
  primary key (competition_slug, key_hash)
);

create index if not exists idx_admin_login_attempts_blocked_until
  on admin_login_attempts (blocked_until);
