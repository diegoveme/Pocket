'use client';

import type { DisputeListItem, DisputeStatus } from '@pocket/shared';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { EmptyState, ErrorAlert, Loading, PageHeader } from '@/components/page';
import { RequireAuth } from '@/components/require-auth';
import { StatusBadge } from '@/components/status-badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { dateTime, usdc } from '@/lib/format';

export default function ManagerDisputesPage() {
  return <RequireAuth roles={['manager']}>{() => <Disputes />}</RequireAuth>;
}

function Disputes() {
  const [status, setStatus] = useState<DisputeStatus>('open');
  const disputes = useQuery({
    queryKey: ['disputes', 'list', status],
    queryFn: () => api<DisputeListItem[]>(`/manager/disputes?status=${status}`),
  });

  return (
    <div>
      <PageHeader
        title="Disputes"
        description="Oldest first. Read both sides, then pay, refund or split."
      />
      <Tabs
        value={status}
        onValueChange={(value) => setStatus(value as DisputeStatus)}
        className="mb-6"
      >
        <TabsList>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>
      </Tabs>
      {disputes.isLoading ? (
        <Loading />
      ) : disputes.error ? (
        <ErrorAlert error={disputes.error} />
      ) : disputes.data && disputes.data.length > 0 ? (
        <div className="space-y-3">
          {disputes.data.map((dispute) => (
            <Link
              key={dispute.id}
              href={`/disputes/${dispute.id}`}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 transition hover:border-celeste md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <p className="font-heading text-lg font-semibold text-navy">
                  {dispute.milestone.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {dispute.milestone.contract.job.title} · opened{' '}
                  {dateTime(dispute.createdAt)}
                </p>
                <p className="mt-1 line-clamp-1 text-sm">{dispute.reason}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-navy">
                  {usdc(dispute.milestone.amount)}
                </span>
                <StatusBadge status={dispute.status} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title={status === 'open' ? 'No open disputes' : 'No resolved disputes yet'}
        />
      )}
    </div>
  );
}
