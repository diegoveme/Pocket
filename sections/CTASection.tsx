import { AssetImage } from "@/components/AssetImage";
import { BalloonButton } from "@/components/BalloonButton";
import { Reveal } from "@/components/Reveal";
import { EARLY_ACCESS_HREF } from "@/lib/constants";

const socialLinks = [
  { label: "X", href: "#" },
  { label: "Instagram", href: "#" },
  { label: "LinkedIn", href: "#" },
] as const;

export function CTASection() {
  return (
    <section
      id="cta"
      aria-label="Request early access"
      className="snap-section flex flex-col items-center justify-between px-6 py-12 md:px-16 md:py-16"
    >
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <Reveal>
          <h2 className="headline-lg text-off-white">
            Growth just got a lot lighter.
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="text-muted mx-auto mt-5 max-w-md text-lg leading-relaxed">
            <em>Pocket is opening for its first pilot. Get in early.</em>
          </p>
        </Reveal>

        <Reveal delay={0.2} className="mt-10">
          <BalloonButton href={EARLY_ACCESS_HREF}>
            Request early access
          </BalloonButton>
        </Reveal>
      </div>

      <footer className="mt-8 flex w-full max-w-6xl flex-col items-center justify-between gap-6 border-t border-celeste/10 pt-8 md:flex-row">
        <AssetImage
          src="/assets/logo-pocket.png"
          fallbackSrc="/assets/placeholders/logo-pocket.svg"
          alt="Pocket"
          width={120}
          height={40}
          className="h-8 w-auto opacity-80"
        />

        <div className="flex items-center gap-6">
          {socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              aria-label={link.label}
              className="text-sm text-muted transition-colors hover:text-celeste-light"
            >
              {link.label}
            </a>
          ))}
        </div>

        <p className="text-sm text-muted">Built on Stellar</p>
      </footer>
    </section>
  );
}
