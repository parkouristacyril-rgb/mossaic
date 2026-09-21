import { db } from "@/lib/db";
import { currentOrganization } from "@/lib/org";

export const dynamic = "force-dynamic";

const initials = (name: string) =>
  name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";

const AVATARS = ["var(--violet)", "#7B2FF7", "#4C1D95", "#E23FCB"];

const roleLabel = (r: string) =>
  ({ ADMIN: "Workspace Admin", CONTRIBUTOR: "Contributor", VIEWER: "Viewer" }[r] ?? r);

function timeAgo(date: Date | null) {
  if (!date) return "—";
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default async function TeamPage() {
  const org = await currentOrganization();
  const members = await db.member.findMany({
    where: { organizationId: org.id },
    include: { _count: { select: { observations: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="font-serif text-4xl mb-2">Team</h1>
      <p className="text-[var(--mist)] mb-8">
        Everyone contributing observations and reviewing patterns for {org.name}.
      </p>
      <div className="card overflow-hidden">
        {members.length === 0 ? (
          <p className="text-[var(--mist-dim)] p-7">No teammates yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-left text-[var(--mist-dim)] font-mono text-[11px]">
                <th className="p-4 font-medium">Member</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Observations</th>
                <th className="p-4 font-medium">Last active</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr key={m.id} className={i === members.length - 1 ? "" : "border-b border-[var(--line)]"}>
                  <td className="p-4 flex items-center gap-3">
                    <div className="avatar-circle" style={{ background: AVATARS[i % AVATARS.length] }}>{initials(m.name)}</div>
                    {m.name}
                  </td>
                  <td className="p-4 text-[var(--mist)]">{roleLabel(m.role)}</td>
                  <td className="p-4">{m._count.observations}</td>
                  <td className="p-4 text-[var(--mist-dim)]">{timeAgo(m.lastActiveAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
