import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CircleCheck } from "lucide-react";
import { apiGet, apiPost, type ApiError } from "../../lib/api";
import type { Driver, Vehicle } from "../../lib/types";

const inputClass =
  "w-full rounded-xl border border-mist-300 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none";
const labelClass = "text-sm font-semibold text-ink-700";

export default function TripForm({ onCreated }: { onCreated: () => void }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[] | "unavailable">([]);

  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [cargoWeightKg, setCargoWeightKg] = useState("");
  const [plannedDistanceKm, setPlannedDistanceKm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiGet<Vehicle[]>("/vehicles/dispatchable")
      .then(setVehicles)
      .catch(() => setVehicles([]));
    // /api/drivers/assignable ships with the Drivers module (M2) — degrade
    // gracefully if it isn't live yet rather than blocking this page.
    apiGet<Driver[]>("/drivers/assignable")
      .then(setDrivers)
      .catch(() => setDrivers("unavailable"));
  }, []);

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v._id === vehicleId) ?? null,
    [vehicles, vehicleId],
  );
  const cargo = Number(cargoWeightKg) || 0;
  const capacityExceeded = selectedVehicle !== null && cargo > selectedVehicle.maxLoadCapacityKg;

  function reset() {
    setSource("");
    setDestination("");
    setVehicleId("");
    setDriverId("");
    setCargoWeightKg("");
    setPlannedDistanceKm("");
    setError(null);
  }

  async function save(dispatch: boolean) {
    setError(null);
    setBusy(true);
    try {
      const trip = await apiPost<{ _id: string }>("/trips", {
        source,
        destination,
        vehicleId: vehicleId || undefined,
        driverId: driverId || undefined,
        cargoWeightKg: cargo,
        plannedDistanceKm: Number(plannedDistanceKm) || 0,
      });
      if (dispatch) {
        await apiPost(`/trips/${trip._id}/dispatch`, {});
      }
      reset();
      onCreated();
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_12px_40px_-16px_rgba(22,50,60,0.15)]">
      <h2 className="text-sm font-bold tracking-wide uppercase">Create Trip</h2>

      {error && (
        <div role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-2">
          <span className={labelClass}>Source</span>
          <input
            className={inputClass}
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Gandhinagar Depot"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className={labelClass}>Destination</span>
          <input
            className={inputClass}
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Ahmedabad Hub"
          />
        </label>
      </div>

      <label className="mt-4 flex flex-col gap-2">
        <span className={labelClass}>Vehicle (available only)</span>
        <select className={inputClass} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
          <option value="">Select a vehicle...</option>
          {vehicles.map((v) => (
            <option key={v._id} value={v._id}>
              {v.name} - {v.maxLoadCapacityKg.toLocaleString("en-IN")} kg capacity
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 flex flex-col gap-2">
        <span className={labelClass}>Driver (available only)</span>
        <select
          className={inputClass}
          value={driverId}
          onChange={(e) => setDriverId(e.target.value)}
          disabled={drivers === "unavailable"}
        >
          <option value="">Select a driver...</option>
          {drivers !== "unavailable" &&
            drivers.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
        </select>
        {drivers === "unavailable" && (
          <span className="text-xs text-ink-500">
            Driver list isn't available yet — waiting on the Drivers module.
          </span>
        )}
      </label>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-2">
          <span className={labelClass}>Cargo Weight (kg)</span>
          <input
            type="number"
            min="0"
            className={inputClass}
            value={cargoWeightKg}
            onChange={(e) => setCargoWeightKg(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className={labelClass}>Planned Distance (km)</span>
          <input
            type="number"
            min="0"
            className={inputClass}
            value={plannedDistanceKm}
            onChange={(e) => setPlannedDistanceKm(e.target.value)}
          />
        </label>
      </div>

      {selectedVehicle && cargo > 0 && (
        <div
          className={`mt-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${
            capacityExceeded ? "bg-amber-50 text-amber-900" : "bg-green-50 text-green-800"
          }`}
        >
          {capacityExceeded ? (
            <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
          ) : (
            <CircleCheck className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
          )}
          <span>
            Vehicle Capacity: {selectedVehicle.maxLoadCapacityKg.toLocaleString("en-IN")} kg /
            Cargo Weight: {cargo.toLocaleString("en-IN")} kg
            {capacityExceeded &&
              ` — Capacity exceeded by ${(cargo - selectedVehicle.maxLoadCapacityKg).toLocaleString("en-IN")} kg — dispatch blocked`}
          </span>
        </div>
      )}

      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-500 hover:bg-mist-100"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy || !source || !destination || !cargo}
          onClick={() => save(false)}
          className="rounded-xl border border-indigo-600 px-5 py-2.5 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 disabled:opacity-50"
        >
          Save Draft
        </button>
        <button
          type="button"
          disabled={busy || !vehicleId || !driverId || capacityExceeded || !cargo}
          onClick={() => save(true)}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          Dispatch
        </button>
      </div>
    </div>
  );
}
