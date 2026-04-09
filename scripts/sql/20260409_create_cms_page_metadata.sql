CREATE TABLE public.cms_page_metadata (
  id                      uuid NOT NULL DEFAULT gen_random_uuid(),
  page_id                 uuid NOT NULL UNIQUE,
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

  CONSTRAINT cms_page_metadata_pkey
    PRIMARY KEY (id),
  CONSTRAINT cms_page_metadata_page_id_fkey
    FOREIGN KEY (page_id) REFERENCES public.cms_pages(id) ON DELETE CASCADE,
  CONSTRAINT cms_page_metadata_og_image_file_id_fkey
    FOREIGN KEY (og_image_file_id) REFERENCES public.files(id) ON DELETE SET NULL,
  CONSTRAINT cms_page_metadata_twitter_image_file_id_fkey
    FOREIGN KEY (twitter_image_file_id) REFERENCES public.files(id) ON DELETE SET NULL,
  CONSTRAINT cms_page_metadata_robots_check
    CHECK (robots IN (
      'index, follow',
      'noindex, nofollow',
      'noindex, follow',
      'index, nofollow'
    )),
  CONSTRAINT cms_page_metadata_twitter_card_check
    CHECK (twitter_card IN ('summary_large_image', 'summary'))
);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER cms_page_metadata_updated_at
  BEFORE UPDATE ON public.cms_page_metadata
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Index for fast page lookups
CREATE INDEX cms_page_metadata_page_id_idx
  ON public.cms_page_metadata (page_id);

-- RLS: mirror the tenant isolation from cms_pages
ALTER TABLE public.cms_page_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant members can read page metadata"
  ON public.cms_page_metadata FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cms_pages p
      JOIN public.user_tenants ut ON ut.tenant_id = p.tenant_id
      WHERE p.id = cms_page_metadata.page_id
        AND ut.user_id = auth.uid()
    )
  );

CREATE POLICY "tenant members can insert page metadata"
  ON public.cms_page_metadata FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cms_pages p
      JOIN public.user_tenants ut ON ut.tenant_id = p.tenant_id
      WHERE p.id = cms_page_metadata.page_id
        AND ut.user_id = auth.uid()
    )
  );

CREATE POLICY "tenant members can update page metadata"
  ON public.cms_page_metadata FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.cms_pages p
      JOIN public.user_tenants ut ON ut.tenant_id = p.tenant_id
      WHERE p.id = cms_page_metadata.page_id
        AND ut.user_id = auth.uid()
    )
  );

CREATE POLICY "tenant members can delete page metadata"
  ON public.cms_page_metadata FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.cms_pages p
      JOIN public.user_tenants ut ON ut.tenant_id = p.tenant_id
      WHERE p.id = cms_page_metadata.page_id
        AND ut.user_id = auth.uid()
    )
  );
