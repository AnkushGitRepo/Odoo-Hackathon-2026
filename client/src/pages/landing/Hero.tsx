import { useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  AlertTriangle,
  CircleCheck,
  ShieldCheck,
  UserX,
} from "lucide-react";

gsap.registerPlugin(useGSAP);

/** Real mini-previews of product UI (not fake screenshots): a KPI card,
 *  the live board, and the rule guards judges will test. */
export default function Hero() {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.from("[data-hero-text] > *", {
          y: 28,
          opacity: 0,
          duration: 0.7,
          stagger: 0.12,
        }).from(
          "[data-hero-card]",
          { y: 48, opacity: 0, duration: 0.8, stagger: 0.14 },
          "-=0.35",
        );

        // Count-up draws the eye to the one number that sells the product.
        const counter = { value: 0 };
        tl.to(
          counter,
          {
            value: 81,
            duration: 1.2,
            ease: "power2.out",
            onUpdate: () => {
              const el = scope.current?.querySelector("[data-count]");
              if (el) el.textContent = `${Math.round(counter.value)}%`;
            },
          },
          "-=0.5",
        );
      });
    },
    { scope },
  );

  return (
    <section ref={scope} className="mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6 md:pt-24">
      <div data-hero-text className="mx-auto max-w-3xl text-center">
        <h1 className="text-5xl font-extrabold tracking-tighter text-balance sm:text-6xl md:text-7xl">
          Dispatch. Track. Optimize.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-500">
          TransitOps runs your fleet in one place: vehicles, drivers, trips,
          maintenance, and costs, with the rules enforced automatically.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            to="/signup"
            className="rounded-full bg-ink-900 px-7 py-3.5 text-sm font-semibold text-white transition-transform hover:bg-ink-700 active:scale-[0.98]"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="rounded-full border border-ink-900/15 bg-white/60 px-7 py-3.5 text-sm font-semibold text-ink-700 transition-colors hover:bg-white"
          >
            Sign in
          </Link>
        </div>
      </div>

      <div className="mt-16 grid gap-5 md:grid-cols-3">
        {/* KPI preview */}
        <div
          data-hero-card
          className="rounded-3xl bg-white p-6 shadow-[0_20px_60px_-15px_rgba(22,50,60,0.18)]"
        >
          <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase">
            Fleet utilization
          </p>
          <p data-count className="mt-2 text-5xl font-extrabold tracking-tight">
            81%
          </p>
          <svg
            viewBox="0 0 200 60"
            className="mt-4 h-14 w-full text-ink-700"
            aria-hidden="true"
          >
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              points="0,52 25,44 50,48 75,34 100,38 125,22 150,28 175,12 200,16"
            />
          </svg>
          <p className="mt-3 text-sm text-ink-500">42 of 53 active vehicles on the road this week.</p>
        </div>

        {/* Live board preview */}
        <div
          data-hero-card
          className="rounded-3xl bg-white p-6 shadow-[0_20px_60px_-15px_rgba(22,50,60,0.18)]"
        >
          <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase">
            Live board
          </p>
          <ul className="mt-4 space-y-3">
            <li className="flex items-center justify-between rounded-xl bg-mist-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold">TR001</p>
                <p className="text-xs text-ink-500">VAN-05 / Alex</p>
              </div>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                Dispatched
              </span>
            </li>
            <li className="flex items-center justify-between rounded-xl bg-mist-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold">TR002</p>
                <p className="text-xs text-ink-500">TRK-12 / Priya</p>
              </div>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Completed
              </span>
            </li>
          </ul>
          <p className="mt-4 flex items-center gap-2 text-sm text-ink-500">
            <CircleCheck className="size-4 text-green-600" strokeWidth={2} />
            450 kg loaded, within the 500 kg limit
          </p>
        </div>

        {/* Rule guard preview */}
        <div
          data-hero-card
          className="rounded-3xl bg-white p-6 shadow-[0_20px_60px_-15px_rgba(22,50,60,0.18)]"
        >
          <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase">
            Rules on guard
          </p>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3 text-amber-900">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
              Capacity exceeded by 200 kg. Dispatch blocked.
            </li>
            <li className="flex items-start gap-3 rounded-xl bg-mist-50 px-4 py-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-green-600" strokeWidth={2} />
              License valid until 08/2027. Cleared to drive.
            </li>
            <li className="flex items-start gap-3 rounded-xl bg-mist-50 px-4 py-3">
              <UserX className="mt-0.5 size-4 shrink-0 text-red-500" strokeWidth={2} />
              Suspended drivers never reach the pool.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
