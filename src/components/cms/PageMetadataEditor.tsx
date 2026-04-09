"use client";

import { MetadataEditor } from "@/components/cms/MetadataEditor";
import { getPageMetadata, upsertPageMetadata } from "@/lib/actions/page-metadata";

type PageMetadataEditorProps = {
  pageId: string;
  page: {
    name: string;
    website: {
      domain: string;
    };
  };
};

export function PageMetadataEditor({ pageId, page }: PageMetadataEditorProps) {
  return (
    <MetadataEditor
      entityId={pageId}
      entityLabel="Page"
      page={page}
      loadMetadata={getPageMetadata}
      saveMetadata={upsertPageMetadata}
    />
  );
}
