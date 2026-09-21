"use client";

import { useCallback, useEffect, useState } from "react";
import { SECTIONS, type SectionId } from "@/lib/sections";

function getSectionElements() {
  return SECTIONS.map(({ id }) => document.getElementById(id)).filter(
    Boolean,
  ) as HTMLElement[];
}

function getActiveIndex(container: HTMLElement) {
  const midpoint = container.scrollTop + container.clientHeight / 2;
  const sections = getSectionElements();

  let closestIndex = 0;
  let closestDistance = Infinity;

  sections.forEach((section, index) => {
    const sectionMid = section.offsetTop + section.offsetHeight / 2;
    const distance = Math.abs(midpoint - sectionMid);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
}

function scrollToSection(id: SectionId) {
  const section = document.getElementById(id);
  section?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function DotNavigation() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const container = document.getElementById("scroll-container");
    if (!container) return;

    const onScroll = () => {
      setActiveIndex(getActiveIndex(container));
    };

    onScroll();
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = useCallback((index: number) => {
    scrollToSection(SECTIONS[index].id);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (event.key === "ArrowDown" || event.key === "PageDown") {
        event.preventDefault();
        const next = Math.min(activeIndex + 1, SECTIONS.length - 1);
        goTo(next);
      }

      if (event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault();
        const prev = Math.max(activeIndex - 1, 0);
        goTo(prev);
      }

      if (event.key === "Home") {
        event.preventDefault();
        goTo(0);
      }

      if (event.key === "End") {
        event.preventDefault();
        goTo(SECTIONS.length - 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, goTo]);

  return (
    <nav
      aria-label="Section navigation"
      className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-3 md:flex"
    >
      {SECTIONS.map(({ id, label }, index) => {
        const isActive = index === activeIndex;
        return (
          <button
            key={id}
            type="button"
            aria-label={`Go to ${label}`}
            aria-current={isActive ? "true" : undefined}
            onClick={() => goTo(index)}
            className="group flex items-center justify-end gap-3"
          >
            <span
              className={`pointer-events-none text-[10px] font-medium uppercase tracking-widest text-celeste-light opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${isActive ? "opacity-100" : ""}`}
            >
              {label}
            </span>
            <span
              className={`block rounded-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isActive
                  ? "h-3 w-3 bg-yellow shadow-[0_0_12px_rgba(255,210,63,0.5)]"
                  : "h-2 w-2 bg-celeste/40 group-hover:bg-celeste/70"
              }`}
            />
          </button>
        );
      })}
    </nav>
  );
}
