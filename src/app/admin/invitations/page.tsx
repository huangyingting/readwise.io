'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { Copy, Check, MailPlus, RefreshCw, UserX, ShieldCheck } from 'lucide-react';

type Invitation = {
  id: string;
  email: string;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  invitedBy?: { id: string; name: string | null; firstName?: string } | null;
  acceptedBy?: { id: string; name: string | null; firstName?: string } | null;
};

export default function AdminInvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [mode, setMode] = useState<string>('invitation-only');
  const [emailInput, setEmailInput] = useState('');
  const [expiresAtInput, setExpiresAtInput] = useState('');
  const [pending, setPending] = useState(false);
  const [rowPending, setRowPending] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [latestLink, setLatestLink] = useState('');
  const [latestToken, setLatestToken] = useState('');
  const [copied, setCopied] = useState(false);

  const loadInvitations = async () => {
    const res = await fetch('/api/admin/invitations');
    const data = await res.json();
    if (data.invitations) setInvitations(data.invitations);
    if (data.mode) setMode(data.mode);
  };

  useEffect(() => {
    loadInvitations();
  }, []);

  const mergeInvitation = (inv: Invitation) => {
    setInvitations((curr) => {
      const exists = curr.some((item) => item.id === inv.id);
      return exists ? curr.map((item) => (item.id === inv.id ? { ...item, ...inv } : item)) : [inv, ...curr];
    });
  };

  const handleCreateInvitation = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError('');
    setLatestLink('');
    setLatestToken('');
    try {
      const res = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.trim(),
          expiresAt: expiresAtInput ? new Date(expiresAtInput).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'The invitation could not be created.');
        return;
      }
      mergeInvitation(data.invitation);
      setLatestLink(data.acceptUrl || '');
      setLatestToken(data.token || '');
      setCopied(false);
      setEmailInput('');
      setExpiresAtInput('');
    } catch {
      setError('The invitation could not be created.');
    } finally {
      setPending(false);
    }
  };

  const handleRotate = async (id: string) => {
    setRowPending(id);
    setError('');
    try {
      const res = await fetch(`/api/admin/invitations/${encodeURIComponent(id)}/rotate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'The invitation link could not be rotated.');
        return;
      }
      mergeInvitation(data.invitation);
      setLatestLink(data.acceptUrl || '');
      setLatestToken(data.token || '');
      setCopied(false);
    } finally {
      setRowPending(null);
    }
  };

  const handleRevoke = async (id: string) => {
    setRowPending(id);
    setError('');
    try {
      const res = await fetch(`/api/admin/invitations/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'The invitation could not be revoked.');
        return;
      }
      mergeInvitation(data.invitation);
    } finally {
      setRowPending(null);
    }
  };

  return (
    <WorkspaceShell
      title="Account Invitations (Invite-Only Admission)"
      subtitle="Generate one-time registration links, rotate active tokens, or revoke pending invitations"
    >
      <div className="mx-auto max-w-4xl space-y-6 p-6 text-xs">
        {/* Admission Policy Banner */}
        <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">
                Account Admission Mode: <span className="uppercase text-blue-600">{mode}</span>
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                New users must hold a valid, non-expired one-time invitation link (`/invite/[token]`) matching their email address to register.
              </div>
            </div>
          </div>
          <a
            href="/admin/bootstrap"
            className="rounded-xl border border-blue-300 bg-white px-3.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
          >
            Bootstrap Admin
          </a>
        </div>

        {/* Create Invitation Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#141821]">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Create invitation
          </h2>
          <p className="mt-1 text-gray-500">
            Send a one-time registration link. Invitations expire after seven days unless you choose a custom date.
          </p>

          <form onSubmit={handleCreateInvitation} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-gray-500">
                  Invited Email *
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="newreader@domain.com"
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                />
              </div>
              <div>
                <label className="block font-semibold uppercase tracking-wider text-gray-500">
                  Expiry (optional)
                </label>
                <input
                  name="expiresAt"
                  type="datetime-local"
                  value={expiresAtInput}
                  onChange={(e) => setExpiresAtInput(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </div>
            )}

            {latestLink && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-2 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                <div className="font-bold text-emerald-900 dark:text-emerald-200">
                  One-time invitation link ready (Copy and share securely):
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    readOnly
                    value={latestLink}
                    aria-label="One-time invitation link"
                    className="flex-1 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 font-mono text-xs dark:border-emerald-800 dark:bg-gray-900"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(latestLink);
                      setCopied(true);
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-500"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Copy link'}
                  </button>
                </div>
                <div className="text-[11px] text-emerald-800 dark:text-emerald-300">
                  Invitation Token: <code className="font-mono font-bold">{latestToken}</code>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={pending}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
              >
                <MailPlus className="h-4 w-4" />
                {pending ? 'Creating…' : 'Create invitation'}
              </button>
            </div>
          </form>
        </div>

        {/* Invitations Table */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#141821]">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
            Invitations ({invitations.length})
          </h2>

          {invitations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-gray-400 dark:border-gray-800">
              No invitations yet. Create an invitation above to admit new accounts.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-[11px] uppercase text-gray-400 dark:border-gray-800">
                    <th className="py-2.5 pr-4">Email</th>
                    <th className="py-2.5 pr-4">Status</th>
                    <th className="py-2.5 pr-4">Expires</th>
                    <th className="py-2.5 pr-4">Created</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {invitations.map((inv) => (
                    <tr key={inv.id}>
                      <td className="py-3 pr-4 font-semibold text-gray-900 dark:text-white">
                        {inv.email}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            inv.status === 'PENDING'
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                              : inv.status === 'ACCEPTED'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                              : inv.status === 'REVOKED'
                              ? 'bg-red-500/15 text-red-600 dark:text-red-300'
                              : 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-500">
                        {new Date(inv.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-4 text-gray-500">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right">
                        {inv.status === 'PENDING' ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleRotate(inv.id)}
                              disabled={rowPending === inv.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 font-semibold hover:bg-gray-50 dark:border-gray-700"
                            >
                              <RefreshCw className="h-3 w-3" />
                              Rotate link
                            </button>
                            <button
                              onClick={() => handleRevoke(inv.id)}
                              disabled={rowPending === inv.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/50"
                            >
                              <UserX className="h-3 w-3" />
                              Revoke
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400">No actions</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </WorkspaceShell>
  );
}
