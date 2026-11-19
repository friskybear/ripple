import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function ok(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("api client", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    document.cookie = "XSRF-TOKEN=abc123";
  });

  afterEach(() => {
    document.cookie =
      "XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  });

  it("fetches the CSRF cookie and sends the token on writes", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(ok({ done: true }));
    vi.stubGlobal("fetch", fetchMock);

    const { api } = await import("../api/client");
    const result = await api<{ done: boolean }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "ada@example.com" }),
    });

    expect(result).toEqual({ done: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toBe("/api/auth/login");
    expect(init.credentials).toBe("include");
    expect(
      (init.headers as Record<string, string>)["X-XSRF-TOKEN"],
    ).toBe("abc123");
    expect((init.headers as Record<string, string>).Accept).toBe(
      "application/json",
    );
  });

  it("refreshes CSRF and retries once after a 419", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "CSRF token mismatch." }), {
          status: 419,
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(ok({ done: true }));
    vi.stubGlobal("fetch", fetchMock);

    const { api } = await import("../api/client");
    const result = await api<{ done: boolean }>("/api/signals/1/confirm", {
      method: "POST",
    });

    expect(result).toEqual({ done: true });
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("keeps Laravel field errors on the thrown error", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: "The given data was invalid.",
            errors: { email: ["The email has already been taken."] },
          }),
          { status: 422, headers: { "Content-Type": "application/json" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { api, ApiError } = await import("../api/client");

    const error: unknown = await api("/api/auth/register", {
      method: "POST",
      body: "{}",
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 422,
      errors: { email: ["The email has already been taken."] },
    });
  });
});
