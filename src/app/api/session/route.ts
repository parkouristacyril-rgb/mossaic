import { NextResponse } from "next/server";
import { getSession, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Tells the client shell who it is acting as. Everything here comes from the
 * verified session cookie, so a client can never learn about — let alone act
 * on — an organization it is not a member of.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();

  return NextResponse.json({
    organizationId: session.organizationId,
    name: session.orgName,
    member: {
      id: session.memberId,
      name: session.name,
      email: session.email,
      role: session.role,
    },
  });
}
