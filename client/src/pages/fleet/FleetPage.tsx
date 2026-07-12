import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { apiDelete, apiGet } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { can } from "../../lib/rbac";
import type { Vehicle, VehicleStatus, VehicleType } from "../../lib/types";
import StatusBadge from "../../components/StatusBadge";
import Modal from "../../components/Modal";
import VehicleForm from "./VehicleForm";

const TYPES: VehicleType[] = ["VAN", "TRUCK", "MINI", "BIKE"];
const STATUSES: VehicleStatus[] = ["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"];

export default function FleetPage() {
  const { user } = useAuth();
  const canWrite = user ? can(user.role, "fleet") === "full" : false;

  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<"add" | Vehicle | null>(null);

  async function load() {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (status) params.set("status", status);
    if (query) params.set("q", query);
    const data = await apiGet<Vehicle[]>(`/vehicles?${params.toString()}`);
    setVehicles(data);
  }

  useEffect(() => {
    load().catch(() => setVehicles([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, status, query]);

  async function retire(vehicle: Vehicle) {
    await apiDelete(`/vehicles/${vehicle._id}`);
    load();
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Fleet</h1>
        {canWrite && (
          <button
            type="button"
            onClick={() => setDialog("add")}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            <Plus className="size-4" strokeWidth={2.25} />
            Add Vehicle
          </button>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-xl border border-mist-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="">Type: All</option>
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
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reg. no..."
            className="rounded-xl border border-mist-300 bg-white py-2 pr-3 pl-9 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-[0_12px_40px_-16px_rgba(22,50,60,0.15)] dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-ink-500 uppercase dark:text-slate-400">
              <th className="px-6 py-3 font-semibold">Reg. No.</th>
              <th className="px-6 py-3 font-semibold">Name/Model</th>
              <th className="px-6 py-3 font-semibold">Type</th>
              <th className="px-6 py-3 font-semibold">Capacity</th>
              <th className="px-6 py-3 font-semibold">Odometer</th>
              <th className="px-6 py-3 font-semibold">Acq. Cost</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              {canWrite && <th className="px-6 py-3 font-semibold">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {vehicles === null && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-ink-500 dark:text-slate-400">
                  Loading...
                </td>
              </tr>
            )}
            {vehicles?.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-ink-500 dark:text-slate-400">
                  No vehicles match these filters.
                </td>
              </tr>
            )}
            {vehicles?.map((vehicle) => (
              <tr key={vehicle._id} className="border-t border-mist-100 dark:border-slate-800">
                <td className="px-6 py-3 font-semibold">{vehicle.registrationNumber}</td>
                <td className="px-6 py-3">{vehicle.name}</td>
                <td className="px-6 py-3">{vehicle.type}</td>
                <td className="px-6 py-3">{vehicle.maxLoadCapacityKg.toLocaleString("en-IN")} kg</td>
                <td className="px-6 py-3">{vehicle.odometerKm.toLocaleString("en-IN")}</td>
                <td className="px-6 py-3">₹{vehicle.acquisitionCost.toLocaleString("en-IN")}</td>
                <td className="px-6 py-3">
                  <StatusBadge status={vehicle.status} />
                </td>
                {canWrite && (
                  <td className="px-6 py-3">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setDialog(vehicle)}
                        className="font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        Edit
                      </button>
                      {vehicle.status !== "RETIRED" && (
                        <button
                          type="button"
                          onClick={() => retire(vehicle)}
                          className="font-semibold text-red-600 hover:text-red-700"
                        >
                          Retire
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dialog && (
        <Modal
          title={dialog === "add" ? "Add Vehicle" : "Edit Vehicle"}
          onClose={() => setDialog(null)}
        >
          <VehicleForm
            vehicle={dialog === "add" ? undefined : dialog}
            onSaved={() => {
              setDialog(null);
              load();
            }}
            onCancel={() => setDialog(null)}
          />
        </Modal>
      )}
    </div>
  );
}
