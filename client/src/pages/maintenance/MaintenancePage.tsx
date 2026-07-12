import { useEffect, useState } from "react";
import { Plus, Wrench } from "lucide-react";
import { apiGet, apiPost, type ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { can } from "../../lib/rbac";
import type { MaintenanceLog, Vehicle } from "../../lib/types";

export default function MaintenancePage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasFullAccess = can(user!.role, "maintenance") === "full";
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchLogs = () => {
    apiGet<MaintenanceLog[]>("/maintenance")
      .then(setLogs)
      .catch((err) => setError((err as ApiError).message))
      .finally(() => setPending(false));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleCloseLog = async (logId: string) => {
    try {
      await apiPost(`/maintenance/${logId}/close`);
      fetchLogs();
    } catch (err) {
      alert((err as ApiError).message);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Maintenance</h1>
        {hasFullAccess && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            <Plus className="size-4" /> Log Service Record
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_-16px_rgba(22,50,60,0.15)]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-mist-100 text-xs text-ink-500 uppercase tracking-wide">
              <th className="px-6 py-4 font-semibold">Vehicle</th>
              <th className="px-6 py-4 font-semibold">Service</th>
              <th className="px-6 py-4 font-semibold text-right">Cost</th>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              {hasFullAccess && <th className="px-6 py-4 font-semibold text-right">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-mist-100">
            {pending ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-mist-500">Loading...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-mist-500">No maintenance records found.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} className="group hover:bg-mist-50/50">
                  <td className="px-6 py-4 font-medium text-ink-900">
                    {log.vehicle?.name} <span className="text-xs text-ink-500">({log.vehicle?.registrationNumber})</span>
                  </td>
                  <td className="px-6 py-4 text-ink-700">{log.serviceType}</td>
                  <td className="px-6 py-4 text-right font-medium text-ink-900">
                    ₹{log.cost.toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 text-ink-700">
                    {new Date(log.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {log.status === "ACTIVE" ? (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                        IN SHOP
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                        COMPLETED
                      </span>
                    )}
                  </td>
                  {hasFullAccess && (
                    <td className="px-6 py-4 text-right">
                      {log.status === "ACTIVE" && (
                        <button
                          onClick={() => handleCloseLog(log._id)}
                          className="rounded-lg border border-mist-200 bg-white px-3 py-1 text-xs font-semibold text-ink-700 hover:bg-mist-50 shadow-sm"
                        >
                          Close
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="bg-mist-50 px-6 py-3 text-xs text-ink-500 flex items-center gap-2 border-t border-mist-100">
          <Wrench className="size-4" />
          In Shop vehicles are removed from the dispatch pool.
        </div>
      </div>

      {showAddModal && (
        <AddMaintenanceModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => {
            setShowAddModal(false);
            fetchLogs();
          }}
        />
      )}
    </div>
  );
}

function AddMaintenanceModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [cost, setCost] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet<Vehicle[]>("/vehicles")
      .then(setVehicles)
      .catch((err) => setError((err as ApiError).message));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiPost("/maintenance", {
        vehicleId,
        serviceType,
        cost: Number(cost),
        date: new Date(date).toISOString(),
      });
      onAdded();
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-ink-900">Log Service Record</h2>
        {error && <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm">
          <div>
            <label className="block font-semibold text-ink-700">Vehicle</label>
            <select
              required
              className="mt-1 w-full rounded-lg border border-mist-200 px-3 py-2 bg-white"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            >
              <option value="" disabled>Select a vehicle</option>
              {vehicles.map(v => (
                <option key={v._id} value={v._id}>{v.name} ({v.registrationNumber})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-ink-700">Service Type</label>
            <input required type="text" className="mt-1 w-full rounded-lg border border-mist-200 px-3 py-2" value={serviceType} onChange={e => setServiceType(e.target.value)} />
          </div>
          <div>
            <label className="block font-semibold text-ink-700">Cost (₹)</label>
            <input required type="number" min="0" step="1" className="mt-1 w-full rounded-lg border border-mist-200 px-3 py-2" value={cost} onChange={e => setCost(e.target.value)} />
          </div>
          <div>
            <label className="block font-semibold text-ink-700">Date</label>
            <input required type="date" className="mt-1 w-full rounded-lg border border-mist-200 px-3 py-2" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          
          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-mist-100">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 font-semibold text-ink-500 hover:bg-mist-50">Cancel</button>
            <button type="submit" disabled={saving || !vehicleId} className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
              {saving ? "Saving..." : "Save Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
