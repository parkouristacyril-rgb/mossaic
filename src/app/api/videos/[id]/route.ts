import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireApiSession();
  if (auth instanceof NextResponse) return auth;

  // Scope by organization so an id from another tenant reads as "not found"
  // rather than leaking another org's analysis.
  const video = await db.video.findFirst({
    where: { id: params.id, organizationId: auth.organizationId },
    include: {
      analysis: true,
      scores: true,
      snapshots: { orderBy: { fetchedAt: "desc" }, take: 20 },
      observations: {
        orderBy: { createdAt: "desc" },
        include: { member: { select: { name: true } } },
      },
      entityLinks: { include: { entity: true } },
      evidence: { include: { pattern: true } },
    },
  });

  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  return NextResponse.json({ video });
}
