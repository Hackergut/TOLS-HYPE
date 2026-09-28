create table if not exists chat_messages (
  id         bigserial primary key,
  room       text not null,
  user_id    text not null,
  user_name  text not null,
  vip        text not null default 'Member',
  kind       text not null default 'text',
  body       text not null default '',
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_room_idx on chat_messages (room, id desc);
create index if not exists chat_messages_user_idx on chat_messages (user_id, created_at desc);
