import { createRef } from "react";
import { describe, expect, it, onTestFinished, vi } from "vitest";
import { render } from "vitest-browser-react";
import { AIActivityIndicator } from "..";

describe("AIActivityIndicator", () => {
  it("renders a progressbar with an accessible name and no value", async () => {
    const screen = await render(
      <AIActivityIndicator aria-label="Finding pages with geometry" />
    );

    const indicator = screen.getByRole("progressbar", {
      name: "Finding pages with geometry"
    });
    await expect.element(indicator).not.toHaveAttribute("aria-valuenow");
  });

  it("draws six sparkles, hidden from assistive technology", async () => {
    const screen = await render(<AIActivityIndicator aria-label="Thinking" />);

    const drawing = screen
      .getByRole("progressbar")
      .element()
      .querySelector("svg");
    expect(drawing).toHaveAttribute("aria-hidden", "true");
    expect(drawing?.querySelectorAll("path")).toHaveLength(6);
  });

  it.each([4, 5] as const)("draws %i sparkles when asked", async (count) => {
    const screen = await render(
      <AIActivityIndicator aria-label="Thinking" sparkles={count} />
    );

    const drawing = screen
      .getByRole("progressbar")
      .element()
      .querySelector("svg");
    expect(drawing?.querySelectorAll("path")).toHaveLength(count);
  });

  it("is only decoration when hidden, beside text that says what's happening", async () => {
    const screen = await render(
      <p>
        <AIActivityIndicator aria-hidden />
        Generating
      </p>
    );

    expect(screen.getByRole("progressbar").query()).toBeNull();
    const indicator = screen.container.querySelector(
      '[data-tds="ai-activity-indicator"]'
    );
    expect(indicator).toHaveAttribute("aria-hidden", "true");
    expect(indicator?.querySelectorAll("path")).toHaveLength(6);
  });

  it("keeps its id, style and data attributes when hidden", async () => {
    const screen = await render(
      <AIActivityIndicator
        aria-hidden
        id="generating"
        style={{ color: "rgb(255, 0, 0)" }}
        data-testid="indicator"
      />
    );

    const indicator = screen.getByTestId("indicator");
    await expect.element(indicator).toHaveAttribute("id", "generating");
    await expect.element(indicator).toHaveStyle({ color: "rgb(255, 0, 0)" });
  });

  // In a line of text, as decoration often is: a <div> can't go in a <p>
  it("sits in a paragraph when hidden", async () => {
    const error = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    onTestFinished(() => {
      error.mockRestore();
    });

    await render(
      <p>
        <AIActivityIndicator aria-hidden /> Generating
      </p>
    );

    expect(error).not.toHaveBeenCalled();
  });

  it("keeps its className when hidden", async () => {
    const screen = await render(
      <AIActivityIndicator
        aria-hidden
        data-testid="indicator"
        className="busy"
      />
    );

    await expect.element(screen.getByTestId("indicator")).toHaveClass("busy");
  });

  it("defaults to the medium size", async () => {
    const screen = await render(<AIActivityIndicator aria-label="Thinking" />);

    await expect
      .element(screen.getByRole("progressbar"))
      .toHaveAttribute("data-tds-size", "md");
  });

  it.each(["sm", "lg"] as const)("renders the %s size", async (size) => {
    const screen = await render(
      <AIActivityIndicator aria-label="Thinking" size={size} />
    );

    await expect
      .element(screen.getByRole("progressbar"))
      .toHaveAttribute("data-tds-size", size);
  });

  it("merges a className and forwards its ref", async () => {
    const ref = createRef<HTMLDivElement>();
    const screen = await render(
      <AIActivityIndicator
        aria-label="Thinking"
        className="search-status"
        ref={ref}
      />
    );

    const indicator = screen.getByRole("progressbar");
    await expect.element(indicator).toHaveClass("search-status");
    expect(ref.current).toBe(indicator.element());
  });
});
