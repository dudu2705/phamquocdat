import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

async function main() {
  const [email, password] = process.argv.slice(2);

  if (!email || !password || password.length < 8) {
    console.error("Usage: npm run admin:create -- <email> <password (min 8 chars)>");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.admin.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  console.log(`Admin ready: ${email}`);
}

main().finally(() => prisma.$disconnect());
