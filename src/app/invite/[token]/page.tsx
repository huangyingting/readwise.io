'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { AlertCircle, CheckCircle2, Lock, Mail, User, UserPlus } from 'lucide-react';

type InvitationView = {
  id: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired' | 'invalid';
  maskedEmail: string | null;
  expiresAt: string | null;
};

export default function InvitationAcceptancePage() {
  const params = useParams();
  const router = useRouter();
  const token = String(params?.token || '');

  const [invitation, setInvitation] = useState<InvitationView | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/auth/invitation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data.invitation) {
          setInvitation(data.invitation);
        } else {
          setError(data.error || 'The invitation could not be checked.');
        }
      })
      .catch(() => {
        if (active) setError('The invitation could not be checked.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setPending(true);
    try {
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name: name.trim(),
          firstName: name.trim() || email.split('@')[0],
          email: email.trim(),
          password,
        }),
      });
      const regData = await regRes.json();
      if (!regRes.ok) {
        setError(regData.error || 'The invitation could not be accepted.');
        setPending(false);
        return;
      }

      await signIn('credentials', {
        redirect: false,
        email: email.trim(),
        password,
        mode: 'login',
      });

      router.push('/welcome');
      router.refresh();
    } catch {
      setError('The invitation could not be accepted.');
    } finally {
      setPending(false);
    }
  }

  const statusMessages: Record<string, string> = {
    accepted: 'This invitation has already been used.',
    revoked: 'This invitation was revoked.',
    expired: 'This invitation has expired.',
    invalid: 'This invitation is invalid or no longer active.',
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gray-50 px-6 py-12 dark:bg-[#0b0d12]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/read" className="flex items-center justify-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-lg shadow-blue-600/30">
            R
          </div>
          <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Readwise <span className="text-blue-600 dark:text-blue-400">Reader</span>
          </span>
        </Link>
        <h1 className="mt-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
          Accept your invitation
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Create your password to finish joining Readwise.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white px-8 py-8 shadow-sm dark:border-gray-800 dark:bg-[#131722]">
          {loading ? (
            <div className="py-6 text-center text-sm text-gray-500">
              Checking invitation…
            </div>
          ) : invitation?.status !== 'pending' ? (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
            >
              <div className="font-semibold">
                {statusMessages[invitation?.status || 'invalid']}
              </div>
              <p className="mt-1 text-xs opacity-80">
                Ask your Readwise administrator to send or rotate a fresh one-time invitation link.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs font-medium text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" />
                <span>
                  This invitation is for <strong>{invitation.maskedEmail}</strong>.
                </span>
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <div className="relative mt-1">
                  <User className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    name="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Rivera"
                    maxLength={120}
                    className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Invited Email *
                </label>
                <p className="text-[11px] text-gray-500">
                  Enter the full email address that received this invitation.
                </p>
                <div className="relative mt-1">
                  <Mail className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Password *
                </label>
                <div className="relative mt-1">
                  <Lock className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    maxLength={128}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Use 8 to 128 characters"
                    className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Confirm Password *
                </label>
                <div className="relative mt-1">
                  <Lock className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    maxLength={128}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={pending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
              >
                <UserPlus className="h-4 w-4" />
                {pending ? 'Accepting invitation…' : 'Accept invitation'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
