import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const roles: Array<[string, string]> = [
  ["Fleet Manager", "Owns vehicles, maintenance, and fleet health."],
  ["Dispatcher", "Creates trips and tracks every delivery."],
  ["Safety Officer", "Watches licenses and safety scores."],
  ["Financial Analyst", "Tracks fuel, costs, and vehicle ROI."],
];

export default function Roles() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-role]", {
          y: 24,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.09,
          scrollTrigger: { trigger: scope.current, start: "top 75%" },
        });
      });
    },
    { scope },
  );

  return (
    <section id="roles" ref={scope} className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <h2 className="max-w-xl text-3xl font-extrabold tracking-tight sm:text-4xl">
        One login, four roles.
      </h2>
      <p className="mt-3 max-w-lg text-ink-500">
        Access is scoped by role the moment you sign in. Everyone sees exactly
        what their job needs.
      </p>

      <div className="mt-10 grid gap-y-8 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-ink-900/10">
        {roles.map(([title, blurb]) => (
          <div key={title} data-role className="lg:px-6 lg:first:pl-0 lg:last:pr-0">
            <h3 className="text-base font-bold">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">{blurb}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
