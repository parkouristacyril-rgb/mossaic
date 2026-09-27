import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { requireApiSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const Schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  password: z.string().min(8, "Use at least 8 characters.").max(200),
  role: z.enum(["ADMIN", "CONTRIBUTOR", "VIEWER"]),
});

/**
 * Register a new user into the caller's organization. Admin-only. The admin
 * sets an initial password (there is no email delivery yet); the teammate can
 * sign in with it immediately and change it from Settings.
 */
export async function POST(request: Request) {
  const auth = await requireApiSession({ admin: true });
  if (auth instanceof NextResponse) return auth;

  const parsed = Schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Check the form and try again.";
    return NextResponse.json({ error: first }, { status: 400 });
  }

  const { name, password, role } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  // Email is the login identity across the whole app, so it must be unique
  // app-wide, not just within this organization.
  const existing = await db.member.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Someone with this email already has an account." },
      { status: 409 },
    );
  }

  const { hash, salt } = await hashPassword(password);

  try {
    const member = await db.member.create({
      data: {
        organizationId: auth.organizationId,
        email,
        name,
        role,
        passwordHash: hash,
        passwordSalt: salt,
      },
      select: { id: true, name: true, email: true, role: true },
    });
    return NextResponse.json({ ok: true, member }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Someone with this email already has an account." },
        { status: 409 },
      );
    }
    throw error;
  }
}
