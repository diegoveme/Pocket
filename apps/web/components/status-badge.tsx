import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const TONES: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  info: 'bg-celeste-light text-navy',
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-yellow/40 text-navy',
  danger: 'bg-red-100 text-red-800',
};

/** Every state the API returns, with the words and color the UI shows for it. */
const STATUSES: Record<string, { label: string; tone: Tone }> = {
  // Verification
  not_submitted: { label: 'Not submitted', tone: 'neutral' },
  pending: { label: 'Pending', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  // Jobs
  open: { label: 'Open', tone: 'info' },
  in_progress: { label: 'In progress', tone: 'warning' },
  completed: { label: 'Completed', tone: 'success' },
  closed: { label: 'Closed', tone: 'neutral' },
  // Applications
  submitted: { label: 'Submitted', tone: 'info' },
  accepted: { label: 'Accepted', tone: 'success' },
  withdrawn: { label: 'Withdrawn', tone: 'neutral' },
  // Contracts
  awaiting_specialist: { label: 'Waiting for specialist', tone: 'warning' },
  awaiting_funding: { label: 'Waiting for funding', tone: 'warning' },
  active: { label: 'Active', tone: 'info' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  // Milestones
  delivered: { label: 'Delivered', tone: 'info' },
  changes_requested: { label: 'Changes requested', tone: 'warning' },
  paid: { label: 'Paid', tone: 'success' },
  disputed: { label: 'In dispute', tone: 'danger' },
  resolved: { label: 'Resolved', tone: 'neutral' },
};

export function statusLabel(status: string): string {
  return STATUSES[status]?.label ?? status;
}

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const known = STATUSES[status] ?? { label: status, tone: 'neutral' as const };
  return (
    <Badge
      variant="secondary"
      className={cn('border-0 font-medium', TONES[known.tone], className)}
    >
      {known.label}
    </Badge>
  );
}
