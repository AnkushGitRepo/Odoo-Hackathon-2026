import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { apiGet } from "../../lib/api";
import type { DashboardKpis, Vehicle, VehicleStatus, VehicleType } from "../../lib/types";
import StatusBadge from "../../components/StatusBadge";
import StatusDonut from "./StatusDonut";

const KPI_CARDS: Array<{ key: keyof DashboardKpis; label: string; suffix?: string }> = [
  { key: "activeVehicles", label: "Active vehicles" },
  { key: "availableVehicles", label: "Available vehicles" },
  { key: "inMaintenance", label: "In maintenance" },
  { key: "activeTrips", label: "Active trips" },
  { key: "pendingTrips", label: "Pending trips" },
  { key: "driversOnDuty", label: "Drivers on duty" },
  { key: "fleetUtilizationPct", label: "Fleet utilization", suffix: "%" },
];

const TYPES: VehicleType[] = ["VAN", "TRUCK", "MINI", "BIKE"];
const STATUSES: VehicleStatus[] = ["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"];

export default function DashboardPage() {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [pending, setPending] = useState(true);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [region, setRegion] = useState("");
  const [regions, setRegions] = useState<string[]>([]);

  useEffect(() => {
    apiGet<Vehicle[]>("/vehicles")
      .then((vehicles) => {
        const unique = Array.from(new Set(vehicles.map((v) => v.region).filter(Boolean)));
        setRegions(unique.sort());
      })
      .catch(() => setRegions([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (status) params.set("status", status);
    if (region) params.set("region", region);

    apiGet<DashboardKpis>(`/dashboard/kpis?${params.toString()}`)
      .then((data) => {
        if (!cancelled) setKpis(data);
      })
      .catch(() => {
        // Endpoint may not be live yet on a fresh clone — page still renders.
      })
      .finally(() => {
        if (!cancelled) setPending(false);
      });
    return () => {
      cancelled = true;
    };
  }, [type, status, region]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Dashboard</h1>
        <div className="flex flex-wrap gap-3">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-xl border border-mist-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">Vehicle Type: All</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-mist-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">Status: All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="rounded-xl border border-mist-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">Region: All</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!pending && !kpis && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-indigo-50 px-5 py-4 text-sm text-indigo-900 dark:bg-indigo-500/10 dark:text-indigo-300">
          <Info className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
          Live numbers appear here once the API is reachable.
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {KPI_CARDS.map(({ key, label, suffix }) => (
          <div
            key={key}
            className="rounded-2xl bg-white p-5 shadow-[0_12px_40px_-16px_rgba(22,50,60,0.15)] dark:bg-slate-900"
          >
            <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase">{label}</p>
            {pending ? (
              <div className="mt-3 h-8 w-16 animate-pulse rounded-lg bg-mist-100 dark:bg-slate-800" />
            ) : (
              <p className="mt-2 text-3xl font-extrabold tracking-tight">
                {kpis ? `${kpis[key] as number}${suffix ?? ""}` : "0"}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {kpis && (
          <div className="rounded-2xl bg-white p-6 shadow-[0_12px_40px_-16px_rgba(22,50,60,0.15)] dark:bg-slate-900">
            <h2 className="text-sm font-bold tracking-wide uppercase">Vehicle Status</h2>
            <div className="mt-4">
              <StatusDonut breakdown={kpis.vehicleStatusBreakdown} />
            </div>
          </div>
        )}

        {kpis && kpis.recentTrips.length > 0 && (
          <div className="overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_-16px_rgba(22,50,60,0.15)] dark:bg-slate-900">
            <h2 className="px-6 pt-5 text-sm font-bold tracking-wide uppercase">Recent Trips</h2>
            <table className="mt-3 w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-ink-500 uppercase dark:text-slate-400">
                  <th className="px-6 py-2 font-semibold">Trip</th>
                  <th className="px-6 py-2 font-semibold">Vehicle</th>
                  <th className="px-6 py-2 font-semibold">Driver</th>
                  <th className="px-6 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {kpis.recentTrips.map((trip) => (
                  <tr key={trip._id} className="border-t border-mist-100 dark:border-slate-800">
                    <td className="px-6 py-3 font-semibold">{trip.code}</td>
                    <td className="px-6 py-3">{trip.vehicle?.name ?? "Unassigned"}</td>
                    <td className="px-6 py-3">{trip.driver?.name ?? "Unassigned"}</td>
                    <td className="px-6 py-3">
                      <StatusBadge status={trip.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
