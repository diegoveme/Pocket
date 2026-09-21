import { FloatingIcon } from "@/components/FloatingIcon";
import { Reveal, StaggerItem, StaggerReveal } from "@/components/Reveal";

const steps = [
  {
    number: "1",
    icon: "icon-fund",
    title: "Fund the escrow",
    description:
      "The startup locks the budget on-chain before any work starts.",
  },
  {
    number: "2",
    icon: "icon-work",
    title: "Do the work",
    description:
      "The specialist delivers the project, milestone by milestone.",
  },
  {
    number: "3",
    icon: "icon-release",
    title: "Release on approval",
    description:
      "Approve the deliverable and payment is released instantly.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      aria-label="How it works"
      className="snap-section flex items-center px-6 md:px-16 lg:px-24"
    >
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <h2 className="headline-lg ml-auto max-w-2xl text-right text-off-white md:pr-8">
            Money in. Work out. Everyone protected.
          </h2>
        </Reveal>

        <StaggerReveal className="mt-14 space-y-12 md:mt-20 md:space-y-16">
          {steps.map((step, index) => (
            <StaggerItem key={step.icon}>
              <article
                className={`flex flex-col gap-6 md:flex-row md:items-center md:gap-12 ${
                  index % 2 === 1 ? "md:flex-row-reverse md:text-right" : ""
                }`}
              >
                <div
                  className={`flex shrink-0 items-center gap-4 ${
                    index % 2 === 1 ? "md:flex-row-reverse" : ""
                  }`}
                >
                  <span className="font-display text-5xl font-bold text-yellow/30 md:text-6xl">
                    {step.number}
                  </span>
                  <FloatingIcon
                    src={`/assets/${step.icon}.png`}
                    fallbackSrc={`/assets/placeholders/${step.icon}.svg`}
                    alt=""
                    width={112}
                    height={112}
                    className="w-24 md:w-28"
                    floatIntensity={8}
                    parallaxIntensity={14}
                    delay={index * 0.35}
                  />
                </div>
                <div className="max-w-md">
                  <h3 className="headline-md mb-2 text-celeste-light">
                    {step.title}
                  </h3>
                  <p className="text-muted text-base leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </article>
            </StaggerItem>
          ))}
        </StaggerReveal>
      </div>
    </section>
  );
}
