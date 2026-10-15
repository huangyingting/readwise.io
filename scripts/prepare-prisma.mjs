import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const schemaPath = path.join(rootDir, 'prisma', 'schema.prisma');

const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
const explicitProvider = process.env.DATABASE_PROVIDER;

const isPostgres =
  explicitProvider === 'postgresql' ||
  dbUrl.startsWith('postgres://') ||
  dbUrl.startsWith('postgresql://');

const targetProvider = isPostgres ? 'postgresql' : 'sqlite';

if (fs.existsSync(schemaPath)) {
  const current = fs.readFileSync(schemaPath, 'utf8');
  const updated = current.replace(
    /datasource db \{[\s\S]*?\}/,
    `datasource db {\n  provider = "${targetProvider}"\n  url      = env("DATABASE_URL")\n}`
  );
  if (current !== updated) {
    fs.writeFileSync(schemaPath, updated, 'utf8');
    console.log(`[prepare-prisma] Switched Prisma datasource provider to "${targetProvider}"`);
  } else {
    console.log(`[prepare-prisma] Prisma datasource provider is "${targetProvider}"`);
  }
}
