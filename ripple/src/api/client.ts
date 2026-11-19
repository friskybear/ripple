import type {
  AuthResponse,
  Comment,
  Community,
  Paginated,
  Signal,
  SignalFilters,
  User,
  Wrapped,
} from "./types";

/** Laravel validation errors: { email: ["The email is invalid."] } */
export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  status: number;
  errors: FieldErrors;

  constructor(status: number, message: string, errors: FieldErrors = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }

  static async from(response: Response): Promise<ApiError> {
    const body = await response.json().catch(() => null);
    return new ApiError(
      response.status,
      body?.message ?? response.statusText ?? "Request failed",
      body?.errors ?? {},
    );
  }
}

const BASE = import.meta.env.VITE_API_BASE_URL ?? "";

function readCookie(name: string): string | undefined {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")
    .slice(1)
    .join("=");
}

/** One CSRF cookie fetch, shared by every write request. */
let csrf: Promise<void> | null = null;

function ensureCsrf(): Promise<void> {
  csrf ??= fetch(`${BASE}/sanctum/csrf-cookie`, {
    credentials: "include",
  }).then(() => undefined);
  return csrf;
}

export async function api<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const writes = method !== "GET" && method !== "HEAD";

  if (writes) {
    await ensureCsrf();
  }

  const token = readCookie("XSRF-TOKEN");

  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { "X-XSRF-TOKEN": decodeURIComponent(token) } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(
      0,
      "Cannot reach the Ripple API. Is the backend running?",
    );
  }

  // Laravel rotates the token when the session expires: fetch once more, retry once.
  if (response.status === 419 && retry) {
    csrf = null;
    await ensureCsrf();
    return api<T>(path, init, false);
  }

  if (response.status === 401) {
    window.dispatchEvent(new Event("ripple:unauthorized"));
  }

  if (!response.ok) {
    throw await ApiError.from(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const authApi = {
  me: () => api<Wrapped<User>>("/api/me"),
  login: (body: { email: string; password: string }) =>
    api<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  register: (body: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) =>
    api<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  logout: () => api<void>("/api/auth/logout", { method: "POST" }),
};

export const communityApi = {
  list: () => api<Wrapped<Community[]>>("/api/communities"),
  create: (name: string) =>
    api<Wrapped<Community>>("/api/communities", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  join: (inviteCode: string) =>
    api<Wrapped<Community>>("/api/communities/join", {
      method: "POST",
      body: JSON.stringify({ invite_code: inviteCode }),
    }),
};

export const signalApi = {
  list: (communityId: number, filters: SignalFilters) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    }
    const query = params.toString();
    return api<Paginated<Signal>>(
      `/api/communities/${communityId}/signals${query ? `?${query}` : ""}`,
    );
  },

  show: (signalId: number) =>
    api<Wrapped<Signal>>(`/api/signals/${signalId}`),

  create: (
    communityId: number,
    body: {
      title: string;
      description: string;
      category: string;
      zone: string;
      impact: number;
    },
  ) =>
    api<Wrapped<Signal>>(`/api/communities/${communityId}/signals`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  confirm: (signalId: number, confirmed: boolean) =>
    api<{ confirmed: boolean } | void>(
      `/api/signals/${signalId}/confirm`,
      { method: confirmed ? "DELETE" : "POST" },
    ),

  transition: (signalId: number, to: string, note?: string) =>
    api<Wrapped<Signal>>(`/api/signals/${signalId}/transition`, {
      method: "POST",
      body: JSON.stringify({ to, note }),
    }),

  comments: (signalId: number, page = 1) =>
    api<Paginated<Comment>>(
      `/api/signals/${signalId}/comments?page=${page}`,
    ),

  addComment: (signalId: number, body: string) =>
    api<Wrapped<Comment>>(`/api/signals/${signalId}/comments`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),
};
