create table if not exists bet_rounds (
  id          text primary key,
  user_id     text not null,
  game_id     text not null,
  title       text not null,
  kind        text not null,
  win         boolean not null,
  label       text not null,
  stake       double precision not null default 0,
  payout      double precision not null default 0,
  multiplier  double precision not null default 0,
  currency    text not null default 'USDT',
  server_hash text,
  client_seed text,
  nonce       integer,
  view        text,
  created_at  timestamptz not null default now()
);
create index if not exists bet_rounds_user_id_idx on bet_rounds (user_id, created_at desc);
