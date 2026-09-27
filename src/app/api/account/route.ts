import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiSession, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Only the display name is editable. Email is the login identity and the tenant
// unique key, so it is deliberately not accepted here.
const Schema = z.object({
  name: z.string().trim().min(1).max(100),
});

export async function PATCH(request: Request) {
  const auth = await requireApiSession();
  if (auth instanceof NextResponse) return auth;

  const parsed = Schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a name between 1 and 100 characters." },
      { status: 400 },
    );
  }

  const member = await db.member.update({
    where: { id: auth.memberId },
    data: { name: parsed.data.name },
  });

  // The name is cached in the session cookie (the shell reads it from there), so
  // re-issue it with the new value — keeping the original expiry, not extending it.
  await setSessionCookie({ ...auth, name: member.name });

  return NextResponse.json({ ok: true, name: member.name });
}
