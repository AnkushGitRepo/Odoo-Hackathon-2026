import { useState, type FormEvent } from "react";
import { apiPost, apiPut, type ApiError } from "../../lib/api";
import type { Vehicle, VehicleType } from "../../lib/types";

const VEHICLE_TYPES: VehicleType[] = ["VAN", "TRUCK", "MINI", "BIKE"];

export default function VehicleForm({
  vehicle,
  onSaved,
  onCancel,
}: {
  vehicle?: Vehicle;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [registrationNumber, setRegistrationNumber] = useState(
    vehicle?.registrationNumber ?? "",
  );
  const [name, setName] = useState(vehicle?.name ?? "");
  const [type, setType] = useState<VehicleType>(vehicle?.type ?? "VAN");
  const [maxLoadCapacityKg, setMaxLoadCapacityKg] = useState(
    vehicle ? String(vehicle.maxLoadCapacityKg) : "",
  );
  const [odometerKm, setOdometerKm] = useState(vehicle ? String(vehicle.odometerKm) : "0");
  const [acquisitionCost, setAcquisitionCost] = useState(
    vehicle ? String(vehicle.acquisitionCost) : "",
  );
  const [region, setRegion] = useState(vehicle?.region ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const body = {
      registrationNumber,
      name,
      type,
      maxLoadCapacityKg: Number(maxLoadCapacityKg),
      odometerKm: Number(odometerKm),
      acquisitionCost: Number(acquisitionCost),
      region,
    };
    try {
      if (vehicle) {
        await apiPut(`/vehicles/${vehicle._id}`, body);
      } else {
        await apiPost("/vehicles", body);
      }
      onSaved();
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-mist-300 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none";
  const labelClass = "text-sm font-semibold text-ink-700";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {error && (
        <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-2">
          <span className={labelClass}>Registration No.</span>
          <input
            className={inputClass}
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            placeholder="GJ01AB4521"
            required
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className={labelClass}>Name / Model</span>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VAN-05"
            required
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-2">
          <span className={labelClass}>Type</span>
          <select
            className={inputClass}
            value={type}
            onChange={(e) => setType(e.target.value as VehicleType)}
          >
            {VEHICLE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className={labelClass}>Max Load Capacity (kg)</span>
          <input
            type="number"
            min="1"
            step="any"
            className={inputClass}
            value={maxLoadCapacityKg}
            onChange={(e) => setMaxLoadCapacityKg(e.target.value)}
            required
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-2">
          <span className={labelClass}>Odometer (km)</span>
          <input
            type="number"
            min="0"
            className={inputClass}
            value={odometerKm}
            onChange={(e) => setOdometerKm(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className={labelClass}>Acquisition Cost (₹)</span>
          <input
            type="number"
            min="0"
            className={inputClass}
            value={acquisitionCost}
            onChange={(e) => setAcquisitionCost(e.target.value)}
            required
          />
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className={labelClass}>Region</span>
        <input
          className={inputClass}
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="Gandhinagar"
        />
      </label>

      <div className="mt-2 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-500 hover:bg-mist-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
        >
          {busy ? "Saving..." : vehicle ? "Save changes" : "Add Vehicle"}
        </button>
      </div>
    </form>
  );
}
