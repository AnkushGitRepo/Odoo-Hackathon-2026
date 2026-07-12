const STAGES = ["Draft", "Dispatched", "Completed"];

export default function LifecycleStepper() {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-semibold shadow-[0_12px_40px_-16px_rgba(22,50,60,0.15)] dark:bg-slate-900">
      {STAGES.map((stage, i) => (
        <div key={stage} className="flex items-center gap-2">
          <span className="rounded-full bg-mist-100 px-3 py-1 text-ink-700 dark:bg-slate-800 dark:text-slate-300">
            {stage}
          </span>
          {i < STAGES.length - 1 && (
            <span className="text-ink-500 dark:text-slate-400">→</span>
          )}
        </div>
      ))}
      <span className="text-ink-500 dark:text-slate-400">|</span>
      <span className="rounded-full bg-red-100 px-3 py-1 text-red-700 dark:bg-red-500/15 dark:text-red-400">
        Cancelled
      </span>
    </div>
  );
}
