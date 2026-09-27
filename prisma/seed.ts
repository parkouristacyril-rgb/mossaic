import { PrismaClient, type MemberRole } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const db = new PrismaClient();

// One account per role, so every permission level can be exercised out of the
// box. Override the shared password with SEED_PASSWORD for anything but dev.
const SEED_PASSWORD = process.env.SEED_PASSWORD || "changeme";

const MEMBERS: { email: string; name: string; role: MemberRole }[] = [
  { email: "jordan@bump.app", name: "Jordan Reyes", role: "ADMIN" },
  { email: "casey@bump.app", name: "Casey Lin", role: "CONTRIBUTOR" },
  { email: "sam@bump.app", name: "Sam Okafor", role: "VIEWER" },
];

async function main() {
  const org = await db.organization.upsert({
    where: { slug: "bump" },
    create: { name: "BUMP", slug: "bump" },
    update: {},
  });

  for (const m of MEMBERS) {
    // Each member gets its own salt, so identical passwords still hash differently.
    const { hash, salt } = await hashPassword(SEED_PASSWORD);
    await db.member.upsert({
      where: { organizationId_email: { organizationId: org.id, email: m.email } },
      create: {
        organizationId: org.id,
        email: m.email,
        name: m.name,
        role: m.role,
        passwordHash: hash,
        passwordSalt: salt,
      },
      update: {
        name: m.name,
        role: m.role,
        passwordHash: hash,
        passwordSalt: salt,
      },
    });
  }

  console.log(`Seeded organization "${org.name}" (${org.id})`);
  console.log(`All logins use password: ${SEED_PASSWORD}`);
  for (const m of MEMBERS) console.log(`  ${m.role.padEnd(11)} ${m.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
