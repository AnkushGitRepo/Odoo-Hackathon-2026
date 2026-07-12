import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { apiGet } from "../../lib/api";
import type { DashboardKpis } from "../../lib/types";

const KPI_CARDS: Array<{ key: keyof DashboardKpis; label: string; suffix?: string }> = [
  { key: "activeVehicles", label: "Active vehicles" },
  { key: "availableVehicles", label: "Available vehicles" },
  { key: "inMaintenance", label: "In maintenance" },
  { key: "activeTrips", label: "Active trips" },
  { key: "pendingTrips", label: "Pending trips" },
  { key: "driversOnDuty", label: "Drivers on duty" },
  { key: "fleetUtilizationPct", label: "Fleet utilization", suffix: "%" },
];

export default function DashboardPage() {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [pending, setPending] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiGet<DashboardKpis>("/dashboard/kpis")
      .then((data) => {
        if (!cancelled) setKpis(data);
      })
      .catch(() => {
        // Endpoint ships in task T7 — the page renders with a notice until then.
      })
      .finally(() => {
        if (!cancelled) setPending(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Dashboard</h1>

      {!pending && !kpis && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-indigo-50 px-5 py-4 text-sm text-indigo-900">
          <Info className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
          Live numbers appear here once the KPI endpoint and seed data land
          (tasks T5 to T7 on the board).
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {KPI_CARDS.map(({ key, label, suffix }) => (
          <div
            key={key}
            className="rounded-2xl bg-white p-5 shadow-[0_12px_40px_-16px_rgba(22,50,60,0.15)]"
          >
            <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase">{label}</p>
            {pending ? (
              <div className="mt-3 h-8 w-16 animate-pulse rounded-lg bg-mist-100" />
            ) : (
              <p className="mt-2 text-3xl font-extrabold tracking-tight">
                {kpis ? `${kpis[key] as number}${suffix ?? ""}` : "0"}
              </p>
            )}
          </div>
        ))}
      </div>

      {kpis && kpis.recentTrips.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_-16px_rgba(22,50,60,0.15)]">
          <h2 className="px-6 pt-5 text-sm font-bold">Recent trips</h2>
          <table className="mt-3 w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-ink-500 uppercase">
                <th className="px-6 py-2 font-semibold">Trip</th>
                <th className="px-6 py-2 font-semibold">Vehicle</th>
                <th className="px-6 py-2 font-semibold">Driver</th>
                <th className="px-6 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {kpis.recentTrips.map((trip) => (
                <tr key={trip._id} className="border-t border-mist-100">
                  <td className="px-6 py-3 font-semibold">{trip.code}</td>
                  <td className="px-6 py-3">{trip.vehicle?.name ?? "Unassigned"}</td>
                  <td className="px-6 py-3">{trip.driver?.name ?? "Unassigned"}</td>
                  <td className="px-6 py-3">{trip.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
