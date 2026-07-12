import { useEffect, useState } from "react";
import { apiGet, apiPost, type ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { can } from "../../lib/rbac";
import type { Trip } from "../../lib/types";
import LifecycleStepper from "./LifecycleStepper";
import TripForm from "./TripForm";
import TripCard from "./TripCard";
import CompleteTripDialog from "./CompleteTripDialog";

export default function TripsPage() {
  const { user } = useAuth();
  const canWrite = user ? can(user.role, "trips") === "full" : false;

  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState<Trip | null>(null);

  async function load() {
    const data = await apiGet<Trip[]>("/trips");
    setTrips(data);
  }

  useEffect(() => {
    load().catch(() => setTrips([]));
  }, []);

  async function dispatch(trip: Trip) {
    setError(null);
    try {
      await apiPost(`/trips/${trip._id}/dispatch`, {});
      load();
    } catch (err) {
      setError((err as ApiError).message);
    }
  }

  async function cancel(trip: Trip) {
    setError(null);
    try {
      await apiPost(`/trips/${trip._id}/cancel`, {});
      load();
    } catch (err) {
      setError((err as ApiError).message);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Trip Dispatcher</h1>

      <div className="mt-6">
        <LifecycleStepper />
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400"
        >
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {canWrite && (
          <div>
            <TripForm onCreated={load} />
          </div>
        )}

        <div className={canWrite ? "" : "lg:col-span-2"}>
          <h2 className="text-sm font-bold tracking-wide uppercase">Live Board</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {trips === null && (
              <p className="text-sm text-ink-500 dark:text-slate-400">Loading...</p>
            )}
            {trips?.length === 0 && (
              <p className="text-sm text-ink-500 dark:text-slate-400">No trips yet.</p>
            )}
            {trips?.map((trip) => (
              <TripCard
                key={trip._id}
                trip={trip}
                canWrite={canWrite}
                onDispatch={() => dispatch(trip)}
                onComplete={() => setCompleting(trip)}
                onCancel={() => cancel(trip)}
              />
            ))}
          </div>
        </div>
      </div>

      {completing && (
        <CompleteTripDialog
          trip={completing}
          onClose={() => setCompleting(null)}
          onCompleted={() => {
            setCompleting(null);
            load();
          }}
        />
      )}
    </div>
  );
}
