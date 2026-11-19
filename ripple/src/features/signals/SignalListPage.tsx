import { Compass, Plus, Search, Users } from "lucide-react";
import type { FormEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useCommunities, useSignals } from "../../api/queries";
import type { Signal } from "../../api/types";
import { CopyButton } from "../../components/CopyButton";
import {
  Badge,
  Button,
  buttonClass,
  EmptyState,
  ErrorState,
  inputClass,
  PageHeader,
  SkeletonRows,
  StatusBadge,
  cx,
} from "../../components/ui";
import { timeAgo } from "../../lib/format";

const selectClass =
  "h-10 rounded-lg border border-line bg-surface px-2.5 text-sm text-ink transition-colors focus:border-teal focus:ring-2 focus:ring-teal/15 focus:outline-none";

export function SignalListPage() {
  const { communityId: communityParam } = useParams();
  const communityId = Number(communityParam);
  const [searchParams, setSearchParams] = useSearchParams();
  const communities = useCommunities();

  const community = communities.data?.find((item) => item.id === communityId);

  const sort = searchParams.get("sort") === "priority" ? "priority" : "recent";
  const pageNumber = Number(searchParams.get("page") ?? "1");
  const page =
    Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  const filters = {
    status: searchParams.get("status") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    zone: searchParams.get("zone") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    sort,
    page,
  } as const;

  const signals = useSignals(communityId, filters);

  const hasFilters = ["status", "category", "zone", "q"].some((key) =>
    searchParams.get(key),
  );

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setSearchParams(next, { replace: true });
  }

  function applyTextFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = new URLSearchParams(searchParams);

    for (const key of ["q", "category", "zone"] as const) {
      const value = String(data.get(key) ?? "").trim();
      if (value) next.set(key, value);
      else next.delete(key);
    }

    next.delete("page");
    setSearchParams(next, { replace: true });
  }

  function clearFilters() {
    setSearchParams(new URLSearchParams(), { replace: true });
  }

  if (
    !communities.isPending &&
    communities.data &&
    !community
  ) {
    return (
      <EmptyState
        icon={Compass}
        title="Community not found"
        description="It may have been removed, or you are not a member of it."
        action={
          <Link to="/" className={buttonClass("primary")}>
            Back to your communities
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          community
            ? `Community · ${community.role === "moderator" ? "moderator" : "member"}`
            : "Community"
        }
        title={community?.name ?? "Signals"}
        description="Small recurring problems reported by the group. Confirm what you have seen too."
        actions={
          community && (
            <>
              <span className="hidden items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-1.5 font-mono text-[11px] tracking-[0.04em] text-ink-faint md:flex">
                Invite
                <code className="tracking-[0.08em] text-ink-soft">
                  {community.invite_code}
                </code>
                <CopyButton
                  value={community.invite_code}
                  label="invite code"
                />
              </span>
              <Link
                to={`/c/${communityId}/new`}
                className={buttonClass("primary")}
              >
                <Plus aria-hidden className="size-4" />
                New signal
              </Link>
            </>
          )
        }
      />

      <div className="rounded-panel border border-line bg-surface p-3">
        <form
          onSubmit={applyTextFilters}
          className="flex flex-wrap items-center gap-2"
        >
          <div className="relative min-w-52 flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint"
            />
            <input
              key={`q-${filters.q ?? ""}`}
              name="q"
              defaultValue={filters.q}
              placeholder="Search title or description"
              aria-label="Search signals"
              className={`${inputClass} pl-9`}
            />
          </div>

          <select
            aria-label="Filter by status"
            value={filters.status ?? ""}
            onChange={(event) => setParam("status", event.target.value)}
            className={selectClass}
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            aria-label="Sort signals"
            value={sort}
            onChange={(event) => setParam("sort", event.target.value)}
            className={selectClass}
          >
            <option value="recent">Newest</option>
            <option value="priority">Priority</option>
          </select>

          <input
            key={`category-${filters.category ?? ""}`}
            name="category"
            defaultValue={filters.category}
            placeholder="Category"
            aria-label="Filter by category"
            className={`${inputClass} sm:w-32`}
          />

          <input
            key={`zone-${filters.zone ?? ""}`}
            name="zone"
            defaultValue={filters.zone}
            placeholder="Zone"
            aria-label="Filter by zone"
            className={`${inputClass} sm:w-28`}
          />

          <Button type="submit" variant="secondary">
            Apply
          </Button>

          {hasFilters && (
            <Button variant="ghost" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </form>
      </div>

      {signals.isError ? (
        <ErrorState
          error={signals.error}
          onRetry={() => void signals.refetch()}
        />
      ) : signals.isPending ? (
        <div className="overflow-hidden rounded-panel border border-line bg-surface">
          <SkeletonRows rows={6} />
        </div>
      ) : signals.data.data.length === 0 ? (
        <EmptyState
          icon={hasFilters ? Search : Compass}
          title={hasFilters ? "No signals match" : "No signals yet"}
          description={
            hasFilters
              ? "Try a broader search, or clear the filters to see everything."
              : "Report the first small problem so the group has something to confirm."
          }
          action={
            hasFilters ? (
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <Link
                to={`/c/${communityId}/new`}
                className={buttonClass("primary")}
              >
                <Plus aria-hidden className="size-4" />
                Report a signal
              </Link>
            )
          }
        />
      ) : (
        <section className="overflow-hidden rounded-panel border border-line bg-surface">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
            <span className="font-mono text-[11px] tracking-[0.04em] text-ink-faint">
              Signal log
            </span>
            <span className="text-xs text-ink-soft">
              {signals.data.meta.total} signals
            </span>
          </div>

          <div className="hidden items-center gap-3 border-b border-line px-4 py-2 font-mono text-[11px] tracking-[0.04em] text-ink-faint sm:flex">
            <span className="w-10 text-center">Pri</span>
            <span className="flex-1">Signal</span>
            <span className="w-32 text-right">State</span>
          </div>

          <div className="divide-y divide-line">
            {signals.data.data.map((signal) => (
              <SignalRow
                key={signal.id}
                signal={signal}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
            <p className="text-xs text-ink-soft">
              Page {signals.data.meta.current_page} of{" "}
              {signals.data.meta.last_page}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setParam("page", String(page - 1))}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={page >= signals.data.meta.last_page}
                onClick={() => setParam("page", String(page + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function SignalRow({ signal }: { signal: Signal }) {
  const confirmations = signal.confirmations_count ?? 0;
  const corroborated = confirmations >= 2;

  return (
    <Link
      to={`/s/${signal.id}`}
      className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-teal-wash/30"
    >
      <div
        className="hidden w-10 shrink-0 flex-col items-center sm:flex"
        title={
          signal.priority === null
            ? "Priority is computed after analysis"
            : `Priority ${signal.priority} of 100`
        }
      >
        <span
          className={cx(
            "font-mono text-lg leading-none tabular-nums",
            signal.priority === null ? "text-line-strong" : "text-ink",
          )}
        >
          {signal.priority ?? "—"}
        </span>
        <span className="mt-1 font-mono text-[11px] tracking-[0.04em] text-ink-faint">
          pri
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-[15px] font-medium text-ink">
            {signal.title}
          </h3>
          {corroborated && (
            <Badge tone="teal" icon={Users}>
              Corroborated
            </Badge>
          )}
        </div>

        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] text-ink-faint">
          <span>#{signal.id}</span>
          <span aria-hidden>·</span>
          <span>{signal.category}</span>
          <span aria-hidden>·</span>
          <span>{signal.zone}</span>
          {signal.author && (
            <>
              <span aria-hidden>·</span>
              <span>{signal.author.name}</span>
            </>
          )}
          <span aria-hidden>·</span>
          <time dateTime={signal.created_at}>{timeAgo(signal.created_at)}</time>
        </p>

        <div className="mt-2 flex items-center gap-3 sm:hidden">
          <StatusBadge status={signal.status} />
          <span className="inline-flex items-center gap-1 text-xs text-ink-soft">
            <Users aria-hidden className="size-3.5" />
            {confirmations} confirmations
          </span>
        </div>
      </div>

      <div className="hidden w-32 shrink-0 flex-col items-end gap-1.5 sm:flex">
        <StatusBadge status={signal.status} />
        <span className="inline-flex items-center gap-1 text-xs text-ink-soft">
          <Users aria-hidden className="size-3.5" />
          {confirmations}
          <span className="sr-only">confirmations</span>
        </span>
      </div>
    </Link>
  );
}
