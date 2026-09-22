'use client';

import { ServiceCategory, type Job } from '@pocket/shared';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Field, formValues } from '@/components/form';
import { PageHeader } from '@/components/page';
import { RequireAuth } from '@/components/require-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ApiError, api, errorMessage } from '@/lib/api';
import { CATEGORY_LABELS, todayIso } from '@/lib/format';

export default function NewJobPage() {
  return (
    <RequireAuth roles={['startup']} verified>
      {() => <NewJob />}
    </RequireAuth>
  );
}

function NewJob() {
  const router = useRouter();
  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api<Job>('/jobs', { method: 'POST', body }),
    onSuccess: (job) => {
      toast.success('Job posted');
      router.push(`/jobs/${job.id}`);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.message.includes('profile')) {
        toast.error(error.message, {
          action: { label: 'Fill in profile', onClick: () => router.push('/profile') },
        });
        return;
      }
      toast.error(errorMessage(error));
    },
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = formValues(event.currentTarget);
    create.mutate({ ...values, budget: Number(values.budget) });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Post a job"
        description="Specialists apply with a proposal, a price and a time estimate. You pick one and split the work into milestones."
      />
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <Field
              label="Title"
              htmlFor="title"
              hint="What you need, in one line."
              required
            >
              <Input id="title" name="title" required minLength={10} maxLength={120} />
            </Field>
            <Field label="Category" htmlFor="category" required>
              <select
                id="category"
                name="category"
                required
                defaultValue=""
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="" disabled>
                  Choose a category
                </option>
                {Object.values(ServiceCategory).map((category) => (
                  <option key={category} value={category}>
                    {CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Description"
              htmlFor="description"
              hint="The scope of the work, 50 to 5000 characters."
              required
            >
              <Textarea
                id="description"
                name="description"
                required
                minLength={50}
                maxLength={5000}
                rows={6}
              />
            </Field>
            <Field
              label="Expected deliverables"
              htmlFor="deliverables"
              hint="What you should receive at the end."
              required
            >
              <Textarea
                id="deliverables"
                name="deliverables"
                required
                minLength={10}
                maxLength={2000}
                rows={3}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Budget (USDC)" htmlFor="budget" required>
                <Input
                  id="budget"
                  name="budget"
                  type="number"
                  required
                  min={1}
                  max={1000000}
                  step="any"
                />
              </Field>
              <Field label="Deadline" htmlFor="deadline" required>
                <Input
                  id="deadline"
                  name="deadline"
                  type="date"
                  required
                  min={todayIso()}
                />
              </Field>
            </div>
            <Button type="submit" size="lg" disabled={create.isPending}>
              {create.isPending ? 'Posting...' : 'Post job'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
