import { Platform } from "@prisma/client";

export type ParsedLink = {
  url: string;
  platform: Platform;
  externalId: string;
};

/**
 * Share sheets rarely hand over a clean URL. iOS sends the caption, the
 * handle and the link in one blob; Android often appends tracking text. Pull
 * the first http(s) URL out of whatever arrived.
 */
export function extractUrl(input: string): string | null {
  const match = input.match(/https?:\/\/\S+/);
  return match ? match[0].replace(/[),.]+$/, "") : null;
}

const PATTERNS: Array<{ platform: Platform; re: RegExp }> = [
  // https://www.tiktok.com/@handle/video/7123456789
  { platform: "TIKTOK", re: /tiktok\.com\/@[\w.\-]+\/video\/(\d+)/i },
  // https://vm.tiktok.com/ZGabc123/  (short link — id resolved after redirect)
  { platform: "TIKTOK", re: /(?:vm|vt)\.tiktok\.com\/([\w]+)/i },
  // https://www.instagram.com/reel/Cxyz123/
  { platform: "INSTAGRAM", re: /instagram\.com\/(?:reel|reels|p)\/([\w\-]+)/i },
  // https://www.youtube.com/shorts/abc123
  { platform: "YOUTUBE", re: /youtube\.com\/shorts\/([\w\-]+)/i },
];

export class UnsupportedLinkError extends Error {
  constructor(input: string) {
    super(`Not a recognised TikTok, Instagram or YouTube Shorts link: ${input}`);
    this.name = "UnsupportedLinkError";
  }
}

/**
 * Turn raw shared text into the (platform, externalId) pair the rest of the
 * system deduplicates on. Throws rather than guessing — a wrong id would mean
 * two records for one clip, or worse, merging two different clips.
 */
export function parseLink(input: string): ParsedLink {
  const url = extractUrl(input.trim()) ?? input.trim();

  for (const { platform, re } of PATTERNS) {
    const m = url.match(re);
    if (m) return { url, platform, externalId: m[1] };
  }
  throw new UnsupportedLinkError(input);
}

/** Non-throwing variant for form validation. */
export function tryParseLink(input: string): ParsedLink | null {
  try {
    return parseLink(input);
  } catch {
    return null;
  }
}

/** Short links carry no stable id until resolved; the scraper fills it in. */
export function isShortLink(link: ParsedLink): boolean {
  return /(?:vm|vt)\.tiktok\.com/i.test(link.url);
}
