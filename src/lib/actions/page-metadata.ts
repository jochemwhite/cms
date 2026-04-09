"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/supabaseServerClient";
import type { Database } from "@/types/supabase";
import type { MetadataFile, PageMetadata, PageMetadataRow, PageMetadataUpdate } from "@/types";

const DESCRIPTION_MAX_LENGTH = 160;

function normalizeOptionalText(value: string | null | undefined) {
  if (typeof value !== "string") {
    return value ?? null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function resolveMetadataFiles(
  metadata: PageMetadataRow,
  files: MetadataFile[],
): Pick<PageMetadata, "og_image_file" | "twitter_image_file"> {
  const fileById = new Map(files.map((file) => [file.id, file]));

  return {
    og_image_file: metadata.og_image_file_id ? fileById.get(metadata.og_image_file_id) ?? null : null,
    twitter_image_file: metadata.twitter_image_file_id
      ? fileById.get(metadata.twitter_image_file_id) ?? null
      : null,
  };
}

async function hydrateMetadata(metadata: PageMetadataRow): Promise<PageMetadata> {
  const supabase = await createClient();
  const fileIds = [metadata.og_image_file_id, metadata.twitter_image_file_id].filter(
    (fileId): fileId is string => Boolean(fileId),
  );

  if (fileIds.length === 0) {
    return {
      ...metadata,
      og_image_file: null,
      twitter_image_file: null,
    };
  }

  const { data: files, error } = await supabase
    .from("files")
    .select("id, storage_path, filename, alt_text, mime_type")
    .in("id", fileIds);

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...metadata,
    ...resolveMetadataFiles(metadata, files ?? []),
  };
}

export async function getPageMetadata(pageId: string): Promise<PageMetadata | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cms_page_metadata")
    .select("*")
    .eq("page_id", pageId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return hydrateMetadata(data);
}

export async function upsertPageMetadata(pageId: string, data: PageMetadataUpdate): Promise<PageMetadata> {
  if (typeof data.description === "string" && data.description.length > DESCRIPTION_MAX_LENGTH) {
    throw new Error(`Description must be ${DESCRIPTION_MAX_LENGTH} characters or less.`);
  }

  if (typeof data.canonical_url === "string" && data.canonical_url.trim().length > 0) {
    try {
      new URL(data.canonical_url);
    } catch {
      throw new Error("Canonical URL must be a valid URL.");
    }
  }

  const supabase = await createClient();
  const { data: existingMetadata, error: existingMetadataError } = await supabase
    .from("cms_page_metadata")
    .select("id")
    .eq("page_id", pageId)
    .maybeSingle();

  if (existingMetadataError) {
    throw new Error(existingMetadataError.message);
  }

  const payload: Database["public"]["Tables"]["cms_page_metadata"]["Update"] &
    Pick<Database["public"]["Tables"]["cms_page_metadata"]["Insert"], "page_id"> = {
    page_id: pageId,
    updated_at: new Date().toISOString(),
  };

  if ("title" in data) payload.title = normalizeOptionalText(data.title);
  if ("description" in data) payload.description = normalizeOptionalText(data.description);
  if ("canonical_url" in data) payload.canonical_url = normalizeOptionalText(data.canonical_url);
  if ("robots" in data) payload.robots = data.robots;
  if ("og_title" in data) payload.og_title = normalizeOptionalText(data.og_title);
  if ("og_description" in data) payload.og_description = normalizeOptionalText(data.og_description);
  if ("og_image_file_id" in data) payload.og_image_file_id = data.og_image_file_id ?? null;
  if ("og_image_alt" in data) payload.og_image_alt = normalizeOptionalText(data.og_image_alt);
  if ("twitter_card" in data) payload.twitter_card = data.twitter_card;
  if ("twitter_title" in data) payload.twitter_title = normalizeOptionalText(data.twitter_title);
  if ("twitter_description" in data) {
    payload.twitter_description = normalizeOptionalText(data.twitter_description);
  }
  if ("twitter_image_file_id" in data) {
    payload.twitter_image_file_id = data.twitter_image_file_id ?? null;
  }
  if ("keywords" in data) {
    const keywords = Array.isArray(data.keywords)
      ? data.keywords
          .filter((keyword): keyword is string => typeof keyword === "string")
          .map((keyword) => keyword.trim())
          .filter((keyword) => keyword.length > 0)
      : null;

    payload.keywords = keywords && keywords.length > 0 ? keywords : null;
  }
  if ("schema_org" in data) payload.schema_org = data.schema_org ?? null;

  const query = existingMetadata
    ? supabase.from("cms_page_metadata").update(payload).eq("page_id", pageId)
    : supabase.from("cms_page_metadata").insert(payload);

  const { data: savedMetadata, error } = await query.select("*").single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/pages/${pageId}`);

  return hydrateMetadata(savedMetadata);
}
