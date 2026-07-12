import type { InputHTMLAttributes, ReactNode } from "react";

export function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink-700">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-mist-300 bg-white px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-500/60 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
    />
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

export function SubmitButton({
  children,
  busy,
}: {
  children: ReactNode;
  busy: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {busy ? "Please wait..." : children}
    </button>
  );
}
