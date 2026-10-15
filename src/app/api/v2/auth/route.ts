import { NextRequest, NextResponse } from 'next/server';
import { resolveApiUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await resolveApiUser(req);
  if (!user) {
    return NextResponse.json({ detail: 'Invalid token' }, { status: 401 });
  }
  return new NextResponse(null, { status: 204 });
}

