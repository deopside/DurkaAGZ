-- 1) Ensure deadline column type is timestamptz (UTC-aware).
alter table homework
  alter column deadline_at type timestamptz
  using deadline_at::timestamptz;

-- 2) Backfill deadline_at from legacy date/hours/minutes as Moscow time.
-- Converts Europe/Moscow local timestamp to UTC timestamptz.
update homework
set deadline_at = (
  (
    to_date(date, 'DD.MM.YY')
    + make_interval(hours => coalesce(nullif(hours, '')::int, 10))
    + make_interval(mins => coalesce(nullif(minutes, '')::int, 0))
  ) at time zone 'Europe/Moscow'
)
where deadline_at is null;

-- 3) Keep schedule schema naming aligned with current API.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_name = 'schedule_entries'
      and column_name = 'subjectName'
  ) then
    alter table schedule_entries rename column "subjectName" to subjectname;
  end if;
end $$;
