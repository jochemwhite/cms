begin;

alter table public.cms_content_sections
add column if not exists type text;

update public.cms_content_sections cs
set type = coalesce(nullif(btrim(ss.type), ''), 'default')
from public.cms_schema_sections ss
where cs.schema_section_id = ss.id
  and (cs.type is null or btrim(cs.type) = '');

update public.cms_content_sections
set type = 'default'
where type is null or btrim(type) = '';

alter table public.cms_content_sections
alter column type set default 'default';

alter table public.cms_content_sections
alter column type set not null;

commit;
