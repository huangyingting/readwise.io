import { NextRequest, NextResponse } from 'next/server';
import {
  accountAdmissionMode,
  inspectAccountInvitation,
} from '@/lib/invitations';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    mode: accountAdmissionMode(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = String(body.token || '');
    const invitation = await inspectAccountInvitation(token);
    return NextResponse.json({
      mode: accountAdmissionMode(),
      invitation,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Could not inspect invitation.' },
      { status: err.status || 400 }
    );
  }
}
