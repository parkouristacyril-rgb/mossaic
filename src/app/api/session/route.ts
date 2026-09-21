import { NextResponse } from "next/server";
import { currentOrganization } from "@/lib/org";

// Reads from the database on every call, so it must never be statically
// prerendered at build time — without this, `next build` tries to execute the
// handler (and hit Postgres) while generating static pages.
export const dynamic = "force-dynamic";

/**
 * Stands in for real auth. Client components ask this which organization they
 * are acting on, so when sessions arrive only this file changes.
 */
export async function GET() {
  const org = await currentOrganization();
  return NextResponse.json({ organizationId: org.id, name: org.name });
}
