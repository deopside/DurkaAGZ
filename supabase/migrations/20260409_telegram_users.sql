create table if not exists telegram_users (
  chat_id text primary key,
  telegram_user_id text,
  username text,
  first_name text,
  last_name text,
  language_code text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists telegram_users_last_seen_at_idx on telegram_users(last_seen_at);
