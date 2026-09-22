'use client';

import type { JobListing, MyApplication, User } from '@pocket/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';
import { Field, formValues } from '@/components/form';
import { Detail, ErrorAlert, Loading, PageHeader } from '@/components/page';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api, errorMessage } from '@/lib/api';
import { CATEGORY_LABELS, date, usdc } from '@/lib/format';

export default function JobPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const job = useQuery({
    queryKey: ['jobs', id],
    queryFn: () => api<JobListing>(`/jobs/${id}`),
  });

  if (job.isLoading) return <Loading />;
  if (job.error || !job.data)
    return <ErrorAlert error={job.error} title="Job not found" />;
  const data = job.data;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <PageHeader
          title={data.title}
          description={data.startup?.companyName ?? 'A verified startup'}
        />
        <Card>
          <CardContent className="space-y-6 pt-6">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Detail label="Budget">{usdc(data.budget)}</Detail>
              <Detail label="Deadline">{date(data.deadline)}</Detail>
              <Detail label="Category">{CATEGORY_LABELS[data.category]}</Detail>
              <Detail label="Status">
                <StatusBadge status={data.status} />
              </Detail>
            </dl>
            <section>
              <h2 className="text-lg font-semibold text-navy">Scope</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
                {data.description}
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-navy">Expected deliverables</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
                {data.deliverables}
              </p>
            </section>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-4">
        {!user ? (
          <Card>
            <CardHeader>
              <CardTitle>Want this job?</CardTitle>
              <CardDescription>
                Connect your wallet as a specialist to apply.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/connect">Connect wallet</Link>
              </Button>
            </CardContent>
          </Card>
        ) : user.role === 'specialist' ? (
          <ApplyCard job={data} user={user} />
        ) : user.id === data.startupId ? (
          <OwnerCard job={data} />
        ) : null}
      </aside>
    </div>
  );
}

function ApplyCard({ job, user }: { job: JobListing; user: User }) {
  const queryClient = useQueryClient();
  const mine = useQuery({
    queryKey: ['applications', 'mine'],
    queryFn: () => api<MyApplication[]>('/applications/mine'),
  });
  const existing = mine.data?.find((application) => application.jobId === job.id);

  const apply = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api(`/jobs/${job.id}/applications`, { method: 'POST', body }),
    onSuccess: async () => {
      toast.success('Application sent');
      await queryClient.invalidateQueries({ queryKey: ['applications', 'mine'] });
      await queryClient.invalidateQueries({ queryKey: ['jobs', job.id] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = formValues(event.currentTarget);
    apply.mutate({
      proposal: values.proposal,
      price: Number(values.price),
      estimatedDays: Number(values.estimatedDays),
    });
  }

  if (existing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>You applied</CardTitle>
          <CardDescription>
            {usdc(existing.price)} in {existing.estimatedDays} days
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <StatusBadge status={existing.status} />
          <Button asChild variant="link">
            <Link href="/applications">My applications</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (job.status !== 'open') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No longer taking applications</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (user.verificationStatus !== 'approved') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Get verified to apply</CardTitle>
          <CardDescription>
            A Pocket manager reviews every specialist first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/verification">Go to verification</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apply</CardTitle>
        <CardDescription>
          You can offer a different price than the budget.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field
            label="Proposal"
            htmlFor="proposal"
            hint="Why you, and how you would do it."
            required
          >
            <Textarea
              id="proposal"
              name="proposal"
              required
              minLength={50}
              maxLength={5000}
              rows={6}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (USDC)" htmlFor="price" required>
              <Input
                id="price"
                name="price"
                type="number"
                required
                min={1}
                step="any"
                defaultValue={Number(job.budget)}
              />
            </Field>
            <Field label="Days" htmlFor="estimatedDays" required>
              <Input
                id="estimatedDays"
                name="estimatedDays"
                type="number"
                required
                min={1}
                max={365}
              />
            </Field>
          </div>
          <Button type="submit" className="w-full" disabled={apply.isPending}>
            {apply.isPending ? 'Sending...' : 'Send application'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function OwnerCard({ job }: { job: JobListing }) {
  const queryClient = useQueryClient();
  const close = useMutation({
    mutationFn: () => api(`/jobs/${job.id}/close`, { method: 'POST' }),
    onSuccess: async () => {
      toast.success('Job closed');
      await queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your job</CardTitle>
        <CardDescription>{job.applicationCount} applications so far.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button asChild className="w-full">
          <Link href={`/jobs/${job.id}/applicants`}>Review applicants</Link>
        </Button>
        {job.status === 'open' ? (
          <Button
            variant="outline"
            className="w-full"
            disabled={close.isPending}
            onClick={() => {
              if (
                window.confirm(
                  'Close this job? Applications still waiting will be turned down.',
                )
              )
                close.mutate();
            }}
          >
            Close job
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
