import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NewSignalPage } from "../features/signals/NewSignalPage";
import { jsonResponse, renderWithProviders } from "./utils";

describe("NewSignalPage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ data: [] })),
    );
  });

  it("requires a title, description, category, and zone", async () => {
    const user = userEvent.setup();

    renderWithProviders(<NewSignalPage />, {
      route: "/c/1/new",
      path: "/c/:communityId/new",
    });

    await user.click(screen.getByRole("button", { name: "Post signal" }));

    expect(await screen.findByText("Add a short title.")).toBeInTheDocument();
    expect(
      screen.getByText("Describe what you observed."),
    ).toBeInTheDocument();
    expect(screen.getByText("Choose a category.")).toBeInTheDocument();
    expect(screen.getByText("Add a zone.")).toBeInTheDocument();
  });
});
