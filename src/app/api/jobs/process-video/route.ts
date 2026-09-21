import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { processVideo } from "@/lib/pipeline/process-video";

export const maxDuration = 300;

/**
 * Re-runs analysis for one video. Used to pick up videos parked in
 * AWAITING_DATA once their stats have had time to land.
 */
export async function POST(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${env.jobSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { videoId } = (await request.json()) as { videoId?: string };
  if (!videoId) {
    return NextResponse.json({ error: "videoId is required" }, { status: 400 });
  }

  try {
    await processVideo(videoId);
    return NextResponse.json({ ok: true, videoId });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
