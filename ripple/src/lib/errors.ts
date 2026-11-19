import { ApiError } from "../api/client";

export function errorText(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 0:
        return "Cannot reach the Ripple API. Is the backend running on port 8000?";
      case 401:
        return "Your session expired. Sign in again.";
      case 403:
        return "You do not have permission to do that.";
      case 404:
        return "That item is no longer available.";
      case 419:
        return "Your session expired. Refresh the page and try again.";
      case 429:
        return "Too many requests. Try again in a minute.";
      default:
        if (error.status >= 500) {
          return "The server had a problem. Try again in a moment.";
        }
        return error.message;
    }
  }

  return error instanceof Error ? error.message : "Something went wrong.";
}
