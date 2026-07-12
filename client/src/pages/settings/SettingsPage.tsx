import { useState, type FormEvent } from "react";
import { Check, Minus, Eye } from "lucide-react";
import { ROLE_LABELS, type Role } from "../../lib/types";
import { can, type Module } from "../../lib/rbac";

const STORAGE_KEY = "transitops_settings";

interface GeneralSettings {
  depotName: string;
  currency: string;
  distanceUnit: string;
}

const DEFAULTS: GeneralSettings = {
  depotName: "Gandhinagar Depot GJ4",
  currency: "INR (Rs)",
  distanceUnit: "Kilometers",
};

function loadSettings(): GeneralSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

const ROLES: Role[] = ["FLEET_MANAGER", "DISPATCHER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"];
const MODULES: Array<{ key: Module; label: string }> = [
  { key: "fleet", label: "Fleet" },
  { key: "drivers", label: "Drivers" },
  { key: "trips", label: "Trips" },
  { key: "expenses", label: "Fuel/Exp." },
  { key: "analytics", label: "Analytics" },
];

function AccessIcon({ access }: { access: "full" | "view" | null }) {
  if (access === "full")
    return (
      <Check
        className="mx-auto size-4 text-green-600 dark:text-green-400"
        strokeWidth={2.5}
      />
    );
  if (access === "view")
    return (
      <Eye className="mx-auto size-4 text-ink-500 dark:text-slate-400" strokeWidth={2} />
    );
  return <Minus className="mx-auto size-4 text-mist-300 dark:text-slate-700" strokeWidth={2} />;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<GeneralSettings>(loadSettings);
  const [saved, setSaved] = useState(false);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const inputClass =
    "w-full rounded-xl border border-mist-300 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";
  const labelClass = "text-sm font-semibold text-ink-700 dark:text-slate-300";

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Settings</h1>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-[0_12px_40px_-16px_rgba(22,50,60,0.15)] dark:bg-slate-900">
        <h2 className="text-sm font-bold tracking-wide uppercase">General</h2>
        <form onSubmit={onSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 sm:col-span-2">
            <span className={labelClass}>Depot Name</span>
            <input
              className={inputClass}
              value={settings.depotName}
              onChange={(e) => setSettings({ ...settings, depotName: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className={labelClass}>Currency</span>
            <select
              className={inputClass}
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
            >
              <option>INR (Rs)</option>
              <option>USD ($)</option>
              <option>EUR (€)</option>
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className={labelClass}>Distance Unit</span>
            <select
              className={inputClass}
              value={settings.distanceUnit}
              onChange={(e) => setSettings({ ...settings, distanceUnit: e.target.value })}
            >
              <option>Kilometers</option>
              <option>Miles</option>
            </select>
          </label>
          <div className="flex items-center gap-3 sm:col-span-2">
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Save changes
            </button>
            {saved && (
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                Saved.
              </span>
            )}
          </div>
        </form>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_-16px_rgba(22,50,60,0.15)] dark:bg-slate-900">
        <h2 className="px-6 pt-5 text-sm font-bold tracking-wide uppercase">
          Role-Based Access (RBAC)
        </h2>
        <p className="px-6 pt-1 text-xs text-ink-500 dark:text-slate-400">
          Read-only. Full access grants create/edit; view is read-only.
        </p>
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-t border-mist-100 text-xs text-ink-500 uppercase dark:border-slate-800 dark:text-slate-400">
              <th className="px-6 py-3 font-semibold">Role</th>
              {MODULES.map((m) => (
                <th key={m.key} className="px-3 py-3 text-center font-semibold">
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROLES.map((role) => (
              <tr key={role} className="border-t border-mist-100 dark:border-slate-800">
                <td className="px-6 py-3 font-semibold">{ROLE_LABELS[role]}</td>
                {MODULES.map((m) => (
                  <td key={m.key} className="px-3 py-3 text-center">
                    <AccessIcon access={can(role, m.key)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex flex-wrap gap-6 border-t border-mist-100 px-6 py-4 text-xs text-ink-500 dark:border-slate-800 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <Check className="size-3.5 text-green-600 dark:text-green-400" /> Full access
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="size-3.5" /> View only
          </span>
          <span className="flex items-center gap-1.5">
            <Minus className="size-3.5 text-mist-300 dark:text-slate-700" /> No access
          </span>
        </div>
      </div>
    </div>
  );
}
