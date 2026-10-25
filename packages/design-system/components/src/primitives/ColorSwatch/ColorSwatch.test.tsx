import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { ColorSwatch } from ".";

describe("ColorSwatch", () => {
  it("is an image named for its colour", async () => {
    const screen = await render(<ColorSwatch color="#3b82f6" />);

    await expect
      .element(screen.getByRole("img", { name: /blue/i }))
      .toBeInTheDocument();
  });

  it("takes a name for its colour instead", async () => {
    const screen = await render(
      <ColorSwatch color="#3b82f6" colorName="Rivers" />
    );

    await expect
      .element(screen.getByRole("img", { name: "Rivers" }))
      .toBeInTheDocument();
  });

  it("shows its colour", async () => {
    const screen = await render(<ColorSwatch color="#3b82f6" />);

    const swatch = screen.getByRole("img").element();
    expect(getComputedStyle(swatch).backgroundImage).toContain(
      "rgb(59, 130, 246)"
    );
  });

  it("shows a transparent colour over a checkerboard, so it can be seen", async () => {
    const screen = await render(
      <ColorSwatch color="rgba(59, 130, 246, 0.5)" />
    );

    const swatch = screen.getByRole("img").element();
    expect(getComputedStyle(swatch).backgroundImage).toContain(
      "repeating-conic-gradient"
    );
  });
});
