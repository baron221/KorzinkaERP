const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const adminUsername = "admin";
  const adminPassword = "KorzinkaAdmin2026!";

  const existingAdmin = await prisma.user.findUnique({
    where: { username: adminUsername },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        username: adminUsername,
        password: hashedPassword,
        role: "DIRECTOR",
      },
    });
    console.log(`\n✅ Boshlang'ich direktor yaratildi.\n👉 Login: ${adminUsername}\n👉 Parol: ${adminPassword}\n`);
  } else {
    console.log("\n✅ Boshlang'ich direktor tizimda mavjud.\n");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
