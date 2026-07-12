import StatusBadge from "../../components/StatusBadge";
import type { Trip } from "../../lib/types";

export default function TripCard({
  trip,
  canWrite,
  onDispatch,
  onComplete,
  onCancel,
}: {
  trip: Trip;
  canWrite: boolean;
  onDispatch: () => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const assignment =
    trip.vehicle && trip.driver
      ? `${trip.vehicle.name} / ${trip.driver.name.toUpperCase()}`
      : "Unassigned";

  const note =
    trip.status === "CANCELLED"
      ? trip.cancelReason ?? "Cancelled"
      : trip.status === "DRAFT" && !trip.vehicle
        ? "Awaiting vehicle"
        : trip.status === "DRAFT"
          ? "Awaiting dispatch"
          : trip.status === "DISPATCHED"
            ? `${trip.plannedDistanceKm} km planned`
            : trip.status === "COMPLETED"
              ? `₹${trip.revenue?.toLocaleString("en-IN") ?? 0} revenue`
              : "";

  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_12px_40px_-16px_rgba(22,50,60,0.15)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold">{trip.code}</p>
          <p className="mt-0.5 text-xs text-ink-500">{assignment}</p>
        </div>
        <StatusBadge status={trip.status} />
      </div>
      <p className="mt-3 text-sm">
        {trip.source} <span className="text-ink-500">-&gt;</span> {trip.destination}
      </p>
      <p className="mt-1 text-xs text-ink-500">{note}</p>

      {canWrite && (
        <div className="mt-4 flex gap-3">
          {trip.status === "DRAFT" && (
            <button
              type="button"
              onClick={onDispatch}
              disabled={!trip.vehicle || !trip.driver}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              Dispatch
            </button>
          )}
          {trip.status === "DISPATCHED" && (
            <button
              type="button"
              onClick={onComplete}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Complete
            </button>
          )}
          {(trip.status === "DRAFT" || trip.status === "DISPATCHED") && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
