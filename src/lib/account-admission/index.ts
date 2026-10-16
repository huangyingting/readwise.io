import { prisma } from '../prisma';
import bcrypt from 'bcryptjs';
import {
  ACCOUNT_ADMISSION_MODES,
  type AccountAdmissionMode,
  AccountAdmissionError,
  accountAdmissionMode,
  createAccountInvitation,
  createOpaqueToken,
  expirePendingInvitations,
  hashOpaqueToken,
  inspectAccountInvitation,
  isValidAccountEmail,
  listAccountInvitations,
  maskEmail,
  normalizeAccountEmail,
  revokeAccountInvitation,
  rotateAccountInvitation,
  validateAndClaimInvitation,
} from '../invitations';
import { DEFAULT_USER_SETTINGS, ensureUserSeeded } from '../default-data';

export {
  ACCOUNT_ADMISSION_MODES,
  type AccountAdmissionMode,
  AccountAdmissionError,
  accountAdmissionMode,
  createAccountInvitation,
  createOpaqueToken,
  expirePendingInvitations,
  hashOpaqueToken,
  inspectAccountInvitation,
  isValidAccountEmail,
  listAccountInvitations,
  maskEmail,
  normalizeAccountEmail,
  revokeAccountInvitation,
  rotateAccountInvitation,
  validateAndClaimInvitation,
};

/**
 * Provisions or promotes a root Administrator account from the deployment host CLI
 * (`npm run bootstrap:admin -- --email <email> --password-stdin`).
 *
 * Security invariant: Never exposed via an HTTP API endpoint or public web route.
 */
export async function bootstrapAdmin(input: {
  email: string;
  password: string;
  name?: string | null;
}) {
  const email = normalizeAccountEmail(input.email);
  if (!isValidAccountEmail(input.email)) {
    throw new AccountAdmissionError(
      400,
      'invalid_email',
      'Enter a valid administrator email address.'
    );
  }
  if (!input.password || input.password.length < 8 || input.password.length > 128) {
    throw new AccountAdmissionError(
      400,
      'invalid_password',
      'Administrator password must be between 8 and 128 characters.'
    );
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const displayName = input.name?.trim() || email.split('@')[0] || 'Admin';
  const prefix = email.split('@')[0].replace(/[^a-z0-9]/gi, '').slice(0, 12) || 'admin';
  const existing = await prisma.user.findUnique({ where: { email } });

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: displayName,
          firstName: displayName.split(' ')[0] || displayName,
          passwordHash,
          role: 'Admin',
          emailVerified: existing.emailVerified ?? new Date(),
        },
      })
    : await prisma.user.create({
        data: {
          email,
          name: displayName,
          firstName: displayName.split(' ')[0] || displayName,
          username: `${prefix}${Math.floor(1000 + Math.random() * 9000)}`,
          passwordHash,
          role: 'Admin',
          emailVerified: new Date(),
          customLibraryEmail: `${prefix}@library.readwise.io`,
          customFeedEmail: `${prefix}@feed.readwise.io`,
          onboardingStep: '/new',
          onboardedAt: new Date(),
          settingsJson: JSON.stringify(DEFAULT_USER_SETTINGS),
        },
      });

  await ensureUserSeeded(prisma, user.id, user.email);
  return { user, created: !existing };
}
