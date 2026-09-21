import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const organizationId = request.nextUrl.searchParams.get("organizationId");
  if (!organizationId) {
    return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
  }

  const patterns = await db.pattern.findMany({
    where: { organizationId },
    orderBy: [{ confidence: "desc" }],
    include: {
      _count: { select: { evidence: true } },
      evidence: {
        orderBy: { strength: "desc" },
        take: 3,
        include: {
          video: {
            select: { id: true, url: true, creatorHandle: true, scores: true },
          },
        },
      },
    },
  });

  return NextResponse.json({ patterns });
}
