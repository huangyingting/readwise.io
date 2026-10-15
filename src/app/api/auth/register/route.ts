import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { ensureUserSeeded, DEFAULT_USER_SETTINGS } from '@/lib/default-data';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';
    const firstName = (body.firstName || 'Alex').trim();
    const lastName = (body.lastName || '').trim();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'A user is already registered with this email address.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const prefix = email.split('@')[0].replace(/[^a-z0-9]/gi, '').slice(0, 10) || 'reader';
    const username = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;

    const user = await prisma.user.create({
      data: {
        email,
        name: `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
        username,
        passwordHash,
        customLibraryEmail: `${username}@library.readwise.io`,
        customFeedEmail: `${username}@feed.readwise.io`,
        onboardingStep: '/welcome',
        settingsJson: JSON.stringify(DEFAULT_USER_SETTINGS),
      },
    });

    await ensureUserSeeded(prisma, user.id, user.email);

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        username: user.username,
        onboardingStep: user.onboardingStep,
      },
    });
  } catch (err: any) {
    console.error('Register error:', err);
    return NextResponse.json({ error: err.message || 'Registration failed' }, { status: 500 });
  }
}
