'use client';

import type { PublicProfile, SpecialistProfile, StartupProfile } from '@pocket/shared';
import { useQuery } from '@tanstack/react-query';
import { ExternalLinkIcon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { Avatar } from '@/components/avatar';
import { Detail, ErrorAlert, Loading } from '@/components/page';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { CATEGORY_LABELS, STAGE_LABELS, date, shortAddress, usdc } from '@/lib/format';

/** Public profile of any approved user. Specialists link here from the directory and from applications. */
export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const profile = useQuery({
    queryKey: ['profiles', id],
    queryFn: () => api<PublicProfile>(`/profiles/${id}`),
  });

  if (profile.isLoading) return <Loading />;
  if (profile.error || !profile.data)
    return <ErrorAlert error={profile.error} title="Profile not found" />;

  const { role, stellarAddress, memberSince } = profile.data;
  return (
    <div className="mx-auto max-w-3xl">
      {role === 'specialist' ? (
        <SpecialistView profile={profile.data.profile as SpecialistProfile} />
      ) : (
        <StartupView profile={profile.data.profile as StartupProfile} />
      )}
      <p className="mt-6 text-xs text-muted-foreground">
        Verified by Pocket. Member since {date(memberSince)}. Wallet{' '}
        {shortAddress(stellarAddress)}.
      </p>
    </div>
  );
}

function SpecialistView({ profile }: { profile: SpecialistProfile }) {
  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <div className="flex items-center gap-4">
          <Avatar name={profile.displayName} url={profile.avatarUrl} size={72} />
          <div>
            <h1 className="text-3xl font-bold text-navy">{profile.displayName}</h1>
            <p className="text-muted-foreground">{profile.headline}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {profile.categories.map((category) => (
            <Badge
              key={category}
              variant="secondary"
              className="border-0 bg-celeste-light text-navy"
            >
              {CATEGORY_LABELS[category]}
            </Badge>
          ))}
        </div>
        <p className="whitespace-pre-line text-sm leading-relaxed">{profile.bio}</p>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {profile.hourlyRate ? (
            <Detail label="Hourly rate">{usdc(profile.hourlyRate)}</Detail>
          ) : null}
          {profile.minProjectBudget ? (
            <Detail label="Smallest project">{usdc(profile.minProjectBudget)}</Detail>
          ) : null}
          {profile.location ? <Detail label="Location">{profile.location}</Detail> : null}
        </dl>
        {profile.skills.length > 0 ? (
          <section>
            <h2 className="text-sm font-semibold text-navy">Skills</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile.skills.map((skill) => (
                <Badge key={skill} variant="outline">
                  {skill}
                </Badge>
              ))}
            </div>
          </section>
        ) : null}
        <Links
          links={[
            ...profile.caseStudies.map((url) => ({ label: url, url })),
            ...(profile.portfolioUrl
              ? [{ label: 'Portfolio', url: profile.portfolioUrl }]
              : []),
            ...(profile.linkedinUrl
              ? [{ label: 'LinkedIn', url: profile.linkedinUrl }]
              : []),
          ]}
        />
      </CardContent>
    </Card>
  );
}

function StartupView({ profile }: { profile: StartupProfile }) {
  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <div className="flex items-center gap-4">
          <Avatar name={profile.companyName} url={profile.logoUrl} size={72} />
          <div>
            <h1 className="text-3xl font-bold text-navy">{profile.companyName}</h1>
            <p className="text-muted-foreground">{profile.oneLiner}</p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Detail label="Sector">{profile.sector}</Detail>
          <Detail label="Stage">{STAGE_LABELS[profile.stage]}</Detail>
          {profile.location ? <Detail label="Location">{profile.location}</Detail> : null}
        </dl>
        <section>
          <h2 className="text-sm font-semibold text-navy">Looking for</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
            {profile.lookingFor}
          </p>
        </section>
        <Links
          links={
            profile.websiteUrl ? [{ label: 'Website', url: profile.websiteUrl }] : []
          }
        />
      </CardContent>
    </Card>
  );
}

function Links({ links }: { links: { label: string; url: string }[] }) {
  if (links.length === 0) return null;
  return (
    <section>
      <h2 className="text-sm font-semibold text-navy">Links</h2>
      <ul className="mt-2 space-y-1">
        {links.map((link) => (
          <li key={link.url + link.label}>
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-navy underline"
            >
              {link.label} <ExternalLinkIcon className="size-3" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
