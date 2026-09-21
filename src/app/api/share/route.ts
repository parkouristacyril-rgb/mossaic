import { NextRequest, NextResponse } from "next/server";
import { extractUrl, tryParseLink } from "@/lib/link";

/**
 * Android's Web Share Target posts a form, not JSON, and spreads the payload
 * across title/text/url depending on the sending app. Rather than guess here,
 * pull out whatever looks like a link and hand the user a pre-filled form.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const candidate = ["url", "text", "title"]
    .map((key) => form.get(key))
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .map((v) => extractUrl(v))
    .find((v): v is string => Boolean(v));

  const target = candidate
    ? `/share?link=${encodeURIComponent(candidate)}`
    : "/share?error=nolink";

  return NextResponse.redirect(new URL(target, request.url), 303);
}

/** iOS Shortcuts send a GET with the shared text in the query string. */
export async function GET(request: NextRequest) {
  const raw =
    request.nextUrl.searchParams.get("text") ??
    request.nextUrl.searchParams.get("url") ??
    "";
  const link = extractUrl(raw);
  const parsed = link ? tryParseLink(link) : null;

  const target = parsed
    ? `/share?link=${encodeURIComponent(parsed.url)}`
    : "/share?error=nolink";

  return NextResponse.redirect(new URL(target, request.url), 303);
}
