import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { Surface } from "..";

describe("Surface", () => {
  it("holds its content", async () => {
    const screen = await render(
      <Surface>
        <p>Layer details</p>
      </Surface>
    );

    await expect.element(screen.getByText("Layer details")).toBeVisible();
  });

  it("defaults to the default variant", async () => {
    const screen = await render(<Surface data-testid="surface" />);

    await expect
      .element(screen.getByTestId("surface"))
      .toHaveAttribute("data-tds-variant", "default");
  });

  it.each(["secondary", "tertiary", "transparent"] as const)(
    "marks the %s variant",
    async (variant) => {
      const screen = await render(
        <Surface variant={variant} data-testid="surface" />
      );

      await expect
        .element(screen.getByTestId("surface"))
        .toHaveAttribute("data-tds-variant", variant);
    }
  );

  it("takes a className, other props and a ref", async () => {
    const ref = createRef<HTMLDivElement>();
    const screen = await render(
      <Surface ref={ref} className="legend" role="region" aria-label="Legend" />
    );

    const surface = screen.getByRole("region", { name: "Legend" });
    await expect.element(surface).toHaveClass("legend");
    expect(ref.current).toBe(surface.element());
  });
});
