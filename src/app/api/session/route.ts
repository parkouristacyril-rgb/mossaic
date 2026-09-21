import { NextResponse } from "next/server";
import { currentOrganization } from "@/lib/org";

/**
 * Stands in for real auth. Client components ask this which organization they
 * are acting on, so when sessions arrive only this file changes.
 */
export async function GET() {
  const org = await currentOrganization();
  return NextResponse.json({ organizationId: org.id, name: org.name });
}
