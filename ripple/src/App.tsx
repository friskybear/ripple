import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createHashRouter } from "react-router-dom";
import { ApiError } from "./api/client";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { LoginPage } from "./features/auth/LoginPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { CommunitiesPage } from "./features/communities/CommunitiesPage";
import { SignalListPage } from "./features/signals/SignalListPage";
import { NewSignalPage } from "./features/signals/NewSignalPage";
import { SignalDetailPage } from "./features/signals/SignalDetailPage";
import { NotFoundPage } from "./features/NotFoundPage";

const router = createHashRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <CommunitiesPage /> },
      { path: "c/:communityId", element: <SignalListPage /> },
      { path: "c/:communityId/new", element: <NewSignalPage /> },
      { path: "s/:signalId", element: <SignalDetailPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
function x(count: number): number {
  return count + 1;
}
interface AppProps {
  initialCount?: number;
}

export default function App(props: AppProps) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) =>
              !(error instanceof ApiError && error.status < 500) &&
              failureCount < 1,
          },
          mutations: { retry: false },
        },
      }),
  );

  useEffect(() => {
    const onUnauthorized = () => client.setQueryData(["me"], null);
    window.addEventListener("ripple:unauthorized", onUnauthorized);
    return () =>
      window.removeEventListener("ripple:unauthorized", onUnauthorized);
  }, [client]);

  return (
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
      <div onClick={() => setCount(2)}></div>
      <div>{count}</div>
    </QueryClientProvider>
  );
}
