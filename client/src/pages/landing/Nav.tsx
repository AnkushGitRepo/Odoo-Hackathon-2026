import { Link } from "react-router-dom";
import { Truck } from "lucide-react";

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 bg-mist-200/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="grid size-8 place-items-center rounded-lg bg-ink-900 text-white">
            <Truck className="size-4.5" strokeWidth={2} />
          </span>
          TransitOps
        </Link>

        <div className="hidden items-center gap-8 text-sm font-medium text-ink-500 md:flex">
          <a href="#features" className="transition-colors hover:text-ink-900">
            Features
          </a>
          <a href="#roles" className="transition-colors hover:text-ink-900">
            Roles
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden rounded-full px-4 py-2 text-sm font-semibold text-ink-700 transition-colors hover:text-ink-900 sm:block"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:bg-ink-700 active:scale-[0.98]"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  );
}
