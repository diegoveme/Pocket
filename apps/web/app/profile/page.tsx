'use client';

import {
  ServiceCategory,
  StartupStage,
  type SpecialistProfile,
  type StartupProfile,
  type User,
} from '@pocket/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Field, compact, formValues } from '@/components/form';
import { Loading, PageHeader } from '@/components/page';
import { RequireAuth } from '@/components/require-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api, errorMessage } from '@/lib/api';
import { CATEGORY_LABELS, STAGE_LABELS } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  return (
    <RequireAuth roles={['startup', 'specialist']} verified>
      {(user) => <Profile user={user} />}
    </RequireAuth>
  );
}

function Profile({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const profile = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => api<StartupProfile | SpecialistProfile | null>('/profiles/me'),
  });

  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api(`/profiles/me/${user.role}`, { method: 'PUT', body }),
    onSuccess: async () => {
      toast.success('Profile saved');
      await queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="My profile"
        description="Every profile follows the same template, so startups and specialists can compare them at a glance."
      />
      {profile.isLoading ? (
        <Loading />
      ) : (
        <Card>
          <CardContent className="pt-6">
            {user.role === 'startup' ? (
              <StartupForm
                initial={profile.data as StartupProfile | null}
                saving={save.isPending}
                onSave={save.mutate}
              />
            ) : (
              <SpecialistForm
                initial={profile.data as SpecialistProfile | null}
                saving={save.isPending}
                onSave={save.mutate}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface FormProps<T> {
  initial: T | null;
  saving: boolean;
  onSave: (body: Record<string, unknown>) => void;
}

function StartupForm({ initial, saving, onSave }: FormProps<StartupProfile>) {
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(compact(formValues(event.currentTarget)));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Company name" htmlFor="companyName" required>
        <Input
          id="companyName"
          name="companyName"
          required
          minLength={2}
          maxLength={160}
          defaultValue={initial?.companyName}
        />
      </Field>
      <Field label="What you do, in one sentence" htmlFor="oneLiner" required>
        <Input
          id="oneLiner"
          name="oneLiner"
          required
          minLength={10}
          maxLength={200}
          defaultValue={initial?.oneLiner}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Sector"
          htmlFor="sector"
          hint="For example Fintech or Health."
          required
        >
          <Input
            id="sector"
            name="sector"
            required
            minLength={2}
            maxLength={80}
            defaultValue={initial?.sector}
          />
        </Field>
        <Field label="Stage" htmlFor="stage" required>
          <select
            id="stage"
            name="stage"
            required
            defaultValue={initial?.stage ?? ''}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="" disabled>
              Choose a stage
            </option>
            {Object.values(StartupStage).map((stage) => (
              <option key={stage} value={stage}>
                {STAGE_LABELS[stage]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="What you need help with right now" htmlFor="lookingFor" required>
        <Textarea
          id="lookingFor"
          name="lookingFor"
          required
          minLength={20}
          maxLength={1000}
          defaultValue={initial?.lookingFor}
        />
      </Field>
      <Field label="Website" htmlFor="websiteUrl">
        <Input
          id="websiteUrl"
          name="websiteUrl"
          type="url"
          placeholder="https://"
          defaultValue={initial?.websiteUrl ?? ''}
        />
      </Field>
      <Field label="Logo URL" htmlFor="logoUrl">
        <Input
          id="logoUrl"
          name="logoUrl"
          type="url"
          placeholder="https://"
          defaultValue={initial?.logoUrl ?? ''}
        />
      </Field>
      <Field label="Location" htmlFor="location">
        <Input
          id="location"
          name="location"
          minLength={2}
          maxLength={120}
          defaultValue={initial?.location ?? ''}
        />
      </Field>
      <Button type="submit" size="lg" disabled={saving}>
        {saving ? 'Saving...' : 'Save profile'}
      </Button>
    </form>
  );
}

function SpecialistForm({ initial, saving, onSave }: FormProps<SpecialistProfile>) {
  const [categories, setCategories] = useState<ServiceCategory[]>(
    initial?.categories ?? [],
  );

  function toggle(category: ServiceCategory) {
    setCategories((current) =>
      current.includes(category)
        ? current.filter((c) => c !== category)
        : [...current, category],
    );
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (categories.length === 0) {
      toast.error('Pick at least one category');
      return;
    }
    const values = formValues(event.currentTarget);
    onSave(
      compact({
        ...values,
        categories,
        skills: splitList(values.skills, /,/),
        caseStudies: splitList(values.caseStudies, /\s+/),
        hourlyRate: values.hourlyRate ? Number(values.hourlyRate) : undefined,
        minProjectBudget: values.minProjectBudget
          ? Number(values.minProjectBudget)
          : undefined,
      }),
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Name" htmlFor="displayName" required>
        <Input
          id="displayName"
          name="displayName"
          required
          minLength={2}
          maxLength={120}
          defaultValue={initial?.displayName}
        />
      </Field>
      <Field
        label="Headline"
        htmlFor="headline"
        hint='For example "B2B SaaS outbound specialist".'
        required
      >
        <Input
          id="headline"
          name="headline"
          required
          minLength={10}
          maxLength={160}
          defaultValue={initial?.headline}
        />
      </Field>
      <Field label="About you" htmlFor="bio" hint="50 to 2000 characters." required>
        <Textarea
          id="bio"
          name="bio"
          required
          minLength={50}
          maxLength={2000}
          rows={5}
          defaultValue={initial?.bio}
        />
      </Field>
      <Field label="Categories" htmlFor="categories" required>
        <div id="categories" className="flex flex-wrap gap-2">
          {Object.values(ServiceCategory).map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => toggle(category)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm transition',
                categories.includes(category)
                  ? 'border-navy bg-navy text-off-white'
                  : 'border-border bg-background text-navy hover:border-celeste',
              )}
            >
              {CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Skills" htmlFor="skills" hint="Separated by commas, up to 20.">
        <Input id="skills" name="skills" defaultValue={initial?.skills.join(', ')} />
      </Field>
      <Field
        label="Past work"
        htmlFor="caseStudies"
        hint="Links, one per line, up to 10."
      >
        <Textarea
          id="caseStudies"
          name="caseStudies"
          rows={3}
          defaultValue={initial?.caseStudies.join('\n')}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Hourly rate (USDC)" htmlFor="hourlyRate">
          <Input
            id="hourlyRate"
            name="hourlyRate"
            type="number"
            min={0}
            step="any"
            defaultValue={initial?.hourlyRate ?? ''}
          />
        </Field>
        <Field label="Smallest project (USDC)" htmlFor="minProjectBudget">
          <Input
            id="minProjectBudget"
            name="minProjectBudget"
            type="number"
            min={0}
            step="any"
            defaultValue={initial?.minProjectBudget ?? ''}
          />
        </Field>
      </div>
      <Field label="Portfolio" htmlFor="portfolioUrl">
        <Input
          id="portfolioUrl"
          name="portfolioUrl"
          type="url"
          placeholder="https://"
          defaultValue={initial?.portfolioUrl ?? ''}
        />
      </Field>
      <Field label="LinkedIn" htmlFor="linkedinUrl">
        <Input
          id="linkedinUrl"
          name="linkedinUrl"
          type="url"
          placeholder="https://"
          defaultValue={initial?.linkedinUrl ?? ''}
        />
      </Field>
      <Field label="Photo URL" htmlFor="avatarUrl">
        <Input
          id="avatarUrl"
          name="avatarUrl"
          type="url"
          placeholder="https://"
          defaultValue={initial?.avatarUrl ?? ''}
        />
      </Field>
      <Field label="Location" htmlFor="location">
        <Input
          id="location"
          name="location"
          minLength={2}
          maxLength={120}
          defaultValue={initial?.location ?? ''}
        />
      </Field>
      <Button type="submit" size="lg" disabled={saving}>
        {saving ? 'Saving...' : 'Save profile'}
      </Button>
    </form>
  );
}

function splitList(value: string | undefined, separator: RegExp): string[] {
  return (value ?? '')
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);
}
