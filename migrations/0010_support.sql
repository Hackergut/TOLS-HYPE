-- Support desk: one thread per player, AI first, live agent via governance.

create table if not exists support_threads (
  id              text primary key,
  user_id         text not null unique,
  user_name       text,
  user_email      text,
  status          text not null default 'ai',
  agent_name      text,
  escalate_reason text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists support_messages (
  id         bigserial primary key,
  thread_id  text not null,
  user_id    text not null,
  role       text not null,
  body       text not null,
  created_at timestamptz not null default now()
);
create index if not exists support_messages_thread_idx on support_messages (thread_id, id);
