import { dirname, isAbsolute, join } from 'node:path';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function normalizeSqliteUrl(
  databaseUrl: string,
  schemaPath = process.env.PRISMA_SCHEMA_PATH ?? 'prisma/schema.prisma',
  cwd = process.cwd()
): string {
  if (!databaseUrl.startsWith('file:')) return databaseUrl;
  const value = databaseUrl.slice('file:'.length);
  const suffixStart = value.search(/[?#]/);
  const pathPart = suffixStart < 0 ? value : value.slice(0, suffixStart);
  const suffix = suffixStart < 0 ? '' : value.slice(suffixStart);
  if (
    !pathPart ||
    pathPart === ':memory:' ||
    suffix.toLowerCase().includes('mode=memory') ||
    pathPart.startsWith('/') ||
    /^[a-zA-Z]:[\\/]/.test(pathPart)
  ) {
    return databaseUrl;
  }
  const absoluteSchemaPath = isAbsolute(schemaPath) ? schemaPath : join(cwd, schemaPath);
  const resolvedPath = join(dirname(absoluteSchemaPath), pathPart).replace(/\\/g, '/');
  return `file:${resolvedPath}${suffix}`;
}

function createPrismaClient(): PrismaClient {
  const rawUrl = process.env.DATABASE_URL ?? 'file:./dev.db';
  const isPostgres =
    process.env.DATABASE_PROVIDER === 'postgresql' ||
    rawUrl.startsWith('postgres://') ||
    rawUrl.startsWith('postgresql://');

  const log: Array<'error' | 'warn'> =
    process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'];

  if (isPostgres) {
    const schema = new URL(rawUrl).searchParams.get('schema') ?? undefined;
    return new PrismaClient({
      adapter: new PrismaPg(rawUrl, schema ? { schema } : undefined),
      log,
    });
  }

  return new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: normalizeSqliteUrl(rawUrl) }),
    log,
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
