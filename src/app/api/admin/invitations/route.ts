import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, getOrCreateActiveUser } from '@/lib/auth';
import {
  accountAdmissionMode,
  createAccountInvitation,
  listAccountInvitations,
} from '@/lib/invitations';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const invitations = await listAccountInvitations();
    return NextResponse.json({
      mode: accountAdmissionMode(),
      invitations,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to list invitations' },
      { status: err.status || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const actor = await getOrCreateActiveUser(session?.user?.email);
    const body = await req.json();
    const email = String(body.email || '').trim();
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;

    const grant = await createAccountInvitation({
      email,
      invitedById: actor.id,
      expiresAt,
    });

    const origin = req.nextUrl.origin;
    const acceptUrl = `${origin}/invite/${grant.token}`;

    return NextResponse.json(
      {
        ok: true,
        invitation: grant.invitation,
        token: grant.token,
        acceptUrl,
        delivery: grant.delivery,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Could not create invitation.', code: err.code },
      { status: err.status || 400 }
    );
  }
}
