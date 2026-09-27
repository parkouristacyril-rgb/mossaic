import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

/**
 * The organization the signed-in member belongs to. Derived from the verified
 * session cookie — never from anything the client can choose — so a Server
 * Component can only ever read its own tenant's data. If the session's org has
 * since been deleted, the session is stale: bounce to login.
 */
export async function currentOrganization() {
  const session = await requireSession();
  const org = await db.organization.findUnique({
    where: { id: session.organizationId },
  });
  if (!org) redirect("/login");
  return org;
}
