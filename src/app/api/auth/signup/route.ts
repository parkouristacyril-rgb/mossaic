import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/auth";
import { SESSION_MAX_AGE } from "@/lib/session";

export const dynamic = "force-dynamic";

const Schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  password: z.string().min(8, "Use at least 8 characters.").max(200),
  organizationName: z.string().trim().min(1).max(100),
});

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** A slug not already taken by another organization. */
async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "workspace";
  let slug = root;
  for (let i = 2; i < 60; i++) {
    const taken = await db.organization.findUnique({ where: { slug } });
    if (!taken) return slug;
    slug = `${root}-${i}`;
  }
  return `${root}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Check the form and try again.";
    return NextResponse.json({ error: first }, { status: 400 });
  }

  const { name, password, organizationName } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  // Login resolves an account by email across all organizations, so email must
  // be unique app-wide even though the DB constraint is only per-organization.
  const existing = await db.member.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists. Try signing in." },
      { status: 409 },
    );
  }

  const { hash, salt } = await hashPassword(password);
  const slug = await uniqueSlug(organizationName);

  let org: { id: string; name: string };
  let member: { id: string; role: "ADMIN" };
  try {
    const created = await db.$transaction(async (tx) => {
      const o = await tx.organization.create({
        data: { name: organizationName, slug },
      });
      const m = await tx.member.create({
        data: {
          organizationId: o.id,
          email,
          name,
          role: "ADMIN",
          passwordHash: hash,
          passwordSalt: salt,
          lastActiveAt: new Date(),
        },
      });
      return { o, m };
    });
    org = created.o;
    member = { id: created.m.id, role: "ADMIN" };
  } catch (error) {
    // Lost a race on the unique slug/email — safe to ask them to retry.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "That workspace or email was just taken. Please try again." },
        { status: 409 },
      );
    }
    throw error;
  }

  await setSessionCookie({
    memberId: member.id,
    organizationId: org.id,
    role: member.role,
    email,
    name,
    orgName: org.name,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  });

  return NextResponse.json(
    { ok: true, organization: { id: org.id, name: org.name } },
    { status: 201 },
  );
}
