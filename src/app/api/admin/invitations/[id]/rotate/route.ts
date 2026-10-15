import { NextRequest, NextResponse } from 'next/server';
import { rotateAccountInvitation } from '@/lib/invitations';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;
    const grant = await rotateAccountInvitation(params.id, expiresAt);
    const origin = req.nextUrl.origin;
    const acceptUrl = `${origin}/invite/${grant.token}`;

    return NextResponse.json({
      ok: true,
      invitation: grant.invitation,
      token: grant.token,
      acceptUrl,
      delivery: grant.delivery,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Could not rotate invitation.', code: err.code },
      { status: err.status || 400 }
    );
  }
}
