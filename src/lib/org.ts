import { db } from "@/lib/db";

/**
 * Single-tenant shortcut for the prototype. Every query is already scoped by
 * organizationId, so replacing this with a real session lookup is the only
 * change needed to turn this into a proper multi-tenant app.
 */
export async function currentOrganization() {
  const org = await db.organization.findFirst({ orderBy: { createdAt: "asc" } });
  if (!org) throw new Error("No organization found — run `npm run db:seed` first.");
  return org;
}
