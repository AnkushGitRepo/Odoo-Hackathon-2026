const STORAGE_KEY = "transitops_theme";

export type Theme = "light" | "dark";

function apply(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function setTheme(theme: Theme): void {
  localStorage.setItem(STORAGE_KEY, theme);
  apply(theme);
}

/** Call once on app boot (before first paint ideally) to avoid a flash. */
export function initTheme(): void {
  apply(getInitialTheme());
}
