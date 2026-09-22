'use client';

import {
  TRUSTLESS_WORK_FEE_PERCENT,
  totalAfterTrustlessWorkFee,
  type Applicant,
} from '@pocket/shared';
import { useMutation } from '@tanstack/react-query';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api, errorMessage } from '@/lib/api';
import { todayIso, usdc } from '@/lib/format';
import { cn } from '@/lib/utils';

interface MilestoneDraft {
  title: string;
  description: string;
  amount: string;
  dueDate: string;
}

const MAX_MILESTONES = 5;

/** Amounts in units of 10^-7 USDC, so the running total has no floating point drift. */
function toStroops(amount: string): bigint {
  const [whole = '0', fraction = ''] = amount.trim().split('.');
  if (!/^\d*$/.test(whole) || !/^\d*$/.test(fraction)) return BigInt(0);
  return (
    BigInt(whole || '0') * BigInt(10_000_000) + BigInt((fraction + '0000000').slice(0, 7))
  );
}

function fromStroops(value: bigint): string {
  const sign = value < BigInt(0) ? '-' : '';
  const abs = value < BigInt(0) ? -value : value;
  const whole = abs / BigInt(10_000_000);
  const fraction = (abs % BigInt(10_000_000))
    .toString()
    .padStart(7, '0')
    .replace(/0+$/, '');
  return `${sign}${whole}${fraction ? `.${fraction}` : ''}`;
}

/**
 * The startup hires an applicant: it splits the agreed price into 1 to 5
 * milestones. The API refuses totals that do not match exactly, so the dialog
 * shows how much is left to assign.
 */
export function HireDialog({ applicant }: { applicant: Applicant }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([
    { title: '', description: '', amount: applicant.price, dueDate: '' },
  ]);

  const total = milestones.reduce(
    (sum, milestone) => sum + toStroops(milestone.amount),
    BigInt(0),
  );
  const remaining = toStroops(applicant.price) - total;

  const hire = useMutation({
    mutationFn: () =>
      api<{ id: string }>('/contracts', {
        method: 'POST',
        body: {
          applicationId: applicant.id,
          milestones: milestones.map((milestone) => ({
            title: milestone.title.trim(),
            description: milestone.description.trim(),
            amount: Number(milestone.amount),
            dueDate: milestone.dueDate,
          })),
        },
      }),
    onSuccess: (contract) => {
      toast.success('Terms sent. The specialist has to accept them.');
      router.push(`/contracts/${contract.id}`);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  function update(index: number, patch: Partial<MilestoneDraft>) {
    setMilestones((current) =>
      current.map((m, i) => (i === index ? { ...m, ...patch } : m)),
    );
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (remaining !== BigInt(0)) {
      toast.error(`The milestones must add up to ${usdc(applicant.price)}`);
      return;
    }
    hire.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Hire</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Hire {applicant.specialist?.displayName ?? 'this specialist'}
          </DialogTitle>
          <DialogDescription>
            Split the agreed {usdc(applicant.price)} into milestones. Each one is paid
            when you approve its delivery.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {milestones.map((milestone, index) => (
            <div key={index} className="space-y-3 rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-navy">Milestone {index + 1}</p>
                {milestones.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove milestone"
                    onClick={() =>
                      setMilestones((current) => current.filter((_, i) => i !== index))
                    }
                  >
                    <Trash2Icon />
                  </Button>
                ) : null}
              </div>
              <Input
                placeholder="Title"
                required
                minLength={3}
                maxLength={120}
                value={milestone.title}
                onChange={(event) => update(index, { title: event.target.value })}
              />
              <Textarea
                placeholder="What has to be delivered"
                required
                minLength={10}
                maxLength={2000}
                rows={2}
                value={milestone.description}
                onChange={(event) => update(index, { description: event.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="Amount (USDC)"
                  required
                  min={1}
                  step="any"
                  value={milestone.amount}
                  onChange={(event) => update(index, { amount: event.target.value })}
                />
                <Input
                  type="date"
                  required
                  min={todayIso()}
                  value={milestone.dueDate}
                  onChange={(event) => update(index, { dueDate: event.target.value })}
                />
              </div>
            </div>
          ))}

          {milestones.length < MAX_MILESTONES ? (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setMilestones((current) => [
                  ...current,
                  {
                    title: '',
                    description: '',
                    amount: remaining > BigInt(0) ? fromStroops(remaining) : '',
                    dueDate: '',
                  },
                ])
              }
            >
              <PlusIcon /> Add milestone
            </Button>
          ) : null}

          <p
            className={cn(
              'text-sm',
              remaining === BigInt(0) ? 'text-emerald-700' : 'text-destructive',
            )}
          >
            {remaining === BigInt(0)
              ? 'The milestones add up to the agreed price.'
              : remaining > BigInt(0)
                ? `${usdc(fromStroops(remaining))} still to assign.`
                : `${usdc(fromStroops(-remaining))} over the agreed price.`}
          </p>

          {remaining === BigInt(0) ? (
            <p className="rounded-lg bg-celeste-light/40 px-3 py-2 text-sm text-muted-foreground">
              You fund the full {usdc(applicant.price)}. Trustless Work, which runs the
              escrow, keeps {TRUSTLESS_WORK_FEE_PERCENT}% of each payment, so{' '}
              {applicant.specialist?.displayName ?? 'the specialist'} receives{' '}
              {usdc(
                totalAfterTrustlessWorkFee(
                  milestones.map((milestone) => fromStroops(toStroops(milestone.amount))),
                ),
              )}{' '}
              in total. Pocket charges nothing.
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={hire.isPending || remaining !== BigInt(0)}>
              {hire.isPending ? 'Sending...' : 'Send terms'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
