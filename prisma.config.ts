import { dirname, isAbsolute, join } from 'node:path';
import { defineConfig } from 'prisma/config';

const DEFAULT_SCHEMA = 'prisma/schema.prisma';
const SCHEMA_FLAG = '--schema';

function loadLocalEnv(): void {
  try {
    process.loadEnvFile?.('.env');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

function schemaPathFromArgs(args: string[]): string | undefined {
  const inline = args.find((arg) => arg.startsWith(`${SCHEMA_FLAG}=`));
  if (inline) {
    return inline.slice(`${SCHEMA_FLAG}=`.length);
  }

  const index = args.indexOf(SCHEMA_FLAG);
  if (index >= 0) {
    return args[index + 1];
  }

  return undefined;
}

function databaseUrlForPrismaAdapter(
  databaseUrl: string,
  schemaPath: string,
  cwd = process.cwd()
): string {
  if (!databaseUrl.startsWith('file:')) return databaseUrl;

  const value = databaseUrl.slice('file:'.length);
  const suffixStart = value.search(/[?#]/);
  const pathPart = suffixStart < 0 ? value : value.slice(0, suffixStart);
  const suffix = suffixStart < 0 ? '' : value.slice(suffixStart);

  if (
    pathPart.length === 0 ||
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

loadLocalEnv();

const schema =
  schemaPathFromArgs(process.argv) ?? process.env.PRISMA_SCHEMA_PATH ?? DEFAULT_SCHEMA;

export default defineConfig({
  schema,
  migrations: {
    path: join(dirname(schema), 'migrations'),
  },
  datasource: {
    url: databaseUrlForPrismaAdapter(
      process.env.DATABASE_URL ?? 'file:./dev.db',
      schema,
      process.cwd()
    ),
  },
});
