import { Reveal } from '@/components/Reveal';

export function DifferenceSection() {
  return (
    <section
      id="difference"
      aria-label="The difference"
      className="snap-section flex items-center justify-center px-6 md:px-16"
    >
      <div className="relative mx-auto w-full max-w-4xl">
        <div
          aria-hidden="true"
          className="absolute -inset-x-8 -inset-y-12 rounded-[2rem] bg-celeste/5 blur-2xl md:-inset-x-16"
        />

        <div className="relative rounded-[1.75rem] border border-celeste/15 bg-[#0a2544]/80 px-8 py-14 md:px-16 md:py-20">
          <Reveal>
            <h2 className="headline-lg text-center text-off-white">
              No paying into the void.
              <br />
              No working for free.
            </h2>
          </Reveal>

          <Reveal delay={0.15}>
            <p className="text-muted mx-auto mt-8 max-w-2xl text-center text-lg leading-relaxed md:text-xl">
              <em>
                Most freelance marketplaces run on blind trust. Pocket runs on escrow. The
                budget is locked the moment a project begins, and the specialist is paid
                the moment it&apos;s approved. Built on Stellar. Non-custodial. Always
                yours.
              </em>
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
