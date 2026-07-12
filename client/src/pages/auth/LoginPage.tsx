import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { ErrorBanner, Field, SubmitButton, TextInput } from "./fields";
import { useAuth } from "../../lib/auth";
import type { ApiError } from "../../lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-3xl font-extrabold tracking-tight">Sign in to your account</h1>
      <p className="mt-2 text-sm text-ink-500">Enter your credentials to continue.</p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5" noValidate>
        {error && <ErrorBanner message={error} />}

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
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>

        <SubmitButton busy={busy}>Sign In</SubmitButton>
      </form>

      <p className="mt-6 text-sm text-ink-500">
        New here?{" "}
        <Link to="/signup" className="font-semibold text-indigo-600 hover:text-indigo-700">
          Get started
        </Link>
      </p>
    </AuthLayout>
  );
}
