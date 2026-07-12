import { useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Truck } from "lucide-react";
import { ROLE_LABELS } from "../../lib/types";

gsap.registerPlugin(useGSAP);

/** Split auth card per design/reference-auth.png: white form panel on the
 *  left, indigo showcase panel with a real mini dashboard preview on the right. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-auth-form] > *", {
          y: 20,
          opacity: 0,
          duration: 0.55,
          ease: "power3.out",
          stagger: 0.07,
        });
        gsap.from("[data-auth-panel]", {
          x: 32,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
          delay: 0.15,
        });
      });
    },
    { scope },
  );

  return (
    <div
      ref={scope}
      className="grid min-h-[100dvh] place-items-center bg-mist-200 p-4 font-sans text-ink-900 antialiased sm:p-6"
    >
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_-20px_rgba(22,50,60,0.25)] md:grid-cols-2">
        {/* Form panel */}
        <div className="flex flex-col p-8 sm:p-12">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <span className="grid size-8 place-items-center rounded-lg bg-ink-900 text-white">
              <Truck className="size-4.5" strokeWidth={2} />
            </span>
            TransitOps
          </Link>
          <div data-auth-form className="my-auto pt-10 md:pt-6">
            {children}
          </div>
          <p className="pt-8 text-xs text-ink-500">TransitOps © 2026 · RBAC enabled</p>
        </div>

        {/* Showcase panel */}
        <div
          data-auth-panel
          className="hidden flex-col justify-between bg-indigo-600 p-12 text-white md:flex"
        >
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-balance">
              The simplest way to run your fleet.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-indigo-200">
              Vehicles, drivers, trips, maintenance, and costs in one place,
              with every business rule enforced for you.
            </p>
          </div>

          {/* Real mini preview of the product's KPI surface */}
          <div className="my-8 rounded-2xl bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-xs font-semibold tracking-wide text-indigo-200 uppercase">
              Today at Gandhinagar depot
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                ["53", "active vehicles"],
                ["18", "active trips"],
                ["81%", "utilization"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-xl bg-white/10 px-3 py-3 text-center">
                  <p className="text-xl font-extrabold">{value}</p>
                  <p className="mt-1 text-[11px] leading-tight text-indigo-200">{label}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-indigo-100">
              <span className="inline-block size-1.5 rounded-full bg-emerald-400" />
              TR001 dispatched: VAN-05 with Alex, 450 kg of 500 kg
            </p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-indigo-200">
            {Object.values(ROLE_LABELS).map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
