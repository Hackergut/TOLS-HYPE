create table if not exists fair_seeds (
  user_id     text primary key,
  server_seed text not null,
  server_hash text not null,
  client_seed text not null,
  nonce       integer not null default 0
);
