import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { MapIcon } from "./icons";

describe("a generated icon", () => {
  it("draws the icon at 24px", async () => {
    const screen = await render(<MapIcon data-testid="icon" />);

    const svg = screen.getByTestId("icon").element();
    expect(svg.getAttribute("width")).toBe("24");
    expect(svg.getAttribute("height")).toBe("24");
    expect(svg.getAttribute("viewBox")).toBe("0 0 24 24");
    expect(svg.querySelector("path")).not.toBeNull();
  });

  it("is drawn in the colour of the text around it", async () => {
    const screen = await render(
      <span style={{ color: "rgb(255, 0, 0)" }}>
        <MapIcon data-testid="icon" />
      </span>
    );

    const path = screen.getByTestId("icon").element().querySelector("path");
    expect(path && getComputedStyle(path).fill).toBe("rgb(255, 0, 0)");
  });

  it("takes another size", async () => {
    const screen = await render(<MapIcon size={16} data-testid="icon" />);

    const svg = screen.getByTestId("icon").element();
    expect(svg.getAttribute("width")).toBe("16");
    expect(svg.getAttribute("height")).toBe("16");
  });

  it("is hidden from assistive technology unless it's labelled", async () => {
    const screen = await render(<MapIcon data-testid="icon" />);

    await expect
      .element(screen.getByTestId("icon"))
      .toHaveAttribute("aria-hidden", "true");
  });

  it("is an image named by its label when it's labelled", async () => {
    const screen = await render(<MapIcon aria-label="Map" />);

    await expect
      .element(screen.getByRole("img", { name: "Map" }))
      .toBeVisible();
  });

  it("passes props and its ref through to the svg", async () => {
    const ref = createRef<SVGSVGElement>();
    const screen = await render(
      <MapIcon ref={ref} className="layer-icon" data-testid="icon" />
    );

    expect(screen.getByTestId("icon").element()).toHaveClass("layer-icon");
    expect(ref.current).toBe(screen.getByTestId("icon").element());
  });

  it("has the icon's name, for React DevTools", () => {
    expect(MapIcon.displayName).toBe("MapIcon");
  });
});
