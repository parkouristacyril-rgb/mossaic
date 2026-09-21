import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const org = await db.organization.upsert({
    where: { slug: "bump" },
    create: { name: "BUMP", slug: "bump" },
    update: {},
  });

  await db.member.upsert({
    where: { organizationId_email: { organizationId: org.id, email: "jordan@bump.app" } },
    create: {
      organizationId: org.id,
      email: "jordan@bump.app",
      name: "Jordan Reyes",
      role: "ADMIN",
    },
    update: {},
  });

  console.log(`Seeded organization "${org.name}" (${org.id})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
