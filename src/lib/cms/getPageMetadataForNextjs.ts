import type { Metadata } from "next";

import type { Page, PageMetadata } from "@/types";

function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function toAbsoluteUrl(value: string, siteUrl: string) {
  try {
    return new URL(value, siteUrl).toString();
  } catch {
    return value;
  }
}

function buildRobotsValue(robots: string | null | undefined) {
  const resolvedRobots = robots ?? "index, follow";

  return {
    index: !resolvedRobots.includes("noindex"),
    follow: !resolvedRobots.includes("nofollow"),
  };
}

export function buildNextjsMetadata(
  page: Page,
  meta: PageMetadata | null,
  siteUrl: string,
): Metadata {
  const resolvedSiteUrl = siteUrl.replace(/\/+$/, "");
  const resolvedTitle = meta?.title?.trim() || page.name;
  const resolvedDescription = meta?.description ?? undefined;
  const canonicalUrl = toAbsoluteUrl(
    meta?.canonical_url?.trim() || (page.slug === "/" ? "/" : `/${page.slug.replace(/^\/+/, "")}`),
    resolvedSiteUrl,
  );
  const publicR2BaseUrl =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/+$/, "") ||
    process.env.NEXT_PUBLIC_R2_CDN_URL?.replace(/\/+$/, "") ||
    "";
  const openGraphImageUrl =
    publicR2BaseUrl && meta?.og_image_file?.storage_path
      ? joinUrl(publicR2BaseUrl, meta.og_image_file.storage_path)
      : undefined;
  const twitterImageUrl =
    publicR2BaseUrl && meta?.twitter_image_file?.storage_path
      ? joinUrl(publicR2BaseUrl, meta.twitter_image_file.storage_path)
      : openGraphImageUrl;

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    keywords: meta?.keywords ?? undefined,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: buildRobotsValue(meta?.robots),
    openGraph: {
      type: "website",
      url: canonicalUrl,
      title: meta?.og_title?.trim() || resolvedTitle,
      description: meta?.og_description?.trim() || resolvedDescription,
      images: openGraphImageUrl
        ? [
            {
              url: openGraphImageUrl,
              alt: meta?.og_image_alt?.trim() || meta?.og_image_file?.alt_text || undefined,
            },
          ]
        : undefined,
    },
    twitter: {
      card: meta?.twitter_card === "summary" ? "summary" : "summary_large_image",
      title: meta?.twitter_title?.trim() || meta?.og_title?.trim() || resolvedTitle,
      description:
        meta?.twitter_description?.trim() || meta?.og_description?.trim() || resolvedDescription,
      images: twitterImageUrl ? [twitterImageUrl] : undefined,
    },
    other: meta?.schema_org
      ? {
          "application/ld+json": JSON.stringify(meta.schema_org),
        }
      : undefined,
  };
}
