import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Fuel,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Route as RouteIcon,
  Settings,
  Sun,
  Truck,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { can, type Module } from "../lib/rbac";
import { ROLE_LABELS } from "../lib/types";
import { useTheme } from "../lib/useTheme";

const NAV_ITEMS: Array<{
  module: Module;
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { module: "dashboard", to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { module: "fleet", to: "/fleet", label: "Fleet", icon: Truck },
  { module: "drivers", to: "/drivers", label: "Drivers", icon: Users },
  { module: "trips", to: "/trips", label: "Trips", icon: RouteIcon },
  { module: "maintenance", to: "/maintenance", label: "Maintenance", icon: Wrench },
  { module: "expenses", to: "/expenses", label: "Fuel & Expenses", icon: Fuel },
  { module: "analytics", to: "/analytics", label: "Analytics", icon: BarChart3 },
  { module: "settings", to: "/settings", label: "Settings", icon: Settings },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  if (!user) return null;

  const items = NAV_ITEMS.filter((item) => can(user.role, item.module) !== null);

  return (
    <nav className="flex flex-col gap-1 px-3">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-indigo-600 text-white"
                : "text-ink-500 hover:bg-mist-100 hover:text-ink-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            }`
          }
        >
          <Icon className="size-4.5" strokeWidth={1.75} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex h-16 items-center gap-2 px-6 text-lg font-bold tracking-tight text-ink-900 dark:text-slate-100">
      <span className="grid size-8 place-items-center rounded-lg bg-ink-900 text-white dark:bg-indigo-600">
        <Truck className="size-4.5" strokeWidth={2} />
      </span>
      TransitOps
    </div>
  );
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [theme, toggleTheme] = useTheme();

  if (!user) return null;

  const initials = user.name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-[100dvh] bg-mist-100 font-sans text-ink-900 antialiased dark:bg-slate-950 dark:text-slate-100">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-[100dvh] w-60 shrink-0 flex-col border-r border-ink-900/10 bg-white lg:flex dark:border-white/10 dark:bg-slate-900">
        <Brand />
        <div className="flex-1 overflow-y-auto py-2">
          <SidebarNav />
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-ink-900/40"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between pr-4">
              <Brand />
              <button
                type="button"
                aria-label="Close menu"
                className="rounded-lg p-2 text-ink-500 hover:bg-mist-100 dark:text-slate-400 dark:hover:bg-slate-800"
                onClick={() => setDrawerOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              <SidebarNav onNavigate={() => setDrawerOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-ink-900/10 bg-white/80 px-4 backdrop-blur-md sm:px-6 dark:border-white/10 dark:bg-slate-900/80">
          <button
            type="button"
            aria-label="Open menu"
            className="rounded-lg p-2 text-ink-500 hover:bg-mist-100 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="size-5" />
          </button>

          <div className="flex flex-1 items-center justify-end gap-2 sm:gap-4">
            <button
              type="button"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              onClick={toggleTheme}
              className="rounded-xl p-2.5 text-ink-500 transition-colors hover:bg-mist-100 hover:text-ink-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              {theme === "dark" ? (
                <Sun className="size-4.5" strokeWidth={1.75} />
              ) : (
                <Moon className="size-4.5" strokeWidth={1.75} />
              )}
            </button>
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                {initials}
              </span>
              <div className="hidden text-right sm:block">
                <p className="text-sm leading-tight font-semibold">{user.name}</p>
                <p className="text-xs leading-tight text-ink-500 dark:text-slate-400">
                  {ROLE_LABELS[user.role]}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-ink-500 transition-colors hover:bg-mist-100 hover:text-ink-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <LogOut className="size-4" strokeWidth={1.75} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
