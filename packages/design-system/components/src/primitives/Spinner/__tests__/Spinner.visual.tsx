import { describe, it } from "vitest";
import { render } from "vitest-browser-react";
import { snap } from "../../../visual";
import { Spinner, type SpinnerColor, type SpinnerSize } from "..";

const COLORS: SpinnerColor[] = [
  "accent",
  "current",
  "success",
  "warning",
  "danger"
];
const SIZES: SpinnerSize[] = ["sm", "md", "lg"];

// Animations are stopped for screenshots, so the arc's head is at the top
describe("Spinner", () => {
  it.each(COLORS)("color %s", async (color) => {
    await render(<Spinner aria-label="Loading" color={color} />);
    await snap();
  });

  it.each(SIZES)("size %s", async (size) => {
    await render(<Spinner aria-label="Loading" size={size} />);
    await snap();
  });
});
