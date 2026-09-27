import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { generateIdeas, NoPatternsError } from "@/lib/pipeline/generate-ideas";
import { requireApiSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// organizationId comes from the session, not the body.
const Schema = z.object({
  campaign: z.string().min(1).max(200),
  goal: z.string().min(1).max(200),
  audience: z.string().max(500).optional(),
  product: z.string().max(500).optional(),
  constraints: z.string().max(500).optional(),
  count: z.number().int().min(1).max(30).optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireApiSession({ write: true });
  if (auth instanceof NextResponse) return auth;

  const parsed = Schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const batch = await generateIdeas({
      ...parsed.data,
      organizationId: auth.organizationId,
    });
    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    if (error instanceof NoPatternsError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}

export async function GET() {
  const auth = await requireApiSession();
  if (auth instanceof NextResponse) return auth;

  const batches = await db.ideaBatch.findMany({
    where: { organizationId: auth.organizationId },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { ideas: true },
  });

  return NextResponse.json({ batches });
}
