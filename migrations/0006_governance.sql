-- Live operator desk: presence, controls, activity feed, admin watchers.

create table if not exists player_presence (
  user_id             text primary key,
  display_name        text,
  email               text,
  status              text not null default 'online',
  current_game        text,
  current_game_title  text,
  last_seen           timestamptz not null default now(),
  connected_at        timestamptz not null default now(),
  ip                  text,
  device              text,
  locale              text,
  session_wagered     numeric(20, 8) not null default 0,
  session_bets        integer not null default 0,
  last_deposit_amount numeric(20, 8),
  last_deposit_currency text,
  last_deposit_method text,
  last_deposit_at     timestamptz
);
create index if not exists player_presence_seen_idx on player_presence (last_seen desc);

create table if not exists player_controls (
  user_id        text primary key,
  blocked        boolean not null default false,
  block_reason   text,
  kyc_status     text not null default 'none',
  wager_limit    numeric(20, 8),
  deposit_limit  numeric(20, 8),
  rtp_override   numeric,
  notes          text,
  session_epoch  integer not null default 0,
  updated_at     timestamptz not null default now(),
  updated_by     text
);

create table if not exists gov_events (
  id         serial primary key,
  user_id    text not null,
  type       text not null,
  title      text not null,
  body       text,
  game_id    text,
  amount     numeric(20, 8),
  currency   text,
  method     text,
  payload    text not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists gov_events_created_idx on gov_events (created_at desc);
create index if not exists gov_events_user_idx on gov_events (user_id, created_at desc);

create table if not exists gov_watchers (
  user_id    text primary key,
  created_at timestamptz not null default now()
);

create table if not exists gov_flags (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);
