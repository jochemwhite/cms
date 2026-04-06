begin;

alter table public.cms_schema_sections
add column if not exists type text;

update public.cms_schema_sections
set type = 'default'
where type is null or btrim(type) = '';

alter table public.cms_schema_sections
alter column type set default 'default';

alter table public.cms_schema_sections
alter column type set not null;

commit;
