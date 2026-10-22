import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { IconSpriteProvider, SpriteIcon } from "./SpriteIcon";

describe("SpriteIcon", () => {
  it("draws the named icon from the sprite the provider points to", async () => {
    const screen = await render(
      <IconSpriteProvider href="/assets/sprite.svg">
        <SpriteIcon name="map" data-testid="icon" />
      </IconSpriteProvider>
    );

    const use = screen.getByTestId("icon").element().querySelector("use");
    expect(use?.getAttribute("href")).toBe("/assets/sprite.svg#map");
  });

  it("draws from a sprite in the page itself, without a provider", async () => {
    const screen = await render(<SpriteIcon name="map" data-testid="icon" />);

    const use = screen.getByTestId("icon").element().querySelector("use");
    expect(use?.getAttribute("href")).toBe("#map");
  });

  it("is 24px unless given another size", async () => {
    const screen = await render(
      <>
        <SpriteIcon name="map" data-testid="default" />
        <SpriteIcon name="map" size={16} data-testid="small" />
      </>
    );

    const icon = screen.getByTestId("default").element();
    expect(icon.getAttribute("width")).toBe("24");
    expect(icon.getAttribute("height")).toBe("24");
    expect(icon.getAttribute("viewBox")).toBe("0 0 24 24");
    expect(screen.getByTestId("small").element().getAttribute("width")).toBe(
      "16"
    );
  });

  it("is hidden from assistive technology unless it's labelled", async () => {
    const screen = await render(<SpriteIcon name="map" data-testid="icon" />);

    await expect
      .element(screen.getByTestId("icon"))
      .toHaveAttribute("aria-hidden", "true");
  });

  it("is an image named by its label when it's labelled", async () => {
    const screen = await render(<SpriteIcon name="map" aria-label="Map" />);

    await expect
      .element(screen.getByRole("img", { name: "Map" }))
      .toBeVisible();
  });

  it("passes props and its ref through to the svg", async () => {
    const ref = createRef<SVGSVGElement>();
    const screen = await render(
      <SpriteIcon
        name="map"
        ref={ref}
        className="layer-icon"
        data-testid="icon"
      />
    );

    expect(screen.getByTestId("icon").element()).toHaveClass("layer-icon");
    expect(ref.current).toBe(screen.getByTestId("icon").element());
  });
});
