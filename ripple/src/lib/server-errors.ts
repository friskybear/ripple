import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "../api/client";

/**
 * Copy Laravel's 422 field errors onto the matching form inputs.
 * Returns true when at least one error was mapped.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): boolean {
  if (!(error instanceof ApiError)) return false;

  let mapped = false;
  for (const [field, messages] of Object.entries(error.errors)) {
    if (!messages[0]) continue;
    setError(field as Path<T>, { message: messages[0] });
    mapped = true;
  }
  return mapped;
}
