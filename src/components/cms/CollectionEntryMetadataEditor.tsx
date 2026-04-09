"use client";

import { MetadataEditor } from "@/components/cms/MetadataEditor";
import { getCollectionEntryMetadata, upsertCollectionEntryMetadata } from "@/lib/actions/collection-entry-metadata";

type CollectionEntryMetadataEditorProps = {
  entryId: string;
  page: {
    name: string;
    website: {
      domain: string;
    };
  };
};

export function CollectionEntryMetadataEditor({
  entryId,
  page,
}: CollectionEntryMetadataEditorProps) {
  return (
    <MetadataEditor
      entityId={entryId}
      entityLabel="Entry"
      page={page}
      loadMetadata={getCollectionEntryMetadata}
      saveMetadata={upsertCollectionEntryMetadata}
    />
  );
}
