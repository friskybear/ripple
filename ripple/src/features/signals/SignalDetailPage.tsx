import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Check,
  Clock,
  MapPin,
  MessageSquare,
  Tag,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "../../api/client";
import {
  useAddComment,
  useComments,
  useCommunities,
  useConfirmSignal,
  useMe,
  useSignal,
  useTransitionSignal,
} from "../../api/queries";
import type { Signal } from "../../api/types";
import {
  Badge,
  Button,
  ErrorBanner,
  ErrorState,
  Field,
  ImpactMeter,
  inputClass,
  Modal,
  Panel,
  PanelHeader,
  SkeletonRows,
  StatusBadge,
} from "../../components/ui";
import { fullDate, initials, timeAgo } from "../../lib/format";
import { applyServerErrors } from "../../lib/server-errors";
import {
  commentSchema,
  type CommentValues,
} from "../../lib/validation";

export function SignalDetailPage() {
  const { signalId: signalParam } = useParams();
  const signalId = Number(signalParam);
  const signalQuery = useSignal(signalId);
  const communities = useCommunities();
  const me = useMe().data;

  if (signalQuery.isPending) {
    return (
      <div className="space-y-6">
        <SkeletonRows rows={2} />
        <div className="rounded-panel border border-line bg-surface">
          <SkeletonRows rows={3} />
        </div>
      </div>
    );
  }

  if (signalQuery.isError) {
    return (
      <div className="space-y-5">
        <BackLink />
        <ErrorState
          error={signalQuery.error}
          onRetry={() => void signalQuery.refetch()}
        />
      </div>
    );
  }

  const signal = signalQuery.data;
  const community = communities.data?.find(
    (item) => item.id === signal.community_id,
  );
  const isModerator = community?.role === "moderator";
  const confirmations = signal.confirmations_count ?? 0;
  const corroborated = confirmations >= 2;

  return (
    <div className="space-y-6">
      <BackLink
        communityId={signal.community_id}
        communityName={community?.name}
      />

      <header className="space-y-4 border-b border-line pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={signal.status} />
          {corroborated && (
            <Badge tone="teal" icon={Users}>
              Corroborated
            </Badge>
          )}
          <span className="font-mono text-[11px] tracking-[0.04em] text-ink-faint">
            Signal #{signal.id}
          </span>
        </div>

        <h1 className="max-w-3xl text-[26px] leading-tight font-semibold tracking-tight text-balance text-ink sm:text-3xl">
          {signal.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-soft">
          <span>
            Reported by{" "}
            <span className="font-medium text-ink">
              {signal.author?.name ?? "a member"}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock aria-hidden className="size-3.5 text-ink-faint" />
            <time
              dateTime={signal.created_at}
              title={fullDate(signal.created_at)}
            >
              {timeAgo(signal.created_at)}
            </time>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Tag aria-hidden className="size-3.5 text-ink-faint" />
            {signal.category}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin aria-hidden className="size-3.5 text-ink-faint" />
            {signal.zone}
          </span>
          <ImpactMeter value={signal.impact} />
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="order-1">
          <Panel>
            <div className="p-5 sm:p-6">
              <p className="text-[15px] leading-7 whitespace-pre-wrap text-ink">
                {signal.description}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
              <span className="inline-flex items-center gap-2 text-sm text-ink-soft">
                <Users aria-hidden className="size-4 text-ink-faint" />
                <span className="font-medium text-ink tabular-nums">
                  {confirmations}
                </span>
                {confirmations === 1 ? "confirmation" : "confirmations"}
              </span>
              <ConfirmButton
                signal={signal}
                isAuthor={signal.author?.id === me?.id}
              />
            </div>
            {signal.confirmed_by_me && (
              <p className="border-t border-line px-5 py-3 text-xs text-ink-soft">
                You confirmed this signal. Confirmations from other members
                make it visible as a pattern.
              </p>
            )}
          </Panel>
        </div>

        <aside className="order-2 space-y-4 lg:col-start-2 lg:row-start-1">
          <StatusPanel
            signal={signal}
            isModerator={isModerator}
            memberRole={community?.role}
          />
          <AnalysisPanel signal={signal} />
        </aside>

        <div className="order-3 lg:col-start-1 lg:row-start-2">
          <CommentsSection signalId={signal.id} />
        </div>
      </div>
    </div>
  );
}

function BackLink({
  communityId,
  communityName,
}: {
  communityId?: number;
  communityName?: string;
}) {
  return (
    <Link
      to={communityId ? `/c/${communityId}` : "/"}
      className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
    >
      <ArrowLeft aria-hidden className="size-4" />
      {communityName ?? "Back to signals"}
    </Link>
  );
}

function ConfirmButton({
  signal,
  isAuthor,
}: {
  signal: Signal;
  isAuthor: boolean;
}) {
  const confirm = useConfirmSignal(signal.id);

  if (isAuthor) {
    return (
      <div className="text-right">
        <Button variant="secondary" disabled>
          <Check aria-hidden className="size-4" />
          Your own report
        </Button>
        <p className="mt-1 text-[11px] text-ink-faint">
          Authors cannot confirm their own signal.
        </p>
      </div>
    );
  }

  return (
    <div className="ml-auto flex flex-col items-end gap-1">
      <Button
        variant={signal.confirmed_by_me ? "secondary" : "primary"}
        loading={confirm.isPending}
        onClick={() => confirm.mutate(signal.confirmed_by_me)}
      >
        <Check aria-hidden className="size-4" />
        {signal.confirmed_by_me ? "You confirmed this" : "Me too"}
      </Button>
      {confirm.isError && <ErrorBanner error={confirm.error} />}
    </div>
  );
}

function StatusPanel({
  signal,
  isModerator,
  memberRole,
}: {
  signal: Signal;
  isModerator: boolean;
  memberRole?: "member" | "moderator";
}) {
  const transition = useTransitionSignal(signal.id);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string>();

  const next =
    signal.status === "open"
      ? "investigating"
      : signal.status === "investigating"
        ? "resolved"
        : "open";

  function closeResolve() {
    setResolveOpen(false);
    setNoteError(undefined);
  }

  function resolve() {
    const trimmed = note.trim();
    if (!trimmed) {
      setNoteError("Add a short note explaining what resolved it.");
      return;
    }
    transition.mutate(
      { to: "resolved", note: trimmed },
      {
        onSuccess: () => {
          setResolveOpen(false);
          setNote("");
          setNoteError(undefined);
        },
      },
    );
  }

  return (
    <Panel>
      <PanelHeader title="Status" aside={<StatusBadge status={signal.status} />} />
      <div className="space-y-3 p-5">
        {signal.status === "resolved" && signal.resolution_note && (
          <div className="rounded-lg border border-done/20 bg-done-wash/60 p-3">
            <p className="font-mono text-[11px] tracking-[0.04em] text-done">
              Resolution
            </p>
            <p className="mt-1 text-sm leading-relaxed text-ink">
              {signal.resolution_note}
            </p>
            {signal.resolved_at && (
              <p className="mt-1 text-[11px] text-ink-soft">
                {timeAgo(signal.resolved_at)}
              </p>
            )}
          </div>
        )}

        {isModerator ? (
          <>
            <p className="text-xs leading-relaxed text-ink-soft">
              You moderate this community. Move the signal when the group has
              seen enough.
            </p>

            {next === "investigating" && (
              <Button
                variant="primary"
                className="w-full"
                loading={transition.isPending}
                onClick={() => transition.mutate({ to: "investigating" })}
              >
                Start investigating
              </Button>
            )}

            {next === "resolved" && (
              <Button
                variant="primary"
                className="w-full"
                onClick={() => {
                  transition.reset();
                  setResolveOpen(true);
                }}
              >
                Mark resolved
              </Button>
            )}

            {next === "open" && (
              <Button
                variant="secondary"
                className="w-full"
                loading={transition.isPending}
                onClick={() => transition.mutate({ to: "open" })}
              >
                Reopen signal
              </Button>
            )}

            {!resolveOpen && transition.isError && (
              <ErrorBanner error={transition.error} />
            )}
          </>
        ) : (
          <p className="text-xs leading-relaxed text-ink-soft">
            {memberRole === "member"
              ? "A community moderator moves this signal between open, investigating, and resolved."
              : "Only a moderator can move this signal between states."}
          </p>
        )}
      </div>

      <Modal
        open={resolveOpen}
        onClose={closeResolve}
        title="Mark as resolved"
        description="Say what changed, so the next person knows it is fixed."
        footer={
          <>
            <Button variant="ghost" onClick={closeResolve}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={transition.isPending}
              onClick={resolve}
            >
              Resolve signal
            </Button>
          </>
        }
      >
        <Field
          label="Resolution note"
          htmlFor="resolution-note"
          error={noteError}
        >
          <textarea
            id="resolution-note"
            rows={4}
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              setNoteError(undefined);
            }}
            placeholder="The access point was replaced on the 19th."
            aria-invalid={Boolean(noteError)}
            aria-describedby={
              noteError ? "resolution-note-error" : undefined
            }
            className={`${inputClass} resize-y leading-relaxed`}
          />
        </Field>
        {transition.isError && (
          <div className="mt-3">
            <ErrorBanner error={transition.error} />
          </div>
        )}
      </Modal>
    </Panel>
  );
}

function AnalysisPanel({ signal }: { signal: Signal }) {
  const pending = signal.analysis_status === "pending";
  const failed = signal.analysis_status === "failed";

  return (
    <Panel>
      <PanelHeader
        title="Analysis"
        aside={
          <Badge tone={failed ? "flare" : pending ? "neutral" : "teal"}>
            {failed ? "Unavailable" : pending ? "Queued" : "Ready"}
          </Badge>
        }
      />
      <div className="p-5">
        {pending && (
          <>
            <p className="flex items-center gap-2 text-sm text-ink">
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full bg-teal"
              />
              Queued for analysis
            </p>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">
              A priority score and possible duplicates appear here once the
              analyzer finishes. The signal is already saved.
            </p>
          </>
        )}

        {failed && (
          <>
            <p className="text-sm text-ink">Analysis unavailable</p>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">
              The signal was saved. The analyzer could not be reached, so
              priority and duplicates are missing for now.
            </p>
          </>
        )}

        {!pending && !failed && (
          <>
            <p className="font-mono text-3xl leading-none text-ink tabular-nums">
              {signal.priority ?? "—"}
              <span className="ml-1 text-sm text-ink-faint">/100</span>
            </p>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">
              Priority blends impact, confirmations, and recency. It is a
              starting point, not a verdict.
            </p>
          </>
        )}
      </div>
    </Panel>
  );
}

function CommentsSection({ signalId }: { signalId: number }) {
  const comments = useComments(signalId);
  const add = useAddComment(signalId);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CommentValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: { body: "" },
  });

  const items = comments.data?.pages.flatMap((page) => page.data) ?? [];
  const total = comments.data?.pages[0]?.meta.total ?? 0;

  const onSubmit = handleSubmit(async (values) => {
    try {
      await add.mutateAsync(values.body);
      reset();
    } catch (error) {
      applyServerErrors(error, setError);
    }
  });

  const showBanner =
    add.isError &&
    !(
      add.error instanceof ApiError &&
      Object.keys(add.error.errors).length > 0
    );

  return (
    <Panel>
      <PanelHeader
        title={`Comments${total ? ` · ${total}` : ""}`}
        aside={
          <MessageSquare aria-hidden className="size-3.5 text-ink-faint" />
        }
      />

      <div className="space-y-5 p-5 sm:p-6">
        <form onSubmit={onSubmit} noValidate>
          {showBanner && (
            <div className="mb-3">
              <ErrorBanner error={add.error} />
            </div>
          )}
          <label htmlFor="comment-body" className="sr-only">
            Add a comment
          </label>
          <textarea
            id="comment-body"
            rows={3}
            placeholder="Add context, or say where you saw it too…"
            aria-invalid={Boolean(errors.body)}
            aria-describedby={errors.body ? "comment-body-error" : undefined}
            className={`${inputClass} resize-y leading-relaxed`}
            {...register("body")}
          />
          {errors.body?.message && (
            <p
              id="comment-body-error"
              role="alert"
              className="mt-1 text-xs font-medium text-flare"
            >
              {errors.body.message}
            </p>
          )}
          <div className="mt-2 flex justify-end">
            <Button
              type="submit"
              variant="secondary"
              loading={add.isPending}
            >
              Add comment
            </Button>
          </div>
        </form>

        {comments.isPending ? (
          <p className="text-sm text-ink-soft">Loading comments…</p>
        ) : comments.isError ? (
          <ErrorBanner error={comments.error} />
        ) : items.length === 0 ? (
          <p className="border-t border-line pt-5 text-sm text-ink-soft">
            No comments yet. Add the first piece of context.
          </p>
        ) : (
          <ul className="space-y-5 border-t border-line pt-5">
            {items.map((comment) => (
              <li key={comment.id} className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-teal-wash font-mono text-[11px] font-medium text-teal-dark">
                  {initials(comment.user?.name ?? "?")}
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-ink-faint">
                    <span className="font-medium text-ink">
                      {comment.user?.name ?? "Member"}
                    </span>
                    <span aria-hidden> · </span>
                    <time
                      dateTime={comment.created_at}
                      title={fullDate(comment.created_at)}
                    >
                      {timeAgo(comment.created_at)}
                    </time>
                  </p>
                  <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-ink-soft">
                    {comment.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {comments.hasNextPage && (
          <div className="flex justify-center border-t border-line pt-4">
            <Button
              variant="ghost"
              size="sm"
              loading={comments.isFetchingNextPage}
              onClick={() => void comments.fetchNextPage()}
            >
              Load older comments
            </Button>
          </div>
        )}
      </div>
    </Panel>
  );
}
