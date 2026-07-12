import { useState, type FormEvent } from "react";
import Modal from "../../components/Modal";
import { apiPost, type ApiError } from "../../lib/api";
import type { Trip } from "../../lib/types";

const inputClass =
  "w-full rounded-xl border border-mist-300 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";
const labelClass = "text-sm font-semibold text-ink-700 dark:text-slate-300";

export default function CompleteTripDialog({
  trip,
  onClose,
  onCompleted,
}: {
  trip: Trip;
  onClose: () => void;
  onCompleted: () => void;
}) {
  const [endOdometer, setEndOdometer] = useState(
    trip.startOdometer !== null ? String(trip.startOdometer) : "",
  );
  const [fuelUsedL, setFuelUsedL] = useState("");
  const [fuelCost, setFuelCost] = useState("");
  const [revenue, setRevenue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await apiPost(`/trips/${trip._id}/complete`, {
        endOdometer: Number(endOdometer),
        fuelUsedL: Number(fuelUsedL),
        fuelCost: Number(fuelCost),
        revenue: Number(revenue),
      });
      onCompleted();
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`Complete ${trip.code}`} onClose={onClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {error && (
          <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <label className="flex flex-col gap-2">
          <span className={labelClass}>
            End Odometer (km) — start was {trip.startOdometer?.toLocaleString("en-IN")}
          </span>
          <input
            type="number"
            min={trip.startOdometer ?? 0}
            className={inputClass}
            value={endOdometer}
            onChange={(e) => setEndOdometer(e.target.value)}
            required
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className={labelClass}>Fuel Used (L)</span>
            <input
              type="number"
              min="0"
              className={inputClass}
              value={fuelUsedL}
              onChange={(e) => setFuelUsedL(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className={labelClass}>Fuel Cost (₹)</span>
            <input
              type="number"
              min="0"
              className={inputClass}
              value={fuelCost}
              onChange={(e) => setFuelCost(e.target.value)}
              required
            />
          </label>
        </div>

        <label className="flex flex-col gap-2">
          <span className={labelClass}>Revenue (₹)</span>
          <input
            type="number"
            min="0"
            className={inputClass}
            value={revenue}
            onChange={(e) => setRevenue(e.target.value)}
            required
          />
        </label>

        <p className="text-xs text-ink-500 dark:text-slate-400">
          On Complete: odometer → fuel log → expenses → Vehicle &amp; Driver Available.
        </p>

        <div className="mt-1 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-500 hover:bg-mist-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
          >
            {busy ? "Completing..." : "Complete Trip"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
