import { db } from "@/lib/db";
import { currentOrganization } from "@/lib/org";

export const dynamic = "force-dynamic";

export default async function EntitiesPage() {
  const org = await currentOrganization();

  const entities = await db.entity.findMany({
    where: { organizationId: org.id },
    include: { _count: { select: { videoLinks: true } } },
    orderBy: { name: "asc" },
  });

  const ranked = entities
    .sort((a, b) => b._count.videoLinks - a._count.videoLinks)
    .slice(0, 50);

  return (
    <>
      <h1>Entities and competitors</h1>
      <p className="lede">
        Every brand, product and topic Mosaic has recognised in your content —
        and how often each one turns up.
      </p>

      {ranked.length === 0 ? (
        <div className="card">
          <p className="empty">
            Nothing detected yet. Entities are pulled out automatically as videos
            are analysed.
          </p>
        </div>
      ) : (
        <div className="card">
          {ranked.map((e) => (
            <div className="row" key={e.id}>
              <div>
                <strong>{e.name}</strong>
                <div className="muted">{e.type.toLowerCase()}</div>
              </div>
              <span className="muted">
                {e._count.videoLinks} {e._count.videoLinks === 1 ? "video" : "videos"}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
