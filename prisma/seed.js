const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const adminUsername = "admin";
  const adminPassword = "korzinka77";

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const existingAdmin = await prisma.user.findUnique({
    where: { username: adminUsername },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        username: adminUsername,
        password: hashedPassword,
        role: "DIRECTOR",
      },
    });
    console.log(`\n✅ Boshlang'ich direktor yaratildi.\n👉 Login: ${adminUsername}\n👉 Parol: ${adminPassword}\n`);
  } else {
    await prisma.user.update({
      where: { username: adminUsername },
      data: { password: hashedPassword }
    });
    console.log(`\n✅ Direktor paroli yangilandi.\n👉 Yangi parol: ${adminPassword}\n`);
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
