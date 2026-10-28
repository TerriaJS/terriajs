import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { Spinner } from "..";

describe("Spinner", () => {
  it("renders a progressbar with an accessible name and no value", async () => {
    const screen = await render(<Spinner aria-label="Loading layers" />);

    const spinner = screen.getByRole("progressbar", { name: "Loading layers" });
    await expect.element(spinner).not.toHaveAttribute("aria-valuenow");
  });

  it("defaults to the accent color and medium size", async () => {
    const screen = await render(<Spinner aria-label="Loading" />);

    const spinner = screen.getByRole("progressbar");
    await expect.element(spinner).toHaveAttribute("data-tds-color", "accent");
    await expect.element(spinner).toHaveAttribute("data-tds-size", "md");
  });

  it.each(["current", "success", "warning", "danger"] as const)(
    "renders the %s color",
    async (color) => {
      const screen = await render(
        <Spinner aria-label="Loading" color={color} />
      );

      await expect
        .element(screen.getByRole("progressbar"))
        .toHaveAttribute("data-tds-color", color);
    }
  );

  it.each(["sm", "lg"] as const)("renders the %s size", async (size) => {
    const screen = await render(<Spinner aria-label="Loading" size={size} />);

    await expect
      .element(screen.getByRole("progressbar"))
      .toHaveAttribute("data-tds-size", size);
  });

  it("merges a className and forwards its ref", async () => {
    const ref = createRef<HTMLDivElement>();
    const screen = await render(
      <Spinner aria-label="Loading" className="map-loader" ref={ref} />
    );

    const spinner = screen.getByRole("progressbar");
    await expect.element(spinner).toHaveClass("map-loader");
    expect(ref.current).toBe(spinner.element());
  });
});
