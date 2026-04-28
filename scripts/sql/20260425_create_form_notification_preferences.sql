-- Add notify_email_address column to existing form_notification_preferences table.

alter table public.form_notification_preferences
  add column if not exists notify_email_address text;
