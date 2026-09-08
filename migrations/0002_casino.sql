-- Play-money wallets, bets, and round state for CryptoVegas.

create table if not exists wallets (
  user_id    text not null,
  currency   text not null,
  balance    numeric(20, 8) not null default 0,
  primary key (user_id, currency)
);

create table if not exists transactions (
  id         serial primary key,
  user_id    text not null,
  type       text not null,
  amount     numeric(20, 8) not null,
  currency   text not null,
  status     text not null default 'completed',
  game_id    text,
  note       text,
  created_at timestamptz not null default now()
);
create index if not exists transactions_user_id_idx on transactions (user_id, created_at desc);

create table if not exists game_rounds (
  id          text primary key,
  user_id     text not null,
  game_id     text not null,
  status      text not null,
  bet_amount  numeric(20, 8) not null,
  currency    text not null,
  payload     text not null default '{}',
  created_at  timestamptz not null default now()
);
create index if not exists game_rounds_user_id_idx on game_rounds (user_id, created_at desc);
