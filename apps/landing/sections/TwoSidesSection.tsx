import { FloatingIcon } from '@/components/FloatingIcon';
import { Reveal, StaggerItem, StaggerReveal } from '@/components/Reveal';

const sides = [
  {
    icon: 'icon-startup',
    title: 'For startups',
    description:
      'Move a real metric without a full-time hire. Compare vetted pros, fund a project, pay only for work you accept.',
  },
  {
    icon: 'icon-pro',
    title: 'For specialists',
    description:
      'Reach serious startups, get paid the second your work is approved, and build a verifiable on-chain track record.',
  },
] as const;

export function TwoSidesSection() {
  return (
    <section
      id="two-sides"
      aria-label="Two sides, one pocket"
      className="snap-section flex items-center px-6 md:px-16 lg:px-24"
    >
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <h2 className="headline-lg text-off-white">Two sides. One pocket.</h2>
        </Reveal>

        <StaggerReveal className="mt-12 grid gap-6 md:mt-16 md:grid-cols-2 md:gap-8">
          {sides.map((side, index) => (
            <StaggerItem key={side.icon}>
              <article className="flex h-full flex-col rounded-3xl border border-celeste/10 bg-celeste/[0.04] p-8 md:p-10">
                <FloatingIcon
                  src={`/assets/${side.icon}.png`}
                  fallbackSrc={`/assets/placeholders/${side.icon}.svg`}
                  alt=""
                  width={140}
                  height={140}
                  className="mb-6 w-28 md:w-32"
                  floatIntensity={10}
                  parallaxIntensity={18}
                  delay={index * 0.5}
                />
                <h3 className="headline-md mb-3 text-yellow">{side.title}</h3>
                <p className="text-muted text-base leading-relaxed">{side.description}</p>
              </article>
            </StaggerItem>
          ))}
        </StaggerReveal>
      </div>
    </section>
  );
}
