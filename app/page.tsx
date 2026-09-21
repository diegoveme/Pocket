import { DotNavigation } from "@/components/DotNavigation";
import { ConceptSection } from "@/sections/ConceptSection";
import { CTASection } from "@/sections/CTASection";
import { DifferenceSection } from "@/sections/DifferenceSection";
import { HeroSection } from "@/sections/HeroSection";
import { HowItWorksSection } from "@/sections/HowItWorksSection";
import { TwoSidesSection } from "@/sections/TwoSidesSection";

export default function Home() {
  return (
    <>
      <DotNavigation />
      <main id="scroll-container" className="snap-container">
        <div id="scroll-content">
          <HeroSection />
          <ConceptSection />
          <HowItWorksSection />
          <DifferenceSection />
          <TwoSidesSection />
          <CTASection />
        </div>
      </main>
    </>
  );
}
