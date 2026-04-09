"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, HelpCircle, Image as ImageIcon, Plus, RefreshCw, RotateCcw, Save, Tag, X } from "lucide-react";
import { toast } from "sonner";

import { MediaImagePickerDialog, type SelectedMediaImage } from "@/components/cms/content-editor/components/media_image_picker_dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { MetadataFile, PageMetadataUpdate } from "@/types";

type MetadataRecord = {
  title: string | null;
  description: string | null;
  canonical_url: string | null;
  robots: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_file_id: string | null;
  og_image_alt: string | null;
  twitter_card: string | null;
  twitter_title: string | null;
  twitter_description: string | null;
  twitter_image_file_id: string | null;
  keywords: string[] | null;
  schema_org: unknown | null;
  og_image_file?: MetadataFile | null;
  twitter_image_file?: MetadataFile | null;
};

type MetadataEditorProps = {
  entityId: string;
  entityLabel: string;
  page: {
    name: string;
    website: {
      domain: string;
    };
  };
  loadMetadata: (entityId: string) => Promise<MetadataRecord | null>;
  saveMetadata: (entityId: string, data: PageMetadataUpdate) => Promise<MetadataRecord>;
};

type EditorImage = SelectedMediaImage & {
  storagePath?: string;
};

type EditorState = {
  title: string;
  description: string;
  canonical_url: string;
  robots: RobotsOption;
  og_title: string;
  og_description: string;
  og_image_file_id: string | null;
  og_image_alt: string;
  twitter_card: TwitterCardOption;
  twitter_title: string;
  twitter_description: string;
  twitter_image_file_id: string | null;
  keywords: string[];
  schema_org: string;
};

type EditorErrors = {
  canonical_url?: string;
  description?: string;
  jsonLd?: string;
};

type RobotsOption =
  | "index, follow"
  | "noindex, nofollow"
  | "noindex, follow"
  | "index, nofollow";

type TwitterCardOption = "summary_large_image" | "summary";

const DESCRIPTION_LIMIT = 160;
const OG_DESCRIPTION_LIMIT = 200;
const DEFAULT_ROBOTS: RobotsOption = "index, follow";
const DEFAULT_TWITTER_CARD: TwitterCardOption = "summary_large_image";

function getPublicBaseUrl() {
  const rawBaseUrl =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.trim() ||
    process.env.NEXT_PUBLIC_R2_CDN_URL?.trim() ||
    "";

  if (!rawBaseUrl) {
    return "";
  }

  const normalizedBaseUrl = rawBaseUrl.replace(/\/+$/, "");
  return /^https?:\/\//i.test(normalizedBaseUrl) ? normalizedBaseUrl : `https://${normalizedBaseUrl}`;
}

function buildPublicAssetUrl(storagePath: string) {
  const baseUrl = getPublicBaseUrl();
  if (!baseUrl) {
    return storagePath;
  }

  return `${baseUrl}/${storagePath.replace(/^\/+/, "")}`;
}

function toImage(file: MetadataFile | null | undefined): EditorImage | null {
  if (!file) {
    return null;
  }

  return {
    id: file.id,
    name: file.filename,
    url: buildPublicAssetUrl(file.storage_path),
    size: 0,
    altText: file.alt_text ?? undefined,
    storagePath: file.storage_path,
  };
}

function createInitialState(metadata: MetadataRecord | null): EditorState {
  return {
    title: metadata?.title ?? "",
    description: metadata?.description ?? "",
    canonical_url: metadata?.canonical_url ?? "",
    robots: (metadata?.robots as RobotsOption | undefined) ?? DEFAULT_ROBOTS,
    og_title: metadata?.og_title ?? "",
    og_description: metadata?.og_description ?? "",
    og_image_file_id: metadata?.og_image_file_id ?? null,
    og_image_alt: metadata?.og_image_alt ?? "",
    twitter_card: (metadata?.twitter_card as TwitterCardOption | undefined) ?? DEFAULT_TWITTER_CARD,
    twitter_title: metadata?.twitter_title ?? "",
    twitter_description: metadata?.twitter_description ?? "",
    twitter_image_file_id: metadata?.twitter_image_file_id ?? null,
    keywords: metadata?.keywords ?? [],
    schema_org: metadata?.schema_org ? JSON.stringify(metadata.schema_org, null, 2) : "",
  };
}

function buildPayload(state: EditorState): { payload: PageMetadataUpdate | null; errors: EditorErrors } {
  const errors: EditorErrors = {};

  if (state.description.length > DESCRIPTION_LIMIT) {
    errors.description = `Description must be ${DESCRIPTION_LIMIT} characters or less.`;
  }

  if (state.canonical_url.trim().length > 0) {
    try {
      new URL(state.canonical_url);
    } catch {
      errors.canonical_url = "Enter a valid canonical URL.";
    }
  }

  let schemaOrg: PageMetadataUpdate["schema_org"] = null;
  if (state.schema_org.trim().length > 0) {
    try {
      schemaOrg = JSON.parse(state.schema_org) as PageMetadataUpdate["schema_org"];
    } catch {
      errors.jsonLd = "Enter valid JSON before saving.";
    }
  }

  if (Object.keys(errors).length > 0) {
    return { payload: null, errors };
  }

  return {
    payload: {
      title: state.title,
      description: state.description,
      canonical_url: state.canonical_url,
      robots: state.robots,
      og_title: state.og_title,
      og_description: state.og_description,
      og_image_file_id: state.og_image_file_id,
      og_image_alt: state.og_image_alt,
      twitter_card: state.twitter_card,
      twitter_title: state.twitter_title,
      twitter_description: state.twitter_description,
      twitter_image_file_id: state.twitter_image_file_id,
      keywords: state.keywords,
      schema_org: schemaOrg,
    },
    errors,
  };
}

function normalizeForComparison(payload: PageMetadataUpdate | null) {
  if (!payload) {
    return null;
  }

  return JSON.stringify(payload);
}

function MetadataLabel({
  htmlFor,
  label,
  description,
}: {
  htmlFor?: string;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex h-4 w-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            aria-label={`${label} help`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent sideOffset={6}>{description}</TooltipContent>
      </Tooltip>
    </div>
  );
}

function MetadataImageField({
  label,
  image,
  storagePath,
  onPick,
  onClear,
}: {
  label: string;
  image: EditorImage | null;
  storagePath?: string;
  onPick: () => void;
  onClear: () => void;
}) {
  const imageUrl = storagePath ? buildPublicAssetUrl(storagePath) : "No image selected";

  return (
    <Field>
      <MetadataLabel
        label={label}
        description="Choose an image from the media library. This image is used in social link previews."
      />
      <div className="rounded-xl border bg-muted/20 p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="relative flex h-[63px] w-[120px] shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
            {image ? (
              <Image
                src={image.url}
                alt={image.altText || image.name}
                fill
                sizes="120px"
                className="object-cover"
              />
            ) : (
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onPick}>
                {image ? "Change image" : "Choose image"}
              </Button>
              {image ? (
                <Button type="button" variant="ghost" size="sm" onClick={onClear}>
                  Clear
                </Button>
              ) : null}
            </div>

            <p className="text-xs text-muted-foreground">{imageUrl}</p>
          </div>
        </div>
      </div>
    </Field>
  );
}

export function MetadataEditor({
  entityId,
  entityLabel,
  page,
  loadMetadata,
  saveMetadata,
}: MetadataEditorProps) {
  const [state, setState] = useState<EditorState>(() => createInitialState(null));
  const [errors, setErrors] = useState<EditorErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [ogImage, setOgImage] = useState<EditorImage | null>(null);
  const [twitterImage, setTwitterImage] = useState<EditorImage | null>(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [isOgPickerOpen, setIsOgPickerOpen] = useState(false);
  const [isTwitterPickerOpen, setIsTwitterPickerOpen] = useState(false);
  const lastSavedRef = useRef<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function load() {
      setIsLoading(true);

      try {
        const metadata = await loadMetadata(entityId);
        if (!isActive) {
          return;
        }

        const nextState = createInitialState(metadata);
        setState(nextState);
        setOgImage(toImage(metadata?.og_image_file));
        setTwitterImage(toImage(metadata?.twitter_image_file));
        setErrors({});
        lastSavedRef.current = normalizeForComparison(buildPayload(nextState).payload);
      } catch (error) {
        console.error(`Failed to load ${entityLabel.toLowerCase()} metadata`, error);
        toast.error(`Failed to load ${entityLabel.toLowerCase()} metadata`);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      isActive = false;
    };
  }, [entityId, entityLabel, loadMetadata]);

  const ogPreviewTitle = useMemo(
    () => state.og_title.trim() || state.title.trim() || page.name,
    [page.name, state.og_title, state.title],
  );
  const ogPreviewDescription = useMemo(
    () => state.og_description.trim() || state.description.trim(),
    [state.description, state.og_description],
  );
  const ogAltWarning = Boolean(state.og_image_file_id && state.og_image_alt.trim().length === 0);
  const currentPayload = useMemo(() => buildPayload(state).payload, [state]);
  const hasUnsavedChanges = normalizeForComparison(currentPayload) !== lastSavedRef.current;

  async function handleSave() {
    const { payload, errors: nextErrors } = buildPayload(state);
    setErrors(nextErrors);

    if (!payload) {
      return;
    }

    if (normalizeForComparison(payload) === lastSavedRef.current) {
      return;
    }

    setIsSaving(true);
    try {
      const savedMetadata = await saveMetadata(entityId, payload);
      const savedState = createInitialState(savedMetadata);

      setState(savedState);
      setOgImage(toImage(savedMetadata.og_image_file));
      setTwitterImage(toImage(savedMetadata.twitter_image_file));
      setErrors({});
      lastSavedRef.current = normalizeForComparison(buildPayload(savedState).payload);
      toast.success("Saved", { duration: 1200 });
    } catch (error) {
      console.error(`Failed to save ${entityLabel.toLowerCase()} metadata`, error);
      toast.error(error instanceof Error ? error.message : `Failed to save ${entityLabel.toLowerCase()} metadata`);
    } finally {
      setIsSaving(false);
    }
  }

  function updateState<K extends keyof EditorState>(key: K, value: EditorState[K]) {
    setState((currentState) => ({ ...currentState, [key]: value }));
  }

  function validateCanonicalUrl(value: string) {
    if (value.trim().length === 0) {
      setErrors((currentErrors) => ({ ...currentErrors, canonical_url: undefined }));
      return;
    }

    try {
      new URL(value);
      setErrors((currentErrors) => ({ ...currentErrors, canonical_url: undefined }));
    } catch {
      setErrors((currentErrors) => ({
        ...currentErrors,
        canonical_url: "Enter a valid canonical URL.",
      }));
    }
  }

  function validateJsonLd(value: string) {
    if (value.trim().length === 0) {
      setErrors((currentErrors) => ({ ...currentErrors, jsonLd: undefined }));
      return;
    }

    try {
      JSON.parse(value);
      setErrors((currentErrors) => ({ ...currentErrors, jsonLd: undefined }));
    } catch {
      setErrors((currentErrors) => ({
        ...currentErrors,
        jsonLd: "Enter valid JSON before saving.",
      }));
    }
  }

  async function handleReset() {
    setErrors({});
    setKeywordInput("");

    try {
      const metadata = await loadMetadata(entityId);
      const nextState = createInitialState(metadata);
      setState(nextState);
      setOgImage(toImage(metadata?.og_image_file));
      setTwitterImage(toImage(metadata?.twitter_image_file));
    } catch (error) {
      console.error(`Failed to reset ${entityLabel.toLowerCase()} metadata`, error);
      toast.error(`Failed to reset ${entityLabel.toLowerCase()} metadata`);
    }
  }

  function commitKeywordInput() {
    const candidates = keywordInput
      .split(",")
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword.length > 0);

    if (candidates.length === 0) {
      return state.keywords;
    }

    const nextKeywords = Array.from(new Set([...state.keywords, ...candidates]));
    setKeywordInput("");
    return nextKeywords;
  }

  function handleAddKeywords() {
    const nextKeywords = commitKeywordInput();
    if (nextKeywords !== state.keywords) {
      updateState("keywords", nextKeywords);
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-40 items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading metadata...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>{entityLabel} Metadata</CardTitle>
              <CardDescription>
                SEO and social metadata for <span className="font-medium">{page.name}</span>.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {hasUnsavedChanges ? (
                <Badge variant="secondary">Unsaved changes</Badge>
              ) : (
                <Badge variant="outline">Saved</Badge>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleReset()}
                disabled={isSaving || !hasUnsavedChanges}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              <Button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving || !hasUnsavedChanges}
                className="gap-2"
              >
                {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <Accordion type="multiple" defaultValue={["basic-seo", "open-graph"]} className="space-y-4">
            <AccordionItem value="basic-seo" className="rounded-xl border px-4">
              <AccordionTrigger className="py-4 text-base">Basic SEO</AccordionTrigger>
              <AccordionContent className="pb-4">
                <FieldGroup>
                  <Field>
                    <MetadataLabel
                      htmlFor="metadata-title"
                      label="Title override"
                      description="Overrides the browser title and is used as the base title for social previews when their own title is empty."
                    />
                    <Input
                      id="metadata-title"
                      value={state.title}
                      onChange={(event) => updateState("title", event.target.value)}
                      placeholder="Defaults to page name if empty"
                    />
                  </Field>

                  <Field>
                    <div className="flex items-center justify-between gap-3">
                      <MetadataLabel
                        htmlFor="metadata-description"
                        label="Meta description"
                        description="A short summary shown in search results and reused as a fallback for social descriptions."
                      />
                      <span
                        className={cn(
                          "text-xs text-muted-foreground",
                          state.description.length > DESCRIPTION_LIMIT && "text-destructive",
                        )}
                      >
                        {state.description.length}/{DESCRIPTION_LIMIT}
                      </span>
                    </div>
                    <Textarea
                      id="metadata-description"
                      value={state.description}
                      onChange={(event) => updateState("description", event.target.value)}
                      maxLength={DESCRIPTION_LIMIT}
                    />
                    <FieldError>{errors.description}</FieldError>
                  </Field>

                  <Field>
                    <MetadataLabel
                      htmlFor="metadata-canonical-url"
                      label="Canonical URL"
                      description="Tells search engines which URL is the preferred version of this page."
                    />
                    <Input
                      id="metadata-canonical-url"
                      value={state.canonical_url}
                      onChange={(event) => updateState("canonical_url", event.target.value)}
                      onBlur={() => validateCanonicalUrl(state.canonical_url)}
                      placeholder="https://..."
                    />
                    <FieldError>{errors.canonical_url}</FieldError>
                  </Field>

                  <Field>
                    <MetadataLabel
                      label="Robots"
                      description="Controls whether search engines should index this page and follow its links."
                    />
                    <Select value={state.robots} onValueChange={(value: RobotsOption) => updateState("robots", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="index, follow">index, follow</SelectItem>
                        <SelectItem value="noindex, nofollow">noindex, nofollow</SelectItem>
                        <SelectItem value="noindex, follow">noindex, follow</SelectItem>
                        <SelectItem value="index, nofollow">index, nofollow</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <div className="flex items-center justify-between gap-3">
                      <MetadataLabel
                        htmlFor="metadata-keywords"
                        label="Keywords"
                        description="Optional search keywords for the page. Add one or more terms, then click Add."
                      />
                      <Badge variant="outline">
                        {state.keywords.length} keyword{state.keywords.length === 1 ? "" : "s"}
                      </Badge>
                    </div>
                    <div className="rounded-xl border bg-muted/20 p-3">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">
                          Add keywords one at a time or paste a comma-separated list.
                        </p>
                        {state.keywords.length > 0 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => updateState("keywords", [])}
                          >
                            Clear all
                          </Button>
                        ) : null}
                      </div>

                      <div className="mb-3 flex flex-wrap gap-2">
                        {state.keywords.length > 0 ? (
                          state.keywords.map((keyword) => (
                            <Badge key={keyword} variant="secondary" className="h-auto gap-1 px-2 py-1">
                              <Tag className="h-3 w-3" />
                              {keyword}
                              <button
                                type="button"
                                className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-black/10"
                                aria-label={`Remove ${keyword}`}
                                onClick={() => {
                                  const nextKeywords = state.keywords.filter((item) => item !== keyword);
                                  updateState("keywords", nextKeywords);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No keywords added yet.</p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Input
                          id="metadata-keywords"
                          value={keywordInput}
                          onChange={(event) => setKeywordInput(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              handleAddKeywords();
                            }
                          }}
                          placeholder="seo, marketing, landing page"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddKeywords}
                          disabled={keywordInput.trim().length === 0}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </Field>
                </FieldGroup>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="open-graph" className="rounded-xl border px-4">
              <AccordionTrigger className="py-4 text-base">Open Graph</AccordionTrigger>
              <AccordionContent className="space-y-6 pb-4">
                <FieldGroup>
                  <Field>
                    <MetadataLabel
                      htmlFor="metadata-og-title"
                      label="OG title"
                      description="The headline used when this page is shared on platforms that read Open Graph tags."
                    />
                    <Input
                      id="metadata-og-title"
                      value={state.og_title}
                      onChange={(event) => updateState("og_title", event.target.value)}
                      placeholder="Falls back to title/page name"
                    />
                  </Field>

                  <Field>
                    <div className="flex items-center justify-between gap-3">
                      <MetadataLabel
                        htmlFor="metadata-og-description"
                        label="OG description"
                        description="The social summary shown below the OG title in link previews."
                      />
                      <span
                        className={cn(
                          "text-xs text-muted-foreground",
                          state.og_description.length > OG_DESCRIPTION_LIMIT && "text-destructive",
                        )}
                      >
                        {state.og_description.length}/{OG_DESCRIPTION_LIMIT}
                      </span>
                    </div>
                    <Textarea
                      id="metadata-og-description"
                      value={state.og_description}
                      onChange={(event) => updateState("og_description", event.target.value)}
                      maxLength={OG_DESCRIPTION_LIMIT}
                    />
                  </Field>

                  <MetadataImageField
                    label="OG image"
                    image={ogImage}
                    storagePath={ogImage?.storagePath}
                    onPick={() => setIsOgPickerOpen(true)}
                    onClear={() => {
                      updateState("og_image_file_id", null);
                      setOgImage(null);
                    }}
                  />

                  <Field>
                    <MetadataLabel
                      htmlFor="metadata-og-image-alt"
                      label="OG image alt text"
                      description="A text alternative for the OG image. This is best filled in whenever an image is selected."
                    />
                    <Input
                      id="metadata-og-image-alt"
                      value={state.og_image_alt}
                      onChange={(event) => updateState("og_image_alt", event.target.value)}
                    />
                    {ogAltWarning ? (
                      <FieldDescription className="flex items-center gap-1 text-amber-600">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Add alt text when an OG image is set.
                      </FieldDescription>
                    ) : null}
                  </Field>
                </FieldGroup>

                <div className="w-full max-w-[400px] rounded-2xl border bg-muted/40 p-3">
                  <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
                    <div className="relative aspect-[1.91/1] bg-muted">
                      {ogImage ? (
                        <Image
                          src={ogImage.url}
                          alt={state.og_image_alt || ogImage.name}
                          fill
                          sizes="400px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                          No image selected
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {page.website.domain}
                      </p>
                      <p className="line-clamp-2 text-sm font-semibold">{ogPreviewTitle}</p>
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {ogPreviewDescription || "No description set"}
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="twitter" className="rounded-xl border px-4">
              <AccordionTrigger className="py-4 text-base">Twitter / X card</AccordionTrigger>
              <AccordionContent className="pb-4">
                <FieldGroup>
                  <Field>
                    <MetadataLabel
                      label="Card type"
                      description="Chooses the preview layout used on Twitter / X, including whether the image is emphasized."
                    />
                    <Select value={state.twitter_card} onValueChange={(value: TwitterCardOption) => updateState("twitter_card", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="summary_large_image">summary_large_image</SelectItem>
                        <SelectItem value="summary">summary</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <MetadataLabel
                      htmlFor="metadata-twitter-title"
                      label="Title override"
                      description="An optional Twitter / X-specific title. If blank, the OG or page title is used."
                    />
                    <Input
                      id="metadata-twitter-title"
                      value={state.twitter_title}
                      onChange={(event) => updateState("twitter_title", event.target.value)}
                    />
                  </Field>

                  <Field>
                    <MetadataLabel
                      htmlFor="metadata-twitter-description"
                      label="Description"
                      description="An optional Twitter / X-specific description. If blank, the OG or SEO description is used."
                    />
                    <Textarea
                      id="metadata-twitter-description"
                      value={state.twitter_description}
                      onChange={(event) => updateState("twitter_description", event.target.value)}
                    />
                  </Field>

                  <MetadataImageField
                    label="Twitter image"
                    image={twitterImage}
                    storagePath={twitterImage?.storagePath}
                    onPick={() => setIsTwitterPickerOpen(true)}
                    onClear={() => {
                      updateState("twitter_image_file_id", null);
                      setTwitterImage(null);
                    }}
                  />
                </FieldGroup>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="advanced" className="rounded-xl border px-4">
              <AccordionTrigger className="py-4 text-base">Advanced</AccordionTrigger>
              <AccordionContent className="pb-4">
                <FieldGroup>
                  <Field>
                    <MetadataLabel
                      htmlFor="metadata-schema-org"
                      label="schema.org structured data (JSON-LD)"
                      description="Optional structured data for rich search results. This should be valid JSON-LD."
                    />
                    <Textarea
                      id="metadata-schema-org"
                      value={state.schema_org}
                      onChange={(event) => updateState("schema_org", event.target.value)}
                      onBlur={() => validateJsonLd(state.schema_org)}
                      className="min-h-48 font-mono text-sm"
                      placeholder='{"@context":"https://schema.org","@type":"WebPage"}'
                    />
                    <FieldDescription>Enter valid JSON-LD. Validation runs when you leave the field.</FieldDescription>
                    <FieldError>{errors.jsonLd}</FieldError>
                  </Field>
                </FieldGroup>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <MediaImagePickerDialog
        open={isOgPickerOpen}
        onOpenChange={setIsOgPickerOpen}
        title="Select OG image"
        description="Choose an image from the media library for Open Graph previews."
        onSelect={(image) => {
          setOgImage(image);
          setState((currentState) => ({
            ...currentState,
            og_image_file_id: image.id,
            og_image_alt: currentState.og_image_alt || image.altText || "",
          }));
        }}
      />

      <MediaImagePickerDialog
        open={isTwitterPickerOpen}
        onOpenChange={setIsTwitterPickerOpen}
        title="Select Twitter image"
        description="Choose an image from the media library for Twitter / X cards."
        onSelect={(image) => {
          setTwitterImage(image);
          setState((currentState) => ({
            ...currentState,
            twitter_image_file_id: image.id,
          }));
        }}
      />
    </TooltipProvider>
  );
}
