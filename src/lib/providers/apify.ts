import { Platform } from "@prisma/client";
import { env } from "@/lib/env";

const BASE = "https://api.apify.com/v2";

export class ApifyError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "ApifyError";
  }
}

/**
 * Normalised shape across platforms. Every field is optional on purpose:
 * scrapers routinely return partial records for fresh uploads, and the
 * readiness check downstream depends on knowing exactly what is missing.
 */
export type ScrapedVideo = {
  externalId?: string;
  url?: string;
  caption?: string;
  creatorHandle?: string;
  creatorFollowers?: number;
  durationSeconds?: number;
  playCount?: number;
  diggCount?: number;
  commentCount?: number;
  shareCount?: number;
  collectCount?: number;
  authorFans?: number;
  mediaUrl?: string;
};

export async function scrapeVideo(url: string, platform: Platform): Promise<ScrapedVideo> {
  const actor =
    platform === "INSTAGRAM" ? env.apifyInstagramActor : env.apifyTiktokActor;

  const input =
    platform === "INSTAGRAM"
      ? { directUrls: [url], resultsLimit: 1 }
      : { postURLs: [url], resultsPerPage: 1, shouldDownloadVideos: false };

  const res = await fetch(
    `${BASE}/acts/${actor}/run-sync-get-dataset-items?token=${env.apifyToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );

  if (!res.ok) {
    throw new ApifyError(`Scraper failed: ${await res.text()}`, res.status);
  }

  const items = (await res.json()) as Array<Record<string, unknown>>;
  if (!items.length) throw new ApifyError("Scraper returned no items for this URL");

  return platform === "INSTAGRAM" ? mapInstagram(items[0]) : mapTikTok(items[0]);
}

const num = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;
const str = (v: unknown): string | undefined =>
  typeof v === "string" && v.length > 0 ? v : undefined;

function mapTikTok(item: Record<string, unknown>): ScrapedVideo {
  const meta = (item.videoMeta ?? {}) as Record<string, unknown>;
  const author = (item.authorMeta ?? {}) as Record<string, unknown>;
  return {
    externalId: str(item.id),
    url: str(item.webVideoUrl),
    caption: str(item.text),
    creatorHandle: str(author.name),
    creatorFollowers: num(author.fans),
    durationSeconds: num(meta.duration),
    playCount: num(item.playCount),
    diggCount: num(item.diggCount),
    commentCount: num(item.commentCount),
    shareCount: num(item.shareCount),
    collectCount: num(item.collectCount),
    authorFans: num(author.fans),
    mediaUrl: str(meta.downloadAddr) ?? str(item.mediaUrl),
  };
}

/**
 * Instagram field names differ enough from TikTok that they are mapped
 * separately rather than through one lenient lookup — a silent mismatch here
 * would look like "the video has no engagement" rather than "we read the wrong
 * key", which is a much harder bug to notice.
 */
function mapInstagram(item: Record<string, unknown>): ScrapedVideo {
  return {
    externalId: str(item.shortCode) ?? str(item.id),
    url: str(item.url),
    caption: str(item.caption),
    creatorHandle: str(item.ownerUsername),
    creatorFollowers: num(item.ownerFollowersCount),
    durationSeconds: num(item.videoDuration),
    playCount: num(item.videoPlayCount) ?? num(item.videoViewCount),
    diggCount: num(item.likesCount),
    commentCount: num(item.commentsCount),
    // Instagram's public payload exposes neither shares nor saves.
    shareCount: undefined,
    collectCount: undefined,
    authorFans: num(item.ownerFollowersCount),
    mediaUrl: str(item.videoUrl),
  };
}

/** Downloads the media file so it can be handed to the multimodal model. */
export async function fetchMedia(mediaUrl: string): Promise<ArrayBuffer> {
  const res = await fetch(mediaUrl);
  if (!res.ok) throw new ApifyError(`Could not download media: ${res.status}`);
  return res.arrayBuffer();
}
