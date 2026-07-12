import { useEffect, useState } from "react";
import { Plus, AlertCircle } from "lucide-react";
import { apiGet, apiPost, apiPut, type ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { can } from "../../lib/rbac";
import type { Driver, LicenseCategory, DriverStatus } from "../../lib/types";

export default function DriversPage() {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const hasFullAccess = can(user!.role, "drivers") === "full";
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchDrivers = () => {
    apiGet<Driver[]>("/drivers")
      .then(setDrivers)
      .catch((err) => setError((err as ApiError).message))
      .finally(() => setPending(false));
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleStatusChange = async (driverId: string, newStatus: DriverStatus) => {
    try {
      await apiPut(`/drivers/${driverId}`, { status: newStatus });
      fetchDrivers();
    } catch (err) {
      alert((err as ApiError).message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE": return "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-400";
      case "ON_TRIP": return "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400";
      case "SUSPENDED": return "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400";
      case "OFF_DUTY": return "bg-mist-100 text-ink-500 dark:bg-slate-800 dark:text-slate-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-400";
    }
  };

  const expiringDriversCount = drivers.filter(d => {
    const expiry = new Date(d.licenseExpiry);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiry < thirtyDaysFromNow;
  }).length;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl dark:text-slate-100">Drivers</h1>
        {hasFullAccess && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            <Plus className="size-4" /> Add Driver
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {expiringDriversCount > 0 && !pending && (
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
          <AlertCircle className="size-5 shrink-0" />
          <p>
            <span className="font-bold">{expiringDriversCount} driver{expiringDriversCount === 1 ? '' : 's'}</span> have licenses that are expired or expiring within 30 days. Please review and update their records.
          </p>
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-[0_12px_40px_-16px_rgba(22,50,60,0.15)] dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-mist-100 text-xs text-ink-500 uppercase tracking-wide dark:border-slate-800 dark:text-slate-400">
              <th className="px-6 py-4 font-semibold">Driver</th>
              <th className="px-6 py-4 font-semibold">License No.</th>
              <th className="px-6 py-4 font-semibold">Category</th>
              <th className="px-6 py-4 font-semibold">Expiry</th>
              <th className="px-6 py-4 font-semibold">Contact</th>
              <th className="px-6 py-4 font-semibold text-right">Compl. %</th>
              <th className="px-6 py-4 font-semibold text-right">Safety</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              {hasFullAccess && <th className="px-6 py-4 font-semibold">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-mist-100 dark:divide-slate-800">
            {pending ? (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-ink-500 dark:text-slate-400">Loading...</td>
              </tr>
            ) : drivers.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-ink-500 dark:text-slate-400">No drivers found.</td>
              </tr>
            ) : (
              drivers.map((driver) => {
                const isExpired = new Date(driver.licenseExpiry) < new Date();
                return (
                  <tr key={driver._id} className="group hover:bg-mist-50/50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 font-medium text-ink-900 dark:text-slate-100">{driver.name}</td>
                    <td className="px-6 py-4 text-ink-700 dark:text-slate-300">{driver.licenseNumber}</td>
                    <td className="px-6 py-4 text-ink-700 dark:text-slate-300">{driver.licenseCategory.join(", ")}</td>
                    <td className="px-6 py-4">
                      {isExpired ? (
                        <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800 dark:bg-red-500/15 dark:text-red-400">
                          EXPIRED
                        </span>
                      ) : (
                        <span className="text-ink-700 dark:text-slate-300">
                          {new Date(driver.licenseExpiry).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-ink-700 dark:text-slate-300">{driver.contact}</td>
                    <td className="px-6 py-4 text-right font-medium text-ink-900 dark:text-slate-100">{driver.tripCompletionRate}%</td>
                    <td className="px-6 py-4 text-right font-medium text-ink-900 dark:text-slate-100">{driver.safetyScore}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(driver.status)}`}>
                        {driver.status.replace("_", " ")}
                      </span>
                    </td>
                    {hasFullAccess && (
                      <td className="px-6 py-4">
                        <select
                          className="rounded-md border border-mist-200 bg-white py-1 px-2 text-sm shadow-sm disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                          value={driver.status}
                          disabled={driver.status === "ON_TRIP"}
                          onChange={(e) => handleStatusChange(driver._id, e.target.value as DriverStatus)}
                        >
                          <option value="AVAILABLE" disabled={driver.status === "ON_TRIP"}>AVAILABLE</option>
                          <option value="OFF_DUTY" disabled={driver.status === "ON_TRIP"}>OFF DUTY</option>
                          <option value="SUSPENDED" disabled={driver.status === "ON_TRIP"}>SUSPENDED</option>
                          {driver.status === "ON_TRIP" && <option value="ON_TRIP">ON TRIP</option>}
                        </select>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div className="bg-mist-50 px-6 py-3 text-xs text-ink-500 flex items-center gap-2 border-t border-mist-100 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800">
          <AlertCircle className="size-4" />
          Expired license or Suspended status → blocked from trip assignment.
        </div>
      </div>

      {showAddModal && (
        <AddDriverModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => {
            setShowAddModal(false);
            fetchDrivers();
          }}
        />
      )}
    </div>
  );
}

function AddDriverModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [name, setName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseCategory, setLicenseCategory] = useState<LicenseCategory[]>([]);
  const [licenseExpiry, setLicenseExpiry] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (licenseCategory.length === 0) {
      setError("At least one license category is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiPost("/drivers", {
        name,
        licenseNumber,
        licenseCategory,
        licenseExpiry: new Date(licenseExpiry).toISOString(),
        contact,
      });
      onAdded();
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (cat: LicenseCategory) => {
    setLicenseCategory(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <h2 className="text-xl font-bold text-ink-900 dark:text-slate-100">Add Driver</h2>
        {error && <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg dark:bg-red-500/10 dark:text-red-400">{error}</div>}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm">
          <div>
            <label className="block font-semibold text-ink-700 dark:text-slate-300">Name</label>
            <input required type="text" className="mt-1 w-full rounded-lg border border-mist-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="block font-semibold text-ink-700 dark:text-slate-300">License Number</label>
            <input required type="text" className="mt-1 w-full rounded-lg border border-mist-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} />
          </div>
          <div>
            <label className="block font-semibold text-ink-700 dark:text-slate-300">License Category</label>
            <div className="mt-2 flex gap-4 dark:text-slate-100">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={licenseCategory.includes("LMV")} onChange={() => toggleCategory("LMV")} className="dark:bg-slate-800 dark:border-slate-700" />
                LMV
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={licenseCategory.includes("HMV")} onChange={() => toggleCategory("HMV")} className="dark:bg-slate-800 dark:border-slate-700" />
                HMV
              </label>
            </div>
          </div>
          <div>
            <label className="block font-semibold text-ink-700 dark:text-slate-300">License Expiry</label>
            <input required type="date" className="mt-1 w-full rounded-lg border border-mist-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" value={licenseExpiry} onChange={e => setLicenseExpiry(e.target.value)} />
          </div>
          <div>
            <label className="block font-semibold text-ink-700 dark:text-slate-300">Contact</label>
            <input required type="text" className="mt-1 w-full rounded-lg border border-mist-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" value={contact} onChange={e => setContact(e.target.value)} />
          </div>
          
          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-mist-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 font-semibold text-ink-500 hover:bg-mist-50 dark:text-slate-400 dark:hover:bg-slate-800">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
              {saving ? "Saving..." : "Save Driver"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
