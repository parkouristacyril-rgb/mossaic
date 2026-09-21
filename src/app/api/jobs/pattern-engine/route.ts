import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runPatternEngine } from "@/lib/pipeline/pattern-engine";

export const maxDuration = 300;

/**
 * Scheduled endpoint. Guarded by a shared secret because it is expensive to
 * run and must not be triggerable by anyone who finds the URL.
 */
export async function POST(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${env.jobSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = request.nextUrl.searchParams.get("organizationId");
  if (!organizationId) {
    return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
  }

  const report = await runPatternEngine(organizationId);
  return NextResponse.json(report);
}
