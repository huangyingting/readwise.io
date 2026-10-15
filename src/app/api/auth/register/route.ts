import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { ensureUserSeeded, DEFAULT_USER_SETTINGS } from '@/lib/default-data';
import {
  accountAdmissionMode,
  validateAndClaimInvitation,
} from '@/lib/invitations';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';
    const firstName = (body.firstName || body.name || 'Alex').trim();
    const lastName = (body.lastName || '').trim();
    const rawToken = (body.token || '').trim();
    // Allow pasting full /invite/<token> URL or raw token
    const token = rawToken.includes('/invite/')
      ? rawToken.split('/invite/').pop()?.split(/[?#]/)[0] || ''
      : rawToken;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    const admissionMode = accountAdmissionMode();
    let matchedInvitation: { id: string } | null = null;
    if (admissionMode === 'invitation-only') {
      matchedInvitation = await validateAndClaimInvitation({
        token,
        email,
      });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'A user is already registered with this email address.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const prefix = email.split('@')[0].replace(/[^a-z0-9]/gi, '').slice(0, 10) || 'reader';
    const username = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;

    const user = await prisma.user.create({
      data: {
        email,
        emailVerified: new Date(),
        name: `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
        username,
        role: 'Reader',
        passwordHash,
        customLibraryEmail: `${username}@library.readwise.io`,
        customFeedEmail: `${username}@feed.readwise.io`,
        onboardingStep: '/welcome',
        settingsJson: JSON.stringify(DEFAULT_USER_SETTINGS),
      },
    });

    if (matchedInvitation) {
      await prisma.accountInvitation.update({
        where: { id: matchedInvitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedById: user.id,
          acceptedAt: new Date(),
          activeForEmail: null,
          tokenHash: null,
        },
      });
    }

    await ensureUserSeeded(prisma, user.id, user.email);

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          username: user.username,
          onboardingStep: user.onboardingStep,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Register error:', err);
    return NextResponse.json(
      { error: err.message || 'Registration failed', code: err.code },
      { status: err.status || 500 }
    );
  }
}

