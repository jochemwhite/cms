-- Contact form as a page schema field type.
-- Run manually against your Postgres (e.g. Supabase SQL editor). Safe to re-run where noted.
--
-- 1) Adds enum label public.field_type: contact_form
-- 2) Adds cms_schema_fields.form_id -> cms_forms(id)
-- 3) Extends build_schema_fields_with_content_section JSON (form_id on each field)
-- 4) Extends update_schema_structure_tx to read payload formId (camelCase) like collectionId

begin;

-- Enum: idempotent add (avoids error if label already exists)
do $enum$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'field_type'
      and e.enumlabel = 'contact_form'
  ) then
    alter type public.field_type add value 'contact_form';
  end if;
end
$enum$;

alter table public.cms_schema_fields
  add column if not exists form_id uuid;

do $fk$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class rel on rel.oid = c.conrelid
    join pg_namespace n on n.oid = rel.relnamespace
    where n.nspname = 'public'
      and rel.relname = 'cms_schema_fields'
      and c.conname = 'cms_schema_fields_form_id_fkey'
  ) then
    alter table public.cms_schema_fields
      add constraint cms_schema_fields_form_id_fkey
      foreign key (form_id) references public.cms_forms (id) on delete set null;
  end if;
end
$fk$;

create index if not exists cms_schema_fields_form_id_idx
  on public.cms_schema_fields (form_id)
  where form_id is not null;

-- get_content depends on this helper; include form_id next to collection_id
create or replace function public.build_schema_fields_with_content_section(
  schema_section_id_param uuid,
  content_section_id_param uuid,
  parent_field_id_param uuid default null
)
returns jsonb
language plpgsql
stable
set search_path = public
as $function$
declare
  result jsonb;
begin
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', sf.id,
        'name', sf.name,
        'description', '',
        'type', sf.type,
        'order', coalesce(sf."order", 0),
        'required', sf.required,
        'created_at', sf.created_at,
        'updated_at', sf.updated_at,
        'validation', coalesce(sf.validation, ''),
        'default_value', coalesce(sf.default_value, ''),
        'parent_field_id', sf.parent_field_id,
        'collection_id', sf.collection_id,
        'form_id', sf.form_id,
        'settings', sf.settings,
        'content', case when cf.id is null then null else jsonb_build_object('value', cf.content) end,
        'content_field_id', cf.id,
        'fields', case
          when sf.type = 'section' then public.build_schema_fields_with_content_section(
            schema_section_id_param,
            content_section_id_param,
            sf.id
          )
          else '[]'::jsonb
        end
      )
      order by coalesce(sf."order", 0)
    ),
    '[]'::jsonb
  )
  into result
  from public.cms_schema_fields sf
  left join public.cms_content_fields cf
    on cf.schema_field_id = sf.id
   and cf.section_id = content_section_id_param
  where sf.schema_section_id = schema_section_id_param
    and sf.parent_field_id is not distinct from parent_field_id_param;

  return result;
end;
$function$;

-- Payload fields include optional "formId" (uuid string); omit or null clears form_id
create or replace function public.update_schema_structure_tx(
  schema_id_param uuid,
  tenant_id_param uuid,
  payload_param jsonb
)
returns void
language plpgsql
as $function$
declare
  schema_exists boolean;
  schema_name text;
  schema_description text;
  schema_template boolean;
begin
  select exists (
    select 1
    from public.cms_schemas s
    where s.id = schema_id_param
      and s.tenant_id = tenant_id_param
  )
  into schema_exists;

  if not schema_exists then
    raise exception 'Schema not found or access denied.';
  end if;

  schema_name := trim(coalesce(payload_param -> 'schema' ->> 'name', ''));
  if schema_name = '' then
    raise exception 'Schema name is required.';
  end if;

  schema_description := payload_param -> 'schema' ->> 'description';
  schema_template := coalesce((payload_param -> 'schema' ->> 'template')::boolean, false);

  update public.cms_schemas
  set
    name = schema_name,
    description = schema_description,
    template = schema_template
  where id = schema_id_param
    and tenant_id = tenant_id_param;

  if exists (
    with submitted_sections as (
      select (value ->> 'id')::uuid as id
      from jsonb_array_elements(coalesce(payload_param -> 'sections', '[]'::jsonb))
    )
    select 1
    from submitted_sections ss
    join public.cms_schema_sections s on s.id = ss.id
    where s.schema_id <> schema_id_param
  ) then
    raise exception 'One or more section IDs belong to a different schema.';
  end if;

  if exists (
    with submitted_fields as (
      select (value ->> 'id')::uuid as id
      from jsonb_array_elements(coalesce(payload_param -> 'fields', '[]'::jsonb))
    )
    select 1
    from submitted_fields sf
    join public.cms_schema_fields f on f.id = sf.id
    join public.cms_schema_sections s on s.id = f.schema_section_id
    where s.schema_id <> schema_id_param
  ) then
    raise exception 'One or more field IDs belong to a different schema.';
  end if;

  delete from public.cms_schema_fields f
  where f.schema_section_id in (
    select s.id
    from public.cms_schema_sections s
    where s.schema_id = schema_id_param
  )
  and not exists (
    select 1
    from jsonb_array_elements(coalesce(payload_param -> 'fields', '[]'::jsonb)) fld
    where (fld ->> 'id')::uuid = f.id
  );

  with payload_sections as (
    select
      (value ->> 'id')::uuid as id,
      (value ->> 'order')::integer as order_num,
      value ->> 'name' as name,
      value ->> 'description' as description,
      coalesce(nullif(trim(value ->> 'type'), ''), 'default') as type
    from jsonb_array_elements(coalesce(payload_param -> 'sections', '[]'::jsonb))
  )
  update public.cms_schema_sections s
  set
    "order" = ps.order_num,
    name = ps.name,
    description = ps.description,
    type = ps.type
  from payload_sections ps
  where s.id = ps.id
    and s.schema_id = schema_id_param;

  with payload_sections as (
    select
      (value ->> 'id')::uuid as id,
      (value ->> 'order')::integer as order_num,
      value ->> 'name' as name,
      value ->> 'description' as description,
      coalesce(nullif(trim(value ->> 'type'), ''), 'default') as type
    from jsonb_array_elements(coalesce(payload_param -> 'sections', '[]'::jsonb))
  )
  insert into public.cms_schema_sections (
    id,
    schema_id,
    "order",
    name,
    description,
    type
  )
  select
    ps.id,
    schema_id_param,
    ps.order_num,
    ps.name,
    ps.description,
    ps.type
  from payload_sections ps
  where not exists (
    select 1
    from public.cms_schema_sections s
    where s.id = ps.id
  );

  update public.cms_content_sections cs
  set
    name = s.name,
    description = s.description,
    type = coalesce(nullif(trim(s.type), ''), 'default'),
    "order" = coalesce(s."order", 0)
  from public.cms_schema_sections s
  where cs.schema_section_id = s.id
    and s.schema_id = schema_id_param;

  with payload_fields as (
    select
      (value ->> 'id')::uuid as id,
      (value ->> 'order')::integer as order_num,
      (value ->> 'schemaSectionId')::uuid as schema_section_id,
      nullif(value ->> 'parentFieldId', '')::uuid as parent_field_id,
      value ->> 'name' as name,
      value ->> 'fieldKey' as field_key,
      (value ->> 'type')::public.field_type as type,
      coalesce((value ->> 'required')::boolean, false) as required,
      value ->> 'defaultValue' as default_value,
      value ->> 'validation' as validation,
      value -> 'settings' as settings,
      nullif(value ->> 'collectionId', '')::uuid as collection_id,
      nullif(value ->> 'formId', '')::uuid as form_id
    from jsonb_array_elements(coalesce(payload_param -> 'fields', '[]'::jsonb))
  )
  update public.cms_schema_fields f
  set
    name = pf.name,
    field_key = pf.field_key,
    type = pf.type,
    required = pf.required,
    default_value = pf.default_value,
    validation = pf.validation,
    settings = pf.settings,
    collection_id = pf.collection_id,
    form_id = pf.form_id,
    "order" = pf.order_num,
    parent_field_id = pf.parent_field_id,
    schema_section_id = pf.schema_section_id
  from payload_fields pf
  join public.cms_schema_sections s on s.id = pf.schema_section_id
  where f.id = pf.id
    and s.schema_id = schema_id_param;

  with payload_fields as (
    select
      (value ->> 'id')::uuid as id,
      (value ->> 'order')::integer as order_num,
      (value ->> 'schemaSectionId')::uuid as schema_section_id,
      nullif(value ->> 'parentFieldId', '')::uuid as parent_field_id,
      value ->> 'name' as name,
      value ->> 'fieldKey' as field_key,
      (value ->> 'type')::public.field_type as type,
      coalesce((value ->> 'required')::boolean, false) as required,
      value ->> 'defaultValue' as default_value,
      value ->> 'validation' as validation,
      value -> 'settings' as settings,
      nullif(value ->> 'collectionId', '')::uuid as collection_id,
      nullif(value ->> 'formId', '')::uuid as form_id
    from jsonb_array_elements(coalesce(payload_param -> 'fields', '[]'::jsonb))
  )
  insert into public.cms_schema_fields (
    id,
    name,
    field_key,
    type,
    required,
    default_value,
    validation,
    settings,
    collection_id,
    form_id,
    "order",
    parent_field_id,
    schema_section_id
  )
  select
    pf.id,
    pf.name,
    pf.field_key,
    pf.type,
    pf.required,
    pf.default_value,
    pf.validation,
    pf.settings,
    pf.collection_id,
    pf.form_id,
    pf.order_num,
    pf.parent_field_id,
    pf.schema_section_id
  from payload_fields pf
  join public.cms_schema_sections s on s.id = pf.schema_section_id
  where s.schema_id = schema_id_param
    and not exists (
      select 1
      from public.cms_schema_fields f
      where f.id = pf.id
    );

  delete from public.cms_schema_sections s
  where s.schema_id = schema_id_param
    and not exists (
      select 1
      from jsonb_array_elements(coalesce(payload_param -> 'sections', '[]'::jsonb)) sec
      where (sec ->> 'id')::uuid = s.id
    );
end;
$function$;

commit;
