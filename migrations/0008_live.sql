-- Shared live tables. The seed stays in this row until the round is public.

create table if not exists live_rounds (
  game_id   text not null,
  n         integer not null,
  seed      text not null,
  hash      text not null,
  opens_at  bigint not null,
  locks_at  bigint not null,
  starts_at bigint not null,
  reveal_at bigint not null,
  ends_at   bigint not null,
  outcome   text not null,
  settled   boolean not null default false,
  primary key (game_id, n)
);

create table if not exists live_bets (
  id         text primary key,
  game_id    text not null,
  n          integer not null,
  user_id    text not null,
  user_name  text not null,
  currency   text not null,
  amount     numeric(20, 8) not null,
  pick       text not null default '',
  cash_mult  numeric(20, 8),
  payout     numeric(20, 8),
  status     text not null,
  created_at timestamptz not null default now(),
  unique (game_id, n, user_id)
);
create index if not exists live_bets_round_idx on live_bets (game_id, n, created_at);
