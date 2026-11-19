import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useMe } from "../api/queries";
import { ErrorState, Spinner } from "../components/ui";
import { Wordmark } from "../components/Logo";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const me = useMe();
  const location = useLocation();

  if (me.isPending) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5">
        <Wordmark />
        <Spinner label="Opening your workspace" />
      </div>
    );
  }

  if (me.isError) {
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <ErrorState
          error={me.error}
          onRetry={() => void me.refetch()}
          className="w-full max-w-md"
        />
      </div>
    );
  }

  if (!me.data) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return children;
}
