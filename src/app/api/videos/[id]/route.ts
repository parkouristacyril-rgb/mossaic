import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const video = await db.video.findUnique({
    where: { id: params.id },
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
