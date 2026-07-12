import { useState, type FormEvent } from "react";

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
    </div>
  );
}
