const TONE_CLASSES: Record<string, string> = {
  green: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  gray: "bg-mist-100 text-ink-500 dark:bg-slate-800 dark:text-slate-400",
  red: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
};

/** Status → color tone per DESIGN.md. Shared across Fleet/Drivers/Trips/Maintenance. */
const STATUS_TONES: Record<string, keyof typeof TONE_CLASSES> = {
  AVAILABLE: "green",
  ON_TRIP: "blue",
  IN_SHOP: "amber",
  RETIRED: "gray",
  OFF_DUTY: "gray",
  SUSPENDED: "red",
  DRAFT: "gray",
  DISPATCHED: "blue",
  COMPLETED: "green",
  CANCELLED: "red",
  ACTIVE: "amber",
};

export default function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONES[status] ?? "gray";
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${TONE_CLASSES[tone]}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
