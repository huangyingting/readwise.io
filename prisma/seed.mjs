import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rawUrl = process.env.DATABASE_URL || `file:${path.join(__dirname, 'dev.db')}`;
const isPostgres =
  process.env.DATABASE_PROVIDER === 'postgresql' ||
  rawUrl.startsWith('postgres://') ||
  rawUrl.startsWith('postgresql://');

const sqliteUrl =
  !isPostgres && rawUrl.startsWith('file:./')
    ? `file:${path.join(__dirname, rawUrl.slice('file:./'.length))}`
    : rawUrl;

const prisma = new PrismaClient({
  adapter: isPostgres
    ? new PrismaPg(rawUrl)
    : new PrismaBetterSqlite3({ url: sqliteUrl }),
});

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
