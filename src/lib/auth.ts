import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  verifySession,
  type SessionPayload,
  type SessionRole,
} from "@/lib/session";

/**
 * Server-side session access, for Server Components and Route Handlers (Node
 * runtime). The Edge middleware uses `session.ts` directly instead — it cannot
 * touch `next/headers`.
 */

/** Reads and verifies the session cookie. Never redirects — callers decide. */
export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySession(token);
}

/**
 * For Server Components / pages: returns the session or sends the visitor to the
 * login screen. Middleware already redirects, but this makes each page safe on
 * its own and gives the type system a non-null session.
 */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await signSession(payload);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearSessionCookie(): void {
  cookies().set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

// --- API guards --------------------------------------------------------------

/** 401 for Route Handlers when no valid session is present. */
export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Authentication required" }, { status: 401 });
}

/** 403 for Route Handlers when the session lacks the required role. */
export function forbidden(): NextResponse {
  return NextResponse.json(
    { error: "You don't have permission to do that" },
    { status: 403 },
  );
}

export function hasRole(session: SessionPayload, ...roles: SessionRole[]): boolean {
  return roles.includes(session.role);
}

/** Roles allowed to create/modify data. VIEWER is read-only. */
export const WRITE_ROLES: SessionRole[] = ["ADMIN", "CONTRIBUTOR"];

export function canWrite(session: SessionPayload): boolean {
  return hasRole(session, ...WRITE_ROLES);
}

/**
 * Guard for Route Handlers. Returns the session when the request is allowed, or
 * a ready-to-return error response when it is not:
 *
 *   const auth = await requireApiSession();
 *   if (auth instanceof NextResponse) return auth;
 *   // auth is a SessionPayload here
 */
export async function requireApiSession(options?: {
  write?: boolean;
  admin?: boolean;
}): Promise<SessionPayload | NextResponse> {
  const session = await getSession();
  if (!session) return unauthorized();
  if (options?.admin && !hasRole(session, "ADMIN")) return forbidden();
  if (options?.write && !canWrite(session)) return forbidden();
  return session;
}
