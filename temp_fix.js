const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const customers = await prisma.customer.findMany();
  const names = new Map();
  const duplicates = [];

  for (const c of customers) {
    if (names.has(c.name)) {
      duplicates.push(c);
    } else {
      names.set(c.name, 1);
    }
  }

  if (duplicates.length === 0) {
    console.log("No duplicates found.");
    return;
  }

  console.log(`Found ${duplicates.length} duplicate(s). Renaming them...`);

  for (const c of duplicates) {
    const newName = `${c.name} (Duplicate ${c.id})`;
    await prisma.customer.update({
      where: { id: c.id },
      data: { name: newName },
    });
    console.log(`Renamed: "${c.name}" (ID: ${c.id}) -> "${newName}"`);
  }

  console.log("Duplicate cleanup complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
