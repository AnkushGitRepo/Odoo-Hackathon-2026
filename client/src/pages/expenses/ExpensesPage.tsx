import { useEffect, useState } from "react";
import { Plus, IndianRupee, Fuel } from "lucide-react";
import { apiGet, apiPost, type ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { can } from "../../lib/rbac";
import type { FuelLog, ExpenseSummaryRow, Vehicle } from "../../lib/types";
import { Navigate } from "react-router-dom";

export default function ExpensesPage() {
  const { user } = useAuth();
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [summaryRows, setSummaryRows] = useState<ExpenseSummaryRow[]>([]);
  const [totalOperationalCost, setTotalOperationalCost] = useState(0);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (can(user!.role, "expenses") === null) {
    return <Navigate to="/dashboard" replace />;
  }

  const hasFullAccess = can(user!.role, "expenses") === "full";
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const fetchData = async () => {
    try {
      const [fLogs, summ] = await Promise.all([
        apiGet<FuelLog[]>("/fuel-logs"),
        apiGet<{ rows: ExpenseSummaryRow[], totalOperationalCost: number }>("/expenses/summary")
      ]);
      setFuelLogs(fLogs);
      setSummaryRows(summ.rows);
      setTotalOperationalCost(summ.totalOperationalCost);
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setPending(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl dark:text-slate-100">Fuel & Expenses</h1>
        {hasFullAccess && (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowFuelModal(true)}
              className="flex items-center gap-2 rounded-lg border border-mist-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 shadow-sm hover:bg-mist-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <Plus className="size-4" /> Log Fuel
            </button>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              <Plus className="size-4" /> Add Expense
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {!pending && (
        <div className="mt-6 flex items-center justify-between rounded-2xl bg-indigo-50 px-6 py-4 border border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-indigo-200 p-2 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300">
              <IndianRupee className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-wide text-indigo-600 uppercase dark:text-indigo-300">Total Operational Cost (Auto) = Fuel + Maintenance</p>
              <p className="text-2xl font-extrabold text-indigo-900 dark:text-indigo-200">₹{totalOperationalCost.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-bold text-ink-900 mb-4 dark:text-slate-100">Operational Cost by Vehicle</h2>
          <div className="overflow-x-auto rounded-2xl bg-white shadow-[0_12px_40px_-16px_rgba(22,50,60,0.15)] dark:bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-mist-100 text-xs text-ink-500 uppercase tracking-wide dark:border-slate-800 dark:text-slate-400">
                  <th className="px-6 py-4 font-semibold">Vehicle</th>
                  <th className="px-6 py-4 font-semibold text-right">Toll/Misc</th>
                  <th className="px-6 py-4 font-semibold text-right">Maint.</th>
                  <th className="px-6 py-4 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist-100 dark:divide-slate-800">
                {pending ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-ink-500 dark:text-slate-400">Loading...</td></tr>
                ) : summaryRows.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-ink-500 dark:text-slate-400">No vehicles found.</td></tr>
                ) : (
                  summaryRows.map((row) => (
                    <tr key={row.vehicleId} className="group hover:bg-mist-50/50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4 font-medium text-ink-900 dark:text-slate-100">
                        {row.name} <span className="text-xs text-ink-500 dark:text-slate-400">({row.registrationNumber})</span>
                      </td>
                      <td className="px-6 py-4 text-right text-ink-700 dark:text-slate-300">₹{row.tollMiscCost.toLocaleString("en-IN")}</td>
                      <td className="px-6 py-4 text-right text-ink-700 dark:text-slate-300">₹{row.maintenanceCost.toLocaleString("en-IN")}</td>
                      <td className="px-6 py-4 text-right font-bold text-ink-900 dark:text-slate-100">₹{row.operationalCost.toLocaleString("en-IN")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-ink-900 mb-4 dark:text-slate-100">Recent Fuel Logs</h2>
          <div className="overflow-x-auto rounded-2xl bg-white shadow-[0_12px_40px_-16px_rgba(22,50,60,0.15)] dark:bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-mist-100 text-xs text-ink-500 uppercase tracking-wide dark:border-slate-800 dark:text-slate-400">
                  <th className="px-6 py-4 font-semibold">Vehicle</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold text-right">Liters</th>
                  <th className="px-6 py-4 font-semibold text-right">Fuel Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist-100 dark:divide-slate-800">
                {pending ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-ink-500 dark:text-slate-400">Loading...</td></tr>
                ) : fuelLogs.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-ink-500 dark:text-slate-400">No fuel logs found.</td></tr>
                ) : (
                  fuelLogs.slice(0, 10).map((log) => (
                    <tr key={log._id} className="group hover:bg-mist-50/50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4 font-medium text-ink-900 dark:text-slate-100">
                        {log.vehicle?.name} <span className="text-xs text-ink-500 dark:text-slate-400">({log.vehicle?.registrationNumber})</span>
                      </td>
                      <td className="px-6 py-4 text-ink-700 dark:text-slate-300">{new Date(log.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right font-medium text-ink-900 dark:text-slate-100">{log.liters} L</td>
                      <td className="px-6 py-4 text-right font-bold text-ink-900 dark:text-slate-100">₹{log.cost.toLocaleString("en-IN")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showFuelModal && (
        <AddFuelModal
          onClose={() => setShowFuelModal(false)}
          onAdded={() => {
            setShowFuelModal(false);
            fetchData();
          }}
        />
      )}
      
      {showExpenseModal && (
        <AddExpenseModal
          onClose={() => setShowExpenseModal(false)}
          onAdded={() => {
            setShowExpenseModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

function AddFuelModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [liters, setLiters] = useState("");
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
      await apiPost("/fuel-logs", {
        vehicleId,
        liters: Number(liters),
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
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <h2 className="text-xl font-bold text-ink-900 flex items-center gap-2 dark:text-slate-100">
          <Fuel className="size-5" /> Log Fuel
        </h2>
        {error && <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg dark:bg-red-500/10 dark:text-red-400">{error}</div>}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm">
          <div>
            <label className="block font-semibold text-ink-700 dark:text-slate-300">Vehicle</label>
            <select
              required
              className="mt-1 w-full rounded-lg border border-mist-200 px-3 py-2 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            >
              <option value="" disabled>Select a vehicle</option>
              {vehicles.map(v => (
                <option key={v._id} value={v._id}>{v.name} ({v.registrationNumber})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-ink-700 dark:text-slate-300">Liters</label>
              <input required type="number" min="0.1" step="0.1" className="mt-1 w-full rounded-lg border border-mist-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" value={liters} onChange={e => setLiters(e.target.value)} />
            </div>
            <div>
              <label className="block font-semibold text-ink-700 dark:text-slate-300">Total Cost (₹)</label>
              <input required type="number" min="0" step="1" className="mt-1 w-full rounded-lg border border-mist-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" value={cost} onChange={e => setCost(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-ink-700 dark:text-slate-300">Date</label>
            <input required type="date" className="mt-1 w-full rounded-lg border border-mist-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          
          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-mist-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 font-semibold text-ink-500 hover:bg-mist-50 dark:text-slate-400 dark:hover:bg-slate-800">Cancel</button>
            <button type="submit" disabled={saving || !vehicleId} className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
              {saving ? "Saving..." : "Save Log"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddExpenseModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [category, setCategory] = useState("TOLL");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
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
      await apiPost("/expenses", {
        vehicleId,
        category,
        amount: Number(amount),
        date: new Date(date).toISOString(),
        note: note || undefined,
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
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <h2 className="text-xl font-bold text-ink-900 dark:text-slate-100">Add Expense</h2>
        {error && <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg dark:bg-red-500/10 dark:text-red-400">{error}</div>}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm">
          <div>
            <label className="block font-semibold text-ink-700 dark:text-slate-300">Vehicle</label>
            <select
              required
              className="mt-1 w-full rounded-lg border border-mist-200 px-3 py-2 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            >
              <option value="" disabled>Select a vehicle</option>
              {vehicles.map(v => (
                <option key={v._id} value={v._id}>{v.name} ({v.registrationNumber})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-ink-700 dark:text-slate-300">Category</label>
              <select
                required
                className="mt-1 w-full rounded-lg border border-mist-200 px-3 py-2 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="TOLL">Toll</option>
                <option value="MISC">Misc</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-ink-700 dark:text-slate-300">Amount (₹)</label>
              <input required type="number" min="0" step="1" className="mt-1 w-full rounded-lg border border-mist-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-ink-700 dark:text-slate-300">Date</label>
            <input required type="date" className="mt-1 w-full rounded-lg border border-mist-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="block font-semibold text-ink-700 dark:text-slate-300">Note (Optional)</label>
            <input type="text" className="mt-1 w-full rounded-lg border border-mist-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" value={note} onChange={e => setNote(e.target.value)} />
          </div>
          
          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-mist-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 font-semibold text-ink-500 hover:bg-mist-50 dark:text-slate-400 dark:hover:bg-slate-800">Cancel</button>
            <button type="submit" disabled={saving || !vehicleId} className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
              {saving ? "Saving..." : "Save Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
