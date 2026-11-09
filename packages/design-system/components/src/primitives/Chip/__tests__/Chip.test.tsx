import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { Chip } from "..";

describe("Chip", () => {
  it("wraps text content in a label", async () => {
    const screen = await render(<Chip>Satellite</Chip>);

    await expect
      .element(screen.getByText("Satellite"))
      .toHaveAttribute("data-tds", "chip-label");
  });

  it("keeps icons beside its label", async () => {
    const screen = await render(
      <Chip>
        <svg data-testid="icon" />
        <Chip.Label>Satellite</Chip.Label>
      </Chip>
    );

    await expect.element(screen.getByTestId("icon")).toBeInTheDocument();
    await expect
      .element(screen.getByText("Satellite"))
      .toHaveAttribute("data-tds", "chip-label");
  });

  it("forwards its ref to the chip element", async () => {
    const ref = createRef<HTMLSpanElement>();
    await render(<Chip ref={ref}>Satellite</Chip>);

    expect(ref.current?.getAttribute("data-tds")).toBe("chip");
  });
});
