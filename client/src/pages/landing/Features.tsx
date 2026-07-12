import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Truck, Route, ShieldCheck, Wrench, Fuel, BarChart3 } from "lucide-react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const cellBase = "rounded-3xl p-7 shadow-[0_20px_60px_-15px_rgba(22,50,60,0.12)]";

export default function Features() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-cell]", {
          y: 36,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: scope.current, start: "top 72%" },
        });
      });
    },
    { scope },
  );

  return (
    <section id="features" ref={scope} className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <h2 className="max-w-xl text-3xl font-extrabold tracking-tight sm:text-4xl">
        Everything your depot runs on.
      </h2>

      <div className="mt-10 grid gap-5 md:grid-cols-12">
        <div data-cell className={`${cellBase} bg-white md:col-span-7`}>
          <Truck className="size-6 text-ink-700" strokeWidth={1.75} />
          <h3 className="mt-4 text-lg font-bold">Vehicle Registry</h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-500">
            Every vehicle with its capacity, odometer, acquisition cost, and
            live status in one master list. Registration numbers stay unique.
          </p>
        </div>

        <div data-cell className={`${cellBase} bg-ink-900 text-white md:col-span-5`}>
          <Route className="size-6 text-mist-300" strokeWidth={1.75} />
          <h3 className="mt-4 text-lg font-bold">Trip Dispatcher</h3>
          <p className="mt-2 text-sm leading-relaxed text-mist-300">
            Draft, dispatch, complete. Vehicle and driver status updates happen
            automatically at every step.
          </p>
        </div>

        <div data-cell className={`${cellBase} bg-white md:col-span-4`}>
          <ShieldCheck className="size-6 text-ink-700" strokeWidth={1.75} />
          <h3 className="mt-4 text-lg font-bold">Driver Compliance</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            License expiry and safety scores tracked. Expired or suspended
            drivers never reach the dispatch pool.
          </p>
        </div>

        <div data-cell className={`${cellBase} bg-mist-100 md:col-span-4`}>
          <Wrench className="size-6 text-ink-700" strokeWidth={1.75} />
          <h3 className="mt-4 text-lg font-bold">Maintenance</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            Open a service record and the vehicle leaves the pool. Close it and
            the vehicle comes back.
          </p>
        </div>

        <div data-cell className={`${cellBase} bg-white md:col-span-4`}>
          <Fuel className="size-6 text-ink-700" strokeWidth={1.75} />
          <h3 className="mt-4 text-lg font-bold">Fuel &amp; Expenses</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            Fuel logs, tolls, and service costs roll up into one operational
            cost per vehicle.
          </p>
        </div>

        <div data-cell className={`${cellBase} bg-mist-100 md:col-span-12`}>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-md">
              <BarChart3 className="size-6 text-ink-700" strokeWidth={1.75} />
              <h3 className="mt-4 text-lg font-bold">Reports &amp; Analytics</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                Fuel efficiency, utilization, and ROI per vehicle. Export any
                report as CSV.
              </p>
            </div>
            <dl className="grid grid-cols-3 gap-4 md:gap-8">
              {[
                ["8.4", "km per liter"],
                ["81%", "utilization"],
                ["14.2%", "vehicle ROI"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl bg-white px-5 py-4 text-center">
                  <dt className="text-2xl font-extrabold tracking-tight">{value}</dt>
                  <dd className="mt-1 text-xs text-ink-500">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
