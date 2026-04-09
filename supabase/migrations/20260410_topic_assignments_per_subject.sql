-- One topic assignment per Telegram user per subject (not one global row per user).

alter table topic_assignments
  drop constraint if exists topic_assignments_telegram_user_id_key;

alter table topic_assignments
  add constraint topic_assignments_telegram_user_subject_key unique (telegram_user_id, subject);
