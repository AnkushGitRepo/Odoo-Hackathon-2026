import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { VehicleStatus } from "../../lib/types";

const COLORS: Record<VehicleStatus, string> = {
  AVAILABLE: "#16a34a",
  ON_TRIP: "#2563eb",
  IN_SHOP: "#d97706",
  RETIRED: "#94a3b8",
};

export default function StatusDonut({
  breakdown,
}: {
  breakdown: Record<VehicleStatus, number>;
}) {
  const data = (Object.keys(breakdown) as VehicleStatus[])
    .map((status) => ({ status, value: breakdown[status] }))
    .filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <p className="text-sm text-ink-500 dark:text-slate-400">
        No vehicles match these filters.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="status"
              innerRadius={52}
              outerRadius={80}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((d) => (
                <Cell key={d.status} fill={COLORS[d.status]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [String(value), String(name).replace(/_/g, " ")]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {data.map((d) => (
          <li key={d.status} className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: COLORS[d.status] }}
            />
            <span className="text-ink-700 dark:text-slate-300">
              {d.status.replace(/_/g, " ")}
            </span>
            <span className="font-semibold text-ink-900 dark:text-slate-100">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
