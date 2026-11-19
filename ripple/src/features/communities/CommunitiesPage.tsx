import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Building2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../../api/client";
import {
  useCommunities,
  useCreateCommunity,
  useJoinCommunity,
} from "../../api/queries";
import {
  Badge,
  Button,
  ErrorBanner,
  ErrorState,
  Field,
  inputClass,
  PageHeader,
  Panel,
  PanelHeader,
  SkeletonRows,
} from "../../components/ui";
import { CopyButton } from "../../components/CopyButton";
import { initials } from "../../lib/format";
import { applyServerErrors } from "../../lib/server-errors";
import {
  communitySchema,
  joinSchema,
  type CommunityValues,
  type JoinValues,
} from "../../lib/validation";

export function CommunitiesPage() {
  const communities = useCommunities();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Your communities"
        description="Signals live inside a community. Create one for your lab, floor, or team — or join with an invite code."
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_336px]">
        <section>
          {communities.isPending && (
            <div className="rounded-panel border border-line bg-surface">
              <SkeletonRows rows={3} />
            </div>
          )}

          {communities.isError && (
            <ErrorState
              error={communities.error}
              onRetry={() => void communities.refetch()}
            />
          )}

          {communities.data?.length === 0 && (
            <div className="rounded-panel border border-line bg-surface px-6 py-14 text-center">
              <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-teal-wash text-teal">
                <Building2 aria-hidden className="size-5" />
              </span>
              <h2 className="mt-3 text-base font-semibold">
                No communities yet
              </h2>
              <p className="mx-auto mt-1 max-w-xs text-sm text-ink-soft">
                Create one, or ask a moderator for the invite code.
              </p>
            </div>
          )}

          {communities.data && communities.data.length > 0 && (
            <div className="divide-y divide-line overflow-hidden rounded-panel border border-line bg-surface">
              {communities.data.map((community) => (
                <div
                  key={community.id}
                  className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-teal-wash/30 sm:px-5"
                >
                  <span className="hidden size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-paper font-mono text-[11px] text-ink-soft sm:flex">
                    {initials(community.name)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/c/${community.id}`}
                        className="truncate font-medium text-ink underline-offset-4 hover:underline"
                      >
                        {community.name}
                      </Link>
                      {community.role === "moderator" && (
                        <Badge tone="teal">Moderator</Badge>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 font-mono text-[11px] text-ink-faint">
                      <span className="tracking-[0.04em]">Invite</span>
                      <code className="rounded bg-paper px-1.5 py-0.5 tracking-[0.08em] text-ink-soft">
                        {community.invite_code}
                      </code>
                      <CopyButton
                        value={community.invite_code}
                        label={`${community.name} invite code`}
                      />
                    </div>
                  </div>

                  <Link
                    to={`/c/${community.id}`}
                    aria-label={`Open ${community.name}`}
                    className="flex size-9 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-surface hover:text-teal"
                  >
                    <ArrowRight aria-hidden className="size-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        <AddCommunityPanel />
      </div>
    </div>
  );
}

function AddCommunityPanel() {
  return (
    <Panel>
      <PanelHeader title="Add a community" />
      <div className="space-y-6 p-5">
        <CreateCommunityForm />
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="font-mono text-[11px] tracking-[0.04em] text-ink-faint">
            or join
          </span>
          <span className="h-px flex-1 bg-line" />
        </div>
        <JoinCommunityForm />
      </div>
    </Panel>
  );
}

function CreateCommunityForm() {
  const create = useCreateCommunity();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CommunityValues>({
    resolver: zodResolver(communitySchema),
    defaultValues: { name: "" },
  });

  const onSubmit = handleSubmit(async ({ name }) => {
    try {
      const community = await create.mutateAsync(name.trim());
      reset();
      navigate(`/c/${community.id}`);
    } catch (error) {
      applyServerErrors(error, setError);
    }
  });

  const showBanner =
    create.isError &&
    !(
      create.error instanceof ApiError &&
      Object.keys(create.error.errors).length > 0
    );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-3">
      {showBanner && <ErrorBanner error={create.error} />}
      <Field
        label="New community"
        htmlFor="community-name"
        error={errors.name?.message}
      >
        <input
          id="community-name"
          placeholder="North Campus Lab"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "community-name-error" : undefined}
          className={inputClass}
          {...register("name")}
        />
      </Field>
      <Button
        type="submit"
        variant="primary"
        loading={create.isPending}
        className="w-full"
      >
        Create community
      </Button>
      <p className="text-xs leading-relaxed text-ink-soft">
        You become its first moderator.
      </p>
    </form>
  );
}

function JoinCommunityForm() {
  const join = useJoinCommunity();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<JoinValues>({
    resolver: zodResolver(joinSchema),
    defaultValues: { invite_code: "" },
  });

  const onSubmit = handleSubmit(async ({ invite_code }) => {
    try {
      const community = await join.mutateAsync(invite_code.trim());
      reset();
      navigate(`/c/${community.id}`);
    } catch (error) {
      applyServerErrors(error, setError);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-3">
      <Field
        label="Invite code"
        htmlFor="invite-code"
        error={errors.invite_code?.message}
        hint="Paste it exactly as it was shared."
      >
        <input
          id="invite-code"
          placeholder="LAB-4F2K"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={Boolean(errors.invite_code)}
          aria-describedby={
            errors.invite_code ? "invite-code-error" : "invite-code-hint"
          }
          className={`${inputClass} font-mono tracking-[0.08em] placeholder:text-ink-faint`}
          {...register("invite_code")}
        />
      </Field>
      <Button
        type="submit"
        variant="secondary"
        loading={join.isPending}
        className="w-full"
      >
        Join community
      </Button>
    </form>
  );
}
