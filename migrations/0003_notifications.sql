create table if not exists notifications (
  id         serial primary key,
  user_id    text not null,
  kind       text not null,
  title      text not null,
  body       text not null,
  href       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_id_idx on notifications (user_id, created_at desc);

create table if not exists push_subscriptions (
  endpoint   text primary key,
  user_id    text not null,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_id_idx on push_subscriptions (user_id);

create table if not exists notification_prefs (
  user_id text primary key,
  wins    boolean not null default true,
  promos  boolean not null default true,
  race    boolean not null default true,
  system  boolean not null default true
);
