const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function daysFromNow(days, hour, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  const count = await prisma.slot.count();
  if (count > 0) {
    console.log("Database already has slots — skipping seed.");
    return;
  }

  await prisma.slot.createMany({
    data: [
      {
        title: "Morning Facility Tour",
        notes: "Meet at the main lobby 10 minutes early. Comfortable shoes recommended.",
        startsAt: daysFromNow(3, 10, 0),
        language: "ENGLISH",
        capacity: 4,
        expectedGuests: 20,
      },
      {
        title: "Recorrido en Español",
        notes: "Grupo comunitario — ¡se agradecen manos extra! Meet at the main lobby.",
        startsAt: daysFromNow(5, 14, 30),
        language: "SPANISH",
        capacity: 6,
        expectedGuests: 30,
      },
      {
        title: "VIP Donor Tour",
        notes: "Small group, business casual please.",
        startsAt: daysFromNow(10, 11, 0),
        language: "BILINGUAL",
        capacity: 2,
        expectedGuests: 8,
      },
    ],
  });

  console.log("Seeded 3 example tour slots (English, Spanish, Bilingual).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
