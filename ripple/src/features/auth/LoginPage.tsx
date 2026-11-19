import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../../api/client";
import { useLogin, useMe } from "../../api/queries";
import {
  Button,
  cx,
  ErrorBanner,
  Field,
  inputClass,
  invalidInputClass,
} from "../../components/ui";
import { applyServerErrors } from "../../lib/server-errors";
import { loginSchema, type LoginValues } from "../../lib/validation";
import { AuthLayout } from "./AuthLayout";

export function LoginPage() {
  const me = useMe();
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from ?? "/";

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  if (me.data) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
      navigate(from, { replace: true });
    } catch (error) {
      applyServerErrors(error, setError);
    }
  });

  const showBanner =
    login.isError &&
    !(
      login.error instanceof ApiError &&
      Object.keys(login.error.errors).length > 0
    );

  return (
    <AuthLayout
      eyebrow="Sign in"
      title="Pick up the thread"
      subtitle="Ripple keeps the small, recurring problems your group reports — and shows when they add up to a pattern."
      footer={
        <>
          New here?{" "}
          <Link
            to="/register"
            className="font-medium text-teal underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {showBanner && <ErrorBanner error={login.error} />}

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

        <Field
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
        >
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            className={cx(inputClass, errors.password && invalidInputClass)}
            {...register("password")}
          />
        </Field>

        <Button
          type="submit"
          variant="primary"
          loading={login.isPending}
          className="w-full"
        >
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
