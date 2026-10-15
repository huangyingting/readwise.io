import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { ensureUserSeeded, DEFAULT_USER_SETTINGS } from './default-data';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/accounts/login',
    newUser: '/welcome',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        mode: { label: 'Mode', type: 'text' },
        firstName: { label: 'First Name', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter both email and password.');
        }

        const email = credentials.email.trim().toLowerCase();
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (credentials.mode === 'signup') {
          if (existingUser) {
            throw new Error('An account with this email already exists.');
          }
          const passwordHash = await bcrypt.hash(credentials.password, 10);
          const prefix = email.split('@')[0].replace(/[^a-z0-9]/gi, '').slice(0, 12) || 'user';
          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
          const username = `${prefix}${randomSuffix}`;
          const firstName = credentials.firstName?.trim() || 'Alex';

          const newUser = await prisma.user.create({
            data: {
              email,
              name: firstName,
              firstName,
              username,
              passwordHash,
              customLibraryEmail: `${username}@library.readwise.io`,
              customFeedEmail: `${username}@feed.readwise.io`,
              onboardingStep: '/welcome',
              settingsJson: JSON.stringify(DEFAULT_USER_SETTINGS),
            },
          });

          await ensureUserSeeded(prisma, newUser.id, newUser.email);
          return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.firstName,
          };
        }

        if (!existingUser || !existingUser.passwordHash) {
          throw new Error('The email address and/or password you specified are not correct.');
        }

        const isValid = await bcrypt.compare(credentials.password, existingUser.passwordHash);
        if (!isValid) {
          throw new Error('The email address and/or password you specified are not correct.');
        }

        await ensureUserSeeded(prisma, existingUser.id, existingUser.email);

        return {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.firstName || existingUser.name || email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'readwise-reader-super-secret-jwt-key-2026',
};

export async function getOrCreateActiveUser(sessionEmail?: string | null) {
  const email = sessionEmail || 'alex@readwise.io';
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const passwordHash = await bcrypt.hash('Readwise2026!', 10);
    const prefix = email.split('@')[0].replace(/[^a-z0-9]/gi, '').slice(0, 10) || 'alex';
    user = await prisma.user.create({
      data: {
        email,
        name: 'Alex',
        firstName: 'Alex',
        username: `${prefix}${Math.floor(100 + Math.random() * 900)}`,
        passwordHash,
        customLibraryEmail: `${prefix}@library.readwise.io`,
        customFeedEmail: `${prefix}@feed.readwise.io`,
        onboardingStep: '/new',
        onboardedAt: new Date(),
        settingsJson: JSON.stringify(DEFAULT_USER_SETTINGS),
      },
    });
  }
  await ensureUserSeeded(prisma, user.id, user.email);
  return user;
}
