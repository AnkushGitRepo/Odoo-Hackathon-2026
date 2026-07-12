import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { ErrorBanner, Field, SubmitButton, TextInput } from "./fields";
import { useAuth } from "../../lib/auth";
import type { ApiError } from "../../lib/api";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, type Role } from "../../lib/types";

const ROLE_OPTIONS = Object.keys(ROLE_LABELS) as Role[];

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("DISPATCHER");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      await signup({ name, email, password, role });
      navigate("/dashboard");
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-3xl font-extrabold tracking-tight">Get started now</h1>
      <p className="mt-2 text-sm text-ink-500">
        Create your account and pick the role that matches your job.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5" noValidate>
        {error && <ErrorBanner message={error} />}

        <Field label="Name" htmlFor="name">
          <TextInput
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>

        <Field label="Email" htmlFor="email">
          <TextInput
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>

        <Field label="Password" htmlFor="password">
          <TextInput
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Minimum 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>

        <Field label="Role" htmlFor="role">
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="w-full rounded-xl border border-mist-300 bg-white px-4 py-2.5 text-sm text-ink-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {ROLE_LABELS[option]}
              </option>
            ))}
          </select>
          <p className="text-xs text-ink-500">{ROLE_DESCRIPTIONS[role]}.</p>
        </Field>

        <SubmitButton busy={busy}>Create account</SubmitButton>
      </form>

      <p className="mt-6 text-sm text-ink-500">
        Have an account?{" "}
        <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
