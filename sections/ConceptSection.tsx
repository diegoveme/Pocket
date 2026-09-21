import { FloatingIcon } from "@/components/FloatingIcon";
import { Reveal, StaggerItem, StaggerReveal } from "@/components/Reveal";

const pillars = [
  {
    icon: "icon-verified",
    title: "Vetted talent",
    description:
      "Every growth, sales and marketing pro is verified before they're in.",
  },
  {
    icon: "icon-lock",
    title: "Guaranteed pay",
    description:
      "Funds lock in escrow and release only when the work is accepted.",
  },
  {
    icon: "icon-shield",
    title: "No blind trust",
    description: 'On-chain rules replace "just trust me."',
  },
] as const;

export function ConceptSection() {
  return (
    <section
      id="concept"
      aria-label="Everything in one place"
      className="snap-section flex items-center px-6 md:px-16 lg:px-24"
    >
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <p className="eyebrow mb-5">Everything in one place</p>
        </Reveal>

        <Reveal delay={0.08}>
          <h2 className="headline-lg max-w-3xl text-off-white">
            Talent, payments and trust. All in your pocket.
          </h2>
        </Reveal>

        <StaggerReveal className="mt-14 grid gap-10 md:mt-16 md:grid-cols-3 md:gap-8">
          {pillars.map((pillar, index) => (
            <StaggerItem key={pillar.icon}>
              <article className="group flex flex-col items-start md:max-w-xs">
                <FloatingIcon
                  src={`/assets/${pillar.icon}.png`}
                  fallbackSrc={`/assets/placeholders/${pillar.icon}.svg`}
                  alt=""
                  width={120}
                  height={120}
                  className="mb-5 w-24 md:w-28"
                  floatIntensity={10}
                  parallaxIntensity={16}
                  delay={index * 0.4}
                />
                <h3 className="headline-md mb-3 text-celeste-light">
                  {pillar.title}
                </h3>
                <p className="text-muted text-base leading-relaxed">
                  {pillar.description}
                </p>
              </article>
            </StaggerItem>
          ))}
        </StaggerReveal>
      </div>
    </section>
  );
}
