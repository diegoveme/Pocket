import { AssetImage } from '@/components/AssetImage';
import { BalloonButton } from '@/components/BalloonButton';
import { FloatingIcon } from '@/components/FloatingIcon';
import { Reveal } from '@/components/Reveal';
import { ScrollCue } from '@/components/ScrollCue';
import { EARLY_ACCESS_HREF } from '@/lib/constants';

export function HeroSection() {
  return (
    <section
      id="hero"
      aria-label="Hero"
      className="snap-section flex flex-col items-center justify-center px-6 md:px-12"
    >
      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center text-center">
        <div className="relative mb-8 flex w-full items-center justify-center md:mb-10">
          <FloatingIcon
            src="/assets/hero-object.png"
            fallbackSrc="/assets/placeholders/hero-object.svg"
            alt=""
            width={480}
            height={480}
            className="pointer-events-none absolute -right-4 top-1/2 w-[min(55vw,420px)] -translate-y-1/2 md:-right-8 lg:-right-16"
            floatIntensity={16}
            parallaxIntensity={30}
            delay={0.5}
            priority
          />
          <Reveal className="relative z-10">
            <AssetImage
              src="/assets/logo-pocket.png"
              fallbackSrc="/assets/placeholders/logo-pocket.svg"
              alt="Pocket"
              width={560}
              height={180}
              priority
              className="mx-auto w-[min(85vw,480px)] drop-shadow-[0_24px_48px_rgba(134,212,230,0.15)]"
            />
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <h1 className="headline-xl max-w-4xl text-off-white">
            Your growth team, in your pocket.
          </h1>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="text-muted mx-auto mt-6 max-w-xl text-lg leading-relaxed md:text-xl">
            <em>
              The on-chain marketplace where startups hire vetted growth talent — and
              every payment is guaranteed.
            </em>
          </p>
        </Reveal>

        <Reveal delay={0.3} className="mt-10">
          <BalloonButton href={EARLY_ACCESS_HREF}>Request early access</BalloonButton>
        </Reveal>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
        <ScrollCue />
      </div>
    </section>
  );
}
