import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function ProtectedRoute() {
  const { user, restoring } = useAuth();

  if (restoring) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-mist-100">
        <div className="h-8 w-40 animate-pulse rounded-full bg-mist-300" aria-label="Loading" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
