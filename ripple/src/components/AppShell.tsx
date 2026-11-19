import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Plus } from "lucide-react";
import { Wordmark } from "./Logo";
import { cx } from "./ui";
import { useCommunities, useLogout, useMe } from "../api/queries";

export function AppShell() {
  const me = useMe().data;
  const communities = useCommunities();
  const logout = useLogout();
  const location = useLocation();
  const navigate = useNavigate();

  const activeId = Number(
    location.pathname.match(/^\/c\/(\d+)/)?.[1] ?? Number.NaN,
  );

  const list = communities.data ?? [];

  return (
    <div className="flex min-h-screen flex-col md:h-screen md:flex-row md:overflow-hidden">
      <button
        type="button"
        onClick={() => document.getElementById("main")?.focus()}
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-ink focus:ring-2 focus:ring-teal"
      >
        Skip to content
      </button>

      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-paper px-4 py-6 md:flex">
        <Link
          to="/"
          aria-label="Ripple home"
          className="w-fit rounded-md px-2"
        >
          <Wordmark />
        </Link>

        <div className="mt-8 flex items-center justify-between px-2">
          <span className="font-mono text-[11px] tracking-[0.04em] text-ink-faint">
            Communities
          </span>
          <Link
            to="/"
            className="flex size-6 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-ink/5 hover:text-ink"
            aria-label="Create or join a community"
          >
            <Plus aria-hidden className="size-4" />
          </Link>
        </div>

        <nav aria-label="Communities" className="mt-2 space-y-0.5">
          {communities.isPending && (
            <p className="px-2 py-1.5 text-xs text-ink-faint">Loading…</p>
          )}

          {communities.isError && (
            <p className="px-2 py-1.5 text-xs text-ink-soft">
              Could not load communities.
            </p>
          )}

          {!communities.isPending && list.length === 0 && (
            <Link
              to="/"
              className="block rounded-lg px-2 py-1.5 text-sm text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
            >
              Create or join one
            </Link>
          )}

          {list.map((community) => {
            const active = community.id === activeId;
            return (
              <Link
                key={community.id}
                to={`/c/${community.id}`}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "group flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors",
                  active
                    ? "bg-surface font-medium text-ink shadow-[inset_0_0_0_1px_var(--color-line)]"
                    : "text-ink-soft hover:bg-ink/5 hover:text-ink",
                )}
              >
                <span
                  aria-hidden
                  className={cx(
                    "size-1.5 shrink-0 rounded-full",
                    active ? "bg-teal" : "bg-line-strong group-hover:bg-ink-faint",
                  )}
                />
                <span className="truncate">{community.name}</span>
                {community.role === "moderator" && (
                  <span className="ml-auto font-mono text-[11px] tracking-[0.04em] text-teal-dark">
                    Mod
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-line pt-4">
          <p className="truncate px-2 text-sm font-medium text-ink">
            {me?.name}
          </p>
          <button
            type="button"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="mt-2 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-50"
          >
            <LogOut aria-hidden className="size-4" />
            {logout.isPending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-paper px-4 py-3 md:hidden">
        <Link to="/" aria-label="Ripple home">
          <Wordmark subtitle={false} />
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <select
            aria-label="Go to community"
            value={Number.isFinite(activeId) ? String(activeId) : ""}
            onChange={(event) =>
              navigate(
                event.target.value ? `/c/${event.target.value}` : "/",
              )
            }
            className="h-9 max-w-40 rounded-lg border border-line bg-surface px-2 text-sm text-ink"
          >
            <option value="">Communities</option>
            {list.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => logout.mutate()}
            aria-label="Sign out"
            className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <LogOut aria-hidden className="size-4" />
          </button>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex-1 md:overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
