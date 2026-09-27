import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiSession, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

const Schema = z.object({
  name: z.string().trim().min(1).max(100),
});

/**
 * Rename the workspace. Admin-only: a CONTRIBUTOR or VIEWER gets 403 even though
 * the settings UI already hides this section from them.
 */
export async function PATCH(request: Request) {
  const auth = await requireApiSession({ admin: true });
  if (auth instanceof NextResponse) return auth;

  const parsed = Schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a workspace name between 1 and 100 characters." },
      { status: 400 },
    );
  }

  const org = await db.organization.update({
    where: { id: auth.organizationId },
    data: { name: parsed.data.name },
  });

  // The org name is cached in the session cookie for the shell; refresh it.
  await setSessionCookie({ ...auth, orgName: org.name });

  return NextResponse.json({ ok: true, name: org.name });
}
