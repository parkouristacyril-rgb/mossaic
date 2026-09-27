import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

/**
 * First line of defense. Unauthenticated visitors never reach an `/app` page or
 * a data API. This is enforcement, not just UX: every route handler and page
 * still re-checks the session and scopes to the caller's org, but stopping the
 * request here means we never render a shell or open a DB connection for a
 * request that has no business being served.
 */

// Public API prefixes that must bypass the cookie check:
// - /api/auth  : the login/logout endpoints themselves.
// - /api/jobs  : machine-to-machine, authenticated by JOB_SECRET instead.
// - /api/share : OS share-target entry point; it only redirects into /app,
//                which is itself gated.
const PUBLIC_API_PREFIXES = ["/api/auth", "/api/jobs", "/api/share"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);

  if (pathname.startsWith("/api")) {
    if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }
    return NextResponse.next();
  }

  // Everything else the matcher covers is an /app page.
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/api/:path*"],
};
