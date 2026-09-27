import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { parseLink, UnsupportedLinkError } from "@/lib/link";
import { enqueueVideoProcessing } from "@/lib/pipeline/queue";
import { requireApiSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// The organization and the author are taken from the verified session, never
// from the request body — the client cannot file an observation into another
// org or under another member's name.
const SingleSchema = z.object({
  link: z.string().min(1),
  reaction: z.string().max(2000).optional(),
  firstImpression: z.string().max(2000).optional(),
  whyItWorked: z.string().max(2000).optional(),
  source: z.enum(["SHARE_SHEET", "WORKSPACE", "BULK_IMPORT"]).default("WORKSPACE"),
});

const BulkSchema = z.object({
  links: z.array(z.string().min(1)).min(1).max(200),
});

export async function POST(request: NextRequest) {
  const auth = await requireApiSession({ write: true });
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const bulk = BulkSchema.safeParse(body);
  if (bulk.success) {
    return handleBulk(bulk.data, auth.organizationId, auth.memberId);
  }

  const single = SingleSchema.safeParse(body);
  if (!single.success) {
    return NextResponse.json(
      { error: "Invalid request", details: single.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const result = await ingestOne(single.data, auth.organizationId, auth.memberId);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof UnsupportedLinkError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    throw error;
  }
}

type SingleInput = z.infer<typeof SingleSchema>;

async function ingestOne(
  input: SingleInput,
  organizationId: string,
  memberId: string,
) {
  const link = parseLink(input.link);

  // The dedup point. A second person sharing the same clip adds their
  // observation to the existing video instead of paying to analyse it again.
  const existing = await db.video.findUnique({
    where: {
      organizationId_platform_externalId: {
        organizationId,
        platform: link.platform,
        externalId: link.externalId,
      },
    },
  });

  const video =
    existing ??
    (await db.video.create({
      data: {
        organizationId,
        platform: link.platform,
        externalId: link.externalId,
        url: link.url,
        status: "PENDING",
      },
    }));

  const observation = await db.observation.create({
    data: {
      organizationId,
      videoId: video.id,
      memberId,
      reaction: input.reaction,
      firstImpression: input.firstImpression,
      whyItWorked: input.whyItWorked,
      source: input.source,
    },
  });

  if (!existing) await enqueueVideoProcessing(video.id);

  return {
    observationId: observation.id,
    videoId: video.id,
    alreadyKnown: Boolean(existing),
    status: video.status,
  };
}

async function handleBulk(
  input: z.infer<typeof BulkSchema>,
  organizationId: string,
  memberId: string,
) {
  const accepted: string[] = [];
  const rejected: Array<{ link: string; reason: string }> = [];

  for (const link of input.links) {
    try {
      const result = await ingestOne(
        { link, source: "BULK_IMPORT" },
        organizationId,
        memberId,
      );
      accepted.push(result.videoId);
    } catch (error) {
      rejected.push({
        link,
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return NextResponse.json(
    { accepted: accepted.length, rejected, videoIds: accepted },
    { status: 202 },
  );
}

export async function GET() {
  const auth = await requireApiSession();
  if (auth instanceof NextResponse) return auth;

  const observations = await db.observation.findMany({
    where: { organizationId: auth.organizationId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      member: { select: { name: true } },
      video: { select: { id: true, url: true, status: true, creatorHandle: true } },
    },
  });

  return NextResponse.json({ observations });
}
