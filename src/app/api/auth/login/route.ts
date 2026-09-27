import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/auth";
import { SESSION_MAX_AGE } from "@/lib/session";

export const dynamic = "force-dynamic";

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// A fixed, well-formed scrypt input used when no member matches, so a login for
// an unknown email costs roughly the same as one for a known email and does not
// leak which addresses exist via response timing.
const DUMMY_HASH =
  "0000000000000000000000000000000000000000000000000000000000000000" +
  "0000000000000000000000000000000000000000000000000000000000000000";
const DUMMY_SALT = "00000000000000000000000000000000";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid email and password." },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;

  // Email is unique per organization, not globally; findFirst picks the earliest
  // matching member. Case-insensitive so "Jordan@Bump.app" still matches.
  const member = await db.member.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    include: { organization: { select: { name: true } } },
  });

  const ok =
    member?.passwordHash && member.passwordSalt
      ? await verifyPassword(password, member.passwordHash, member.passwordSalt)
      : // Burn equivalent time, then fail, for unknown or password-less members.
        (await verifyPassword(password, DUMMY_HASH, DUMMY_SALT), false);

  if (!member || !ok) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  await setSessionCookie({
    memberId: member.id,
    organizationId: member.organizationId,
    role: member.role,
    email: member.email,
    name: member.name,
    orgName: member.organization.name,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  });

  await db.member.update({
    where: { id: member.id },
    data: { lastActiveAt: new Date() },
  });

  return NextResponse.json({
    ok: true,
    member: { name: member.name, email: member.email, role: member.role },
  });
}
