CREATE TABLE public.cms_collection_entry_metadata (
  id                      uuid NOT NULL DEFAULT gen_random_uuid(),
  entry_id                uuid NOT NULL UNIQUE,
  title                   text,
  description             text CHECK (char_length(description) <= 160),
  keywords                text[],
  canonical_url           text,
  robots                  text NOT NULL DEFAULT 'index, follow',
  og_title                text,
  og_description          text CHECK (char_length(og_description) <= 200),
  og_image_file_id        uuid,
  og_image_alt            text,
  twitter_card            text NOT NULL DEFAULT 'summary_large_image',
  twitter_title           text,
  twitter_description     text,
  twitter_image_file_id   uuid,
  schema_org              jsonb,
  created_at              timestamp with time zone NOT NULL DEFAULT now(),
  updated_at              timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT cms_collection_entry_metadata_pkey
    PRIMARY KEY (id),
  CONSTRAINT cms_collection_entry_metadata_entry_id_fkey
    FOREIGN KEY (entry_id) REFERENCES public.cms_collection_entries(id) ON DELETE CASCADE,
  CONSTRAINT cms_collection_entry_metadata_og_image_file_id_fkey
    FOREIGN KEY (og_image_file_id) REFERENCES public.files(id) ON DELETE SET NULL,
  CONSTRAINT cms_collection_entry_metadata_twitter_image_file_id_fkey
    FOREIGN KEY (twitter_image_file_id) REFERENCES public.files(id) ON DELETE SET NULL,
  CONSTRAINT cms_collection_entry_metadata_robots_check
    CHECK (robots IN (
      'index, follow',
      'noindex, nofollow',
      'noindex, follow',
      'index, nofollow'
    )),
  CONSTRAINT cms_collection_entry_metadata_twitter_card_check
    CHECK (twitter_card IN ('summary_large_image', 'summary'))
);

CREATE TRIGGER cms_collection_entry_metadata_updated_at
  BEFORE UPDATE ON public.cms_collection_entry_metadata
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX cms_collection_entry_metadata_entry_id_idx
  ON public.cms_collection_entry_metadata (entry_id);

ALTER TABLE public.cms_collection_entry_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant members can read collection entry metadata"
  ON public.cms_collection_entry_metadata FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.cms_collection_entries e
      JOIN public.cms_collections c ON c.id = e.collection_id
      JOIN public.cms_websites w ON w.id = c.website_id
      JOIN public.user_tenants ut ON ut.tenant_id = w.tenant_id
      WHERE e.id = cms_collection_entry_metadata.entry_id
        AND ut.user_id = auth.uid()
    )
  );

CREATE POLICY "tenant members can insert collection entry metadata"
  ON public.cms_collection_entry_metadata FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.cms_collection_entries e
      JOIN public.cms_collections c ON c.id = e.collection_id
      JOIN public.cms_websites w ON w.id = c.website_id
      JOIN public.user_tenants ut ON ut.tenant_id = w.tenant_id
      WHERE e.id = cms_collection_entry_metadata.entry_id
        AND ut.user_id = auth.uid()
    )
  );

CREATE POLICY "tenant members can update collection entry metadata"
  ON public.cms_collection_entry_metadata FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.cms_collection_entries e
      JOIN public.cms_collections c ON c.id = e.collection_id
      JOIN public.cms_websites w ON w.id = c.website_id
      JOIN public.user_tenants ut ON ut.tenant_id = w.tenant_id
      WHERE e.id = cms_collection_entry_metadata.entry_id
        AND ut.user_id = auth.uid()
    )
  );

CREATE POLICY "tenant members can delete collection entry metadata"
  ON public.cms_collection_entry_metadata FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.cms_collection_entries e
      JOIN public.cms_collections c ON c.id = e.collection_id
      JOIN public.cms_websites w ON w.id = c.website_id
      JOIN public.user_tenants ut ON ut.tenant_id = w.tenant_id
      WHERE e.id = cms_collection_entry_metadata.entry_id
        AND ut.user_id = auth.uid()
    )
  );
