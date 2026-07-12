import { Hammer } from "lucide-react";

/** Stub for module pages that ship in later slices (docs/TASKS.md M1-M8). */
export default function PlaceholderPage({
  title,
  description,
  task,
}: {
  title: string;
  description: string;
  task: string;
}) {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
      <div className="mt-6 rounded-2xl bg-white p-8 shadow-[0_12px_40px_-16px_rgba(22,50,60,0.15)]">
        <Hammer className="size-6 text-indigo-600" strokeWidth={1.75} />
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-500">
          {description} This module is task {task} on the board (docs/TASKS.md).
        </p>
      </div>
    </div>
  );
}
