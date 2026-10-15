'use client';

import React, { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useReader } from '@/context/ReaderContext';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { User, Lock, CreditCard, LogOut, Check } from 'lucide-react';

export default function ProfilePage() {
  const { user, mutateState } = useReader();
  const [firstName, setFirstName] = useState(user?.firstName || 'Alex');
  const [lastName, setLastName] = useState(user?.lastName || 'Rivera');
  const [username, setUsername] = useState(user?.username || 'alexrivera');
  const [email, setEmail] = useState(user?.email || 'alex@readwise.io');
  const [newPassword, setNewPassword] = useState('');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutateState(
      'update-profile',
      {
        firstName,
        lastName,
        username,
        email,
        ...(newPassword ? { newPassword } : {}),
      },
      'Updated account profile settings'
    );
    setNewPassword('');
  };

  return (
    <WorkspaceShell
      title="Account & Profile Settings"
      subtitle="Manage your personal information, password, and Readwise Reader subscription"
    >
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        {/* Subscription Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-blue-600" />
            <div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">
                Full Readwise + Reader Trial ({user?.trialDaysRemaining ?? 30} days remaining)
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Includes unlimited highlights, PDF/EPUB uploads, YouTube transcripts, and Ghostreader AI.
              </div>
            </div>
          </div>
          <a
            href="/pricing"
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
          >
            View Plans &amp; Billing
          </a>
        </div>

        {/* Invite-Only Account Invitations Admin Link */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div>
            <div className="text-sm font-bold text-gray-900 dark:text-white">
              Invite-Only Account Admission (`/admin/invitations`)
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Generate one-time registration links (`/invite/[token]`), rotate active tokens, or revoke pending invitations.
            </div>
          </div>
          <a
            href="/admin/invitations"
            className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-500"
          >
            Manage Invitations →
          </a>
        </div>

        {/* Profile Form */}
        <form
          onSubmit={handleSaveProfile}
          className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#141821]"
        >
          <h2 className="flex items-center gap-2 text-base font-bold">
            <User className="h-4 w-4 text-blue-600" />
            Personal Information
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <Lock className="h-3.5 w-3.5" />
              Change Password (Optional)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
              className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/accounts/login' })}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>

            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500"
            >
              <Check className="h-3.5 w-3.5" />
              Save Changes
            </button>
          </div>
        </form>

        {/* Readwise Official REST API v2/v3 Token & Obsidian Vault Export */}
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#141821]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Readwise API Access Token (v2 &amp; v3)
              </h2>
              <p className="text-xs text-gray-500">
                Authenticate Obsidian, Logseq, Notion, Raycast, or custom scripts using{' '}
                <code>Authorization: Token &lt;your_token&gt;</code>
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                mutateState('regenerate-api-token', {}, 'Generated new Readwise API token')
              }
              className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 dark:border-gray-700"
            >
              Regenerate Token
            </button>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 font-mono text-xs text-blue-600 dark:border-gray-800 dark:bg-gray-900 dark:text-blue-400">
            {user?.apiToken || 'rw_live_alex_rivera_token'}
          </div>

          <div className="flex flex-wrap gap-2 pt-1 text-xs">
            <a
              href="/api/v2/export?format=obsidian"
              className="rounded-xl bg-indigo-600 px-3.5 py-2 font-semibold text-white hover:bg-indigo-500"
            >
              Download Obsidian Vault (.md)
            </a>
            <a
              href="/api/v2/highlights"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-gray-200 px-3 py-2 font-semibold hover:bg-gray-50 dark:border-gray-700"
            >
              GET /api/v2/highlights ↗
            </a>
            <a
              href="/api/v2/books"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-gray-200 px-3 py-2 font-semibold hover:bg-gray-50 dark:border-gray-700"
            >
              GET /api/v2/books ↗
            </a>
            <a
              href="/api/v3/list"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-gray-200 px-3 py-2 font-semibold hover:bg-gray-50 dark:border-gray-700"
            >
              GET /api/v3/list ↗
            </a>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
