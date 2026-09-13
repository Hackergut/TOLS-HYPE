create table if not exists sport_bets (
  id          text primary key,
  user_id     text not null,
  currency    text not null,
  stake       double precision not null,
  mode        text not null default 'single',
  price       double precision not null,
  legs        text not null,
  status      text not null default 'pending',
  payout      double precision not null default 0,
  detail      text,
  placed_at   timestamptz not null default now(),
  settled_at  timestamptz
);
create index if not exists sport_bets_user_id_idx on sport_bets (user_id, placed_at desc);
create index if not exists sport_bets_status_idx on sport_bets (status, placed_at);
