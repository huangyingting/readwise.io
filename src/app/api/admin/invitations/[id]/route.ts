import { NextRequest, NextResponse } from 'next/server';
import { revokeAccountInvitation } from '@/lib/invitations';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invitation = await revokeAccountInvitation(id);
    return NextResponse.json({
      ok: true,
      invitation,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Could not revoke invitation.', code: err.code },
      { status: err.status || 400 }
    );
  }
}
