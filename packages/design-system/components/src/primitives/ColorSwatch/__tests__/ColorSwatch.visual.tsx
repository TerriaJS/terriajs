import { describe, it } from "vitest";
import { render } from "vitest-browser-react";
import { snap } from "../../../visual";
import { ColorSwatch, type ColorSwatchShape, type ColorSwatchSize } from "..";

const SHAPES: ColorSwatchShape[] = ["circle", "square"];
const SIZES: ColorSwatchSize[] = ["xs", "sm", "md", "lg", "xl"];

describe.each(SHAPES)("ColorSwatch %s", (shape) => {
  it.each(SIZES)("size %s", async (size) => {
    await render(<ColorSwatch color="#3b82f6" shape={shape} size={size} />);
    await snap();
  });

  // The checkerboard shows through
  it("transparent", async () => {
    await render(
      <ColorSwatch color="rgba(59, 130, 246, 0.4)" shape={shape} size="xl" />
    );
    await snap();
  });
});

describe("ColorSwatch", () => {
  // A legend's colours, a light one and a translucent dark one among them
  it("colors", async () => {
    await render(
      <div className="tds-flex tds-flex-gap-sm">
        <ColorSwatch color="#ef4444" colorName="Bushfire" />
        <ColorSwatch color="#f59e0b" colorName="Drought" />
        <ColorSwatch color="#10b981" colorName="Vegetation" />
        <ColorSwatch color="#3b82f6" colorName="Rivers" />
        <ColorSwatch color="#8b5cf6" colorName="Suburbs" />
        <ColorSwatch color="#ffffff" colorName="Snow" />
        <ColorSwatch color="rgba(17, 24, 39, 0.5)" colorName="Shade" />
      </div>
    );
    await snap();
  });
});
