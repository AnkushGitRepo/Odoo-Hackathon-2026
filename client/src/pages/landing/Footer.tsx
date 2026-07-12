import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-ink-900/10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-ink-500 sm:flex-row sm:px-6">
        <p className="font-semibold text-ink-700">TransitOps © 2026</p>
        <div className="flex items-center gap-6">
          <Link to="/signup" className="transition-colors hover:text-ink-900">
            Get Started
          </Link>
          <a
            href="https://github.com/AnkushGitRepo/Odoo-Hackathon-2026"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-ink-900"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
