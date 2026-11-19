import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ApiError } from "../../api/client";
import { useMe, useRegister } from "../../api/queries";
import {
  Button,
  cx,
  ErrorBanner,
  Field,
  inputClass,
  invalidInputClass,
} from "../../components/ui";
import { applyServerErrors } from "../../lib/server-errors";
import { registerSchema, type RegisterValues } from "../../lib/validation";
import { AuthLayout } from "./AuthLayout";

export function RegisterPage() {
  const me = useMe();
  const signUp = useRegister();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
    },
  });

  if (me.data) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signUp.mutateAsync(values);
      navigate("/", { replace: true });
    } catch (error) {
      applyServerErrors(error, setError);
    }
  });

  const showBanner =
    signUp.isError &&
    !(
      signUp.error instanceof ApiError &&
      Object.keys(signUp.error.errors).length > 0
    );

  return (
    <AuthLayout
      eyebrow="Create account"
      title="Start a signal log"
      subtitle="One account works across every community you join. Your name is the only thing other members see."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-teal underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {showBanner && <ErrorBanner error={signUp.error} />}

        <Field label="Name" htmlFor="name" error={errors.name?.message}>
          <input
            id="name"
            autoComplete="name"
            placeholder="Ada Lovelace"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={cx(inputClass, errors.name && invalidInputClass)}
            {...register("name")}
          />
        </Field>

        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@lab.org"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={cx(inputClass, errors.email && invalidInputClass)}
            {...register("email")}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Password"
            htmlFor="password"
            error={errors.password?.message}
            hint="At least 8 characters."
          >
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? "password-error" : "password-hint"
              }
              className={cx(inputClass, errors.password && invalidInputClass)}
              {...register("password")}
            />
          </Field>

          <Field
            label="Repeat password"
            htmlFor="password_confirmation"
            error={errors.password_confirmation?.message}
          >
            <input
              id="password_confirmation"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password_confirmation)}
              aria-describedby={
                errors.password_confirmation
                  ? "password_confirmation-error"
                  : undefined
              }
              className={cx(
                inputClass,
                errors.password_confirmation && invalidInputClass,
              )}
              {...register("password_confirmation")}
            />
          </Field>
        </div>

        <Button
          type="submit"
          variant="primary"
          loading={signUp.isPending}
          className="w-full"
        >
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
