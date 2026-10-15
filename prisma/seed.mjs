import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Readwise2026!', 10);

  const demoUsers = [
    {
      email: 'alex@readwise.io',
      firstName: 'Alex',
      lastName: 'Reader',
      username: 'alex2635',
      onboardingStep: '/new',
      onboardedAt: new Date(),
    },
    {
      email: 'rwreader_ibvxp37l@maxxspace.com',
      firstName: 'Alex',
      lastName: '',
      username: 'rwreader_ibvxp37l',
      onboardingStep: '/new',
      onboardedAt: new Date(),
    },
  ];

  for (const u of demoUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash },
      create: {
        email: u.email,
        name: `${u.firstName} ${u.lastName}`.trim(),
        firstName: u.firstName,
        lastName: u.lastName,
        username: u.username,
        passwordHash,
        onboardingStep: u.onboardingStep,
        onboardedAt: u.onboardedAt,
        customLibraryEmail: `${u.username}@library.readwise.io`,
        customFeedEmail: `${u.username}@feed.readwise.io`,
      },
    });
  }

  console.log('Seeded base demo users (alex@readwise.io / Readwise2026!)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
