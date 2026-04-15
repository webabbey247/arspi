import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const email = "admin@arspi.org";
  const password = "Admin@1234"; // change before running in production

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin already exists:", email);
    return;
  }

  const hashed = await bcrypt.hash(password, 12);

  const admin = await db.user.create({
    data: {
      email,
      password: hashed,
      role: "ADMIN",
      emailVerified: true,
      hasProfile: true,
      hasInterests: true,
      profile: {
        create: {
          firstName: "Webmaster",
          lastName: "Balogun",
          jobTitle: "Platform Administrator",
        },
      },
    },
  });

  console.log("Admin seeded:", admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
