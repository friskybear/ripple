import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "../features/auth/LoginPage";
import { jsonResponse, renderWithProviders } from "./utils";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith("/api/me")) {
          return jsonResponse({ message: "Unauthenticated." }, 401);
        }
        if (url.endsWith("/sanctum/csrf-cookie")) {
          return new Response(null, { status: 204 });
        }
        if (url.endsWith("/api/auth/login")) {
          return jsonResponse(
            {
              message: "These credentials do not match our records.",
              errors: {
                email: ["These credentials do not match our records."],
              },
            },
            422,
          );
        }
        throw new Error(`Unexpected fetch: ${url}`);
      }),
    );
  });

  it("validates the email before sending anything", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.type(screen.getByLabelText("Password"), "whatever");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByText("Enter a valid email address."),
    ).toBeInTheDocument();
  });

  it("shows the server error under the email field", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByText(
        "These credentials do not match our records.",
      ),
    ).toBeInTheDocument();
  });
});
