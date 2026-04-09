create table if not exists homework (
  subject text primary key,
  date text not null,
  hours text not null default '10',
  minutes text not null default '00',
  deadline_at timestamptz
);

create table if not exists homework_topics (
  id bigint generated always as identity primary key,
  subject text not null references homework(subject) on delete cascade,
  topic_id int not null,
  text text not null,
  unique (subject, topic_id)
);

create table if not exists topic_assignments (
  id bigint generated always as identity primary key,
  telegram_user_id text not null,
  subject text not null references homework(subject) on delete cascade,
  topic_id int not null,
  assigned_at timestamptz not null default now(),
  unique (telegram_user_id, subject),
  unique (subject, topic_id)
);

create table if not exists schedule_entries (
  id uuid primary key default gen_random_uuid(),
  date_key text not null,
  pair_number int not null,
  subjectname text not null,
  type text not null,
  number text not null,
  room text not null,
  teacher text not null
);

