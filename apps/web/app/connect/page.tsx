'use client';

import type { SignUpRole, User } from '@pocket/shared';
import { BriefcaseBusinessIcon, RocketIcon, WalletIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';
import { PageHeader } from '@/components/page';
import { Button } from '@/components/ui/button';
import { errorMessage } from '@/lib/api';
import { isWalletDismissed } from '@/lib/wallet';
import { cn } from '@/lib/utils';

const ROLES: {
  value: SignUpRole;
  title: string;
  text: string;
  icon: typeof RocketIcon;
}[] = [
  {
    value: 'startup',
    title: 'I am a startup',
    text: 'Post jobs, hire specialists and pay per milestone through escrow.',
    icon: RocketIcon,
  },
  {
    value: 'specialist',
    title: 'I am a specialist',
    text: 'Apply to jobs in growth, sales and marketing, and get paid in USDC.',
    icon: BriefcaseBusinessIcon,
  },
];

/** Where a user lands after signing in. */
function homeFor(user: User): string {
  if (user.role === 'manager') return '/manager/verifications';
  if (user.verificationStatus !== 'approved') return '/verification';
  return user.role === 'startup' ? '/dashboard' : '/jobs';
}

export default function ConnectPage() {
  const { status, user, pendingSignUp, signIn, chooseRole, cancelSignUp } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [role, setRole] = useState<SignUpRole | null>(null);

  useEffect(() => {
    if (status === 'signed-in' && user) router.replace(homeFor(user));
  }, [status, user, router]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      if (!isWalletDismissed(error)) toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  if (pendingSignUp) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="Create your account"
          description="Your wallet is your account. Choose how you will use Pocket. This cannot be changed later."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {ROLES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRole(option.value)}
              className={cn(
                'rounded-2xl border-2 bg-card p-6 text-left transition hover:border-celeste',
                role === option.value ? 'border-navy' : 'border-border',
              )}
            >
              <option.icon className="size-7 text-navy" />
              <p className="mt-4 font-heading text-xl font-semibold text-navy">
                {option.title}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{option.text}</p>
            </button>
          ))}
        </div>
        <div className="mt-6 flex gap-2">
          <Button
            size="lg"
            disabled={!role || busy}
            onClick={() => role && run(() => chooseRole(role))}
          >
            Create account
          </Button>
          <Button size="lg" variant="ghost" onClick={cancelSignUp}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-navy text-yellow">
        <WalletIcon className="size-8" />
      </div>
      <h1 className="mt-6 text-3xl font-bold text-navy">Connect your Stellar wallet</h1>
      <p className="mt-3 text-muted-foreground">
        Sign in with Freighter, xBull, Lobstr, Albedo or another Stellar wallet. You sign
        a message to prove the wallet is yours. It costs nothing and moves no funds.
      </p>
      <Button
        size="lg"
        className="mt-8 h-11 px-6"
        disabled={busy}
        onClick={() => run(signIn)}
      >
        {busy ? 'Waiting for your wallet...' : 'Connect wallet'}
      </Button>
    </div>
  );
}
