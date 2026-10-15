import { createHash, randomBytes } from 'crypto';
import { prisma } from './prisma';

export const ACCOUNT_ADMISSION_MODES = ['invitation-only', 'public'] as const;
export type AccountAdmissionMode = (typeof ACCOUNT_ADMISSION_MODES)[number];

const DEFAULT_INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export class AccountAdmissionError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function accountAdmissionMode(): AccountAdmissionMode {
  const configured = process.env.ACCOUNT_ADMISSION_MODE?.trim().toLowerCase();
  return configured === 'public' || configured === 'invitation-only'
    ? configured
    : 'invitation-only';
}

export function normalizeAccountEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidAccountEmail(email: string): boolean {
  const normalized = normalizeAccountEmail(email);
  const separator = normalized.indexOf('@');
  return (
    normalized.length <= 320 &&
    separator > 0 &&
    separator === normalized.lastIndexOf('@') &&
    separator < normalized.length - 1 &&
    !/\s/.test(normalized)
  );
}

export function createOpaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashOpaqueToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('base64url');
}

export function maskEmail(email: string): string {
  const [local = '', domain = ''] = email.split('@');
  if (!domain) return '***';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(1, local.length - visible.length))}@${domain}`;
}

function invitationExpiry(now: Date, requested?: Date): Date {
  const expiresAt = requested ?? new Date(now.getTime() + DEFAULT_INVITATION_TTL_MS);
  if (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= now.getTime()) {
    throw new AccountAdmissionError(
      400,
      'invalid_expiry',
      'Invitation expiry must be in the future.'
    );
  }
  return expiresAt;
}

export async function expirePendingInvitations(now = new Date()): Promise<number> {
  const result = await prisma.accountInvitation.updateMany({
    where: {
      status: 'PENDING',
      expiresAt: { lte: now },
    },
    data: {
      status: 'EXPIRED',
      activeForEmail: null,
      tokenHash: null,
    },
  });
  return result.count;
}

export async function listAccountInvitations() {
  await expirePendingInvitations();
  return prisma.accountInvitation.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      invitedBy: { select: { id: true, name: true, firstName: true, email: true } },
      acceptedBy: { select: { id: true, name: true, firstName: true, email: true } },
    },
  });
}

export async function createAccountInvitation(input: {
  email: string;
  invitedById?: string;
  expiresAt?: Date;
}) {
  if (!isValidAccountEmail(input.email)) {
    throw new AccountAdmissionError(400, 'invalid_email', 'Enter a valid email address.');
  }
  const normalizedEmail = normalizeAccountEmail(input.email);
  const token = createOpaqueToken();
  const tokenHash = hashOpaqueToken(token);
  const now = new Date();
  const expiresAt = invitationExpiry(now, input.expiresAt);

  await prisma.accountInvitation.updateMany({
    where: {
      activeForEmail: normalizedEmail,
      status: 'PENDING',
      expiresAt: { lte: now },
    },
    data: {
      status: 'EXPIRED',
      activeForEmail: null,
      tokenHash: null,
    },
  });

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (existingUser) {
    throw new AccountAdmissionError(
      409,
      'already_member',
      'A Readwise account already exists for this email.'
    );
  }

  const active = await prisma.accountInvitation.findUnique({
    where: { activeForEmail: normalizedEmail },
    select: { id: true },
  });
  if (active) {
    throw new AccountAdmissionError(
      409,
      'invitation_exists',
      'An active invitation already exists for this email.'
    );
  }

  const invitation = await prisma.accountInvitation.create({
    data: {
      email: input.email.trim(),
      normalizedEmail,
      activeForEmail: normalizedEmail,
      tokenHash,
      invitedById: input.invitedById || null,
      expiresAt,
      status: 'PENDING',
    },
  });

  return {
    invitation,
    token,
    delivery: {
      queued: false,
      reason: 'manual_share',
    },
  };
}

export async function inspectAccountInvitation(token: string, now = new Date()) {
  const cleanToken = (token || '').trim();
  if (!cleanToken) {
    return { id: '', status: 'invalid' as const, maskedEmail: null, expiresAt: null };
  }
  const tokenHash = hashOpaqueToken(cleanToken);
  const invitation = await prisma.accountInvitation.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      email: true,
      status: true,
      expiresAt: true,
    },
  });

  if (!invitation) {
    return { id: '', status: 'invalid' as const, maskedEmail: null, expiresAt: null };
  }

  if (invitation.status === 'PENDING' && invitation.expiresAt <= now) {
    await prisma.accountInvitation.updateMany({
      where: { id: invitation.id, status: 'PENDING', tokenHash },
      data: {
        status: 'EXPIRED',
        activeForEmail: null,
        tokenHash: null,
      },
    });
    return {
      id: invitation.id,
      status: 'expired' as const,
      maskedEmail: maskEmail(invitation.email),
      expiresAt: invitation.expiresAt,
    };
  }

  return {
    id: invitation.id,
    status: invitation.status.toLowerCase() as
      | 'pending'
      | 'accepted'
      | 'revoked'
      | 'expired'
      | 'invalid',
    maskedEmail: maskEmail(invitation.email),
    expiresAt: invitation.expiresAt,
  };
}

export async function rotateAccountInvitation(id: string, requestedExpiry?: Date) {
  const now = new Date();
  const expiresAt = invitationExpiry(now, requestedExpiry);
  const token = createOpaqueToken();
  const tokenHash = hashOpaqueToken(token);

  const invitation = await prisma.accountInvitation.findUnique({ where: { id } });
  if (!invitation) {
    throw new AccountAdmissionError(404, 'not_found', 'Invitation not found.');
  }
  if (invitation.status !== 'PENDING') {
    throw new AccountAdmissionError(
      409,
      'invalid_transition',
      'Only a pending invitation can be rotated.'
    );
  }

  const updated = await prisma.accountInvitation.update({
    where: { id },
    data: {
      tokenHash,
      activeForEmail: invitation.normalizedEmail,
      expiresAt,
    },
  });

  return {
    invitation: updated,
    token,
    delivery: {
      queued: false,
      reason: 'manual_share',
    },
  };
}

export async function revokeAccountInvitation(id: string) {
  const now = new Date();
  const invitation = await prisma.accountInvitation.findUnique({ where: { id } });
  if (!invitation) {
    throw new AccountAdmissionError(404, 'not_found', 'Invitation not found.');
  }
  if (invitation.status === 'REVOKED') {
    return invitation;
  }
  if (invitation.status !== 'PENDING') {
    throw new AccountAdmissionError(
      409,
      'invalid_transition',
      'Only a pending invitation can be revoked.'
    );
  }

  return prisma.accountInvitation.update({
    where: { id },
    data: {
      status: 'REVOKED',
      revokedAt: now,
      activeForEmail: null,
      tokenHash: null,
    },
  });
}

export async function validateAndClaimInvitation(input: {
  token: string;
  email: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const normalizedEmail = normalizeAccountEmail(input.email);
  const cleanToken = (input.token || '').trim();
  if (!cleanToken) {
    throw new AccountAdmissionError(
      403,
      'invitation_required',
      'A valid invitation is required to create an account.'
    );
  }

  const tokenHash = hashOpaqueToken(cleanToken);
  const invitation = await prisma.accountInvitation.findUnique({
    where: { tokenHash },
  });

  if (!invitation || invitation.status !== 'PENDING') {
    throw new AccountAdmissionError(
      410,
      'invalid_invitation',
      'This invitation is invalid or no longer active.'
    );
  }

  if (invitation.expiresAt <= now) {
    await prisma.accountInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'EXPIRED',
        activeForEmail: null,
        tokenHash: null,
      },
    });
    throw new AccountAdmissionError(410, 'expired', 'This invitation has expired.');
  }

  if (invitation.normalizedEmail !== normalizedEmail) {
    throw new AccountAdmissionError(
      403,
      'email_mismatch',
      'The invitation does not match this email address.'
    );
  }

  return invitation;
}
