import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSession();
  if (auth instanceof NextResponse) return auth;

  const patterns = await db.pattern.findMany({
    where: { organizationId: auth.organizationId },
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
