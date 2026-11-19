import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../../api/client";
import {
  useCommunities,
  useCreateSignal,
} from "../../api/queries";
import {
  Button,
  buttonClass,
  cx,
  ErrorBanner,
  Field,
  inputClass,
  invalidInputClass,
  PageHeader,
  Panel,
} from "../../components/ui";
import { applyServerErrors } from "../../lib/server-errors";
import { signalSchema, type SignalValues } from "../../lib/validation";

const impacts = [
  { value: "1", label: "Minor", hint: "Annoying, but there is a workaround." },
  { value: "2", label: "Low", hint: "Slows people down a little." },
  { value: "3", label: "Noticeable", hint: "Disrupts regular work." },
  { value: "4", label: "Disruptive", hint: "Blocks some tasks." },
  { value: "5", label: "Blocking", hint: "Stops work completely." },
] as const;

const categories = [
  "network",
  "facilities",
  "safety",
  "accessibility",
  "equipment",
];

const zones = ["lab-1", "lab-2", "library", "north-wing", "cafeteria"];

export function NewSignalPage() {
  const { communityId: communityParam } = useParams();
  const communityId = Number(communityParam);
  const communities = useCommunities();
  const community = communities.data?.find((item) => item.id === communityId);
  const create = useCreateSignal(communityId);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<SignalValues>({
    resolver: zodResolver(signalSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      zone: "",
      impact: "3",
    },
  });

  const title = watch("title");
  const selectedImpact = impacts.find(
    (item) => item.value === watch("impact"),
  );

  const onSubmit = handleSubmit(async (values) => {
    try {
      const signal = await create.mutateAsync({
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category.trim(),
        zone: values.zone.trim(),
        impact: Number(values.impact),
      });
      navigate(`/s/${signal.id}`, { replace: true });
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
    <div className="space-y-5">
      <Link
        to={`/c/${communityId}`}
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeft aria-hidden className="size-4" />
        {community?.name ?? "Back to signals"}
      </Link>

      <PageHeader
        eyebrow="New signal"
        title="Report what you observed"
        description="Be specific. A zone and a clear description make it easier for others to confirm the same pattern."
      />

      <Panel className="max-w-2xl">
        <form onSubmit={onSubmit} noValidate className="space-y-5 p-5 sm:p-6">
          {showBanner && <ErrorBanner error={create.error} />}

          <Field
            label="Title"
            htmlFor="title"
            error={errors.title?.message}
            aside={
              <span className="font-mono text-[11px] text-ink-faint tabular-nums">
                {(title ?? "").length}/120
              </span>
            }
          >
            <input
              id="title"
              placeholder="Wi-Fi drops in room 204 every afternoon"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "title-error" : undefined}
              className={cx(inputClass, errors.title && invalidInputClass)}
              {...register("title")}
            />
          </Field>

          <Field
            label="What happens?"
            htmlFor="description"
            error={errors.description?.message}
            hint="When, how often, and what you have already tried."
          >
            <textarea
              id="description"
              rows={6}
              placeholder="Around 15:00 the access point disappears for a few minutes. It comes back on its own."
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description
                  ? "description-error"
                  : "description-hint"
              }
              className={cx(
                inputClass,
                "resize-y leading-relaxed",
                errors.description && invalidInputClass,
              )}
              {...register("description")}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Category"
              htmlFor="category"
              error={errors.category?.message}
              hint="Pick an existing one or type a new one."
            >
              <input
                id="category"
                list="signal-categories"
                placeholder="network"
                aria-invalid={Boolean(errors.category)}
                aria-describedby={
                  errors.category ? "category-error" : "category-hint"
                }
                className={cx(
                  inputClass,
                  errors.category && invalidInputClass,
                )}
                {...register("category")}
              />
              <datalist id="signal-categories">
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </Field>

            <Field
              label="Zone"
              htmlFor="zone"
              error={errors.zone?.message}
              hint="The room, floor, or area."
            >
              <input
                id="zone"
                list="signal-zones"
                placeholder="lab-2"
                aria-invalid={Boolean(errors.zone)}
                aria-describedby={errors.zone ? "zone-error" : "zone-hint"}
                className={cx(inputClass, errors.zone && invalidInputClass)}
                {...register("zone")}
              />
              <datalist id="signal-zones">
                {zones.map((zone) => (
                  <option key={zone} value={zone} />
                ))}
              </datalist>
            </Field>
          </div>

          <fieldset>
            <legend className="text-[13px] font-medium text-ink">
              Impact
            </legend>
            <p className="mt-0.5 text-xs text-ink-soft">
              How much does it get in the way?
            </p>

            <div className="mt-2 grid grid-cols-5 gap-1.5">
              {impacts.map((impact) => (
                <label key={impact.value} className="cursor-pointer">
                  <input
                    type="radio"
                    value={impact.value}
                    className="peer sr-only"
                    {...register("impact")}
                  />
                  <span className="flex h-16 flex-col items-center justify-center rounded-lg border border-line bg-surface transition-colors peer-checked:border-teal peer-checked:bg-teal-wash peer-checked:text-teal-dark peer-focus-visible:ring-2 peer-focus-visible:ring-teal/30 peer-focus-visible:ring-offset-1 hover:border-line-strong">
                    <span className="font-mono text-base leading-none tabular-nums">
                      {impact.value}
                    </span>
                    <span className="mt-1 text-[11px] text-ink-soft">
                      {impact.label}
                    </span>
                  </span>
                </label>
              ))}
            </div>

            {selectedImpact && (
              <p className="mt-2 text-xs text-ink-soft">
                {selectedImpact.value} · {selectedImpact.hint}
              </p>
            )}
            {errors.impact?.message && (
              <p role="alert" className="mt-1 text-xs font-medium text-flare">
                {errors.impact.message}
              </p>
            )}
          </fieldset>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
            <Link
              to={`/c/${communityId}`}
              className={buttonClass("ghost")}
            >
              Cancel
            </Link>
            <Button
              type="submit"
              variant="primary"
              loading={create.isPending}
            >
              Post signal
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
