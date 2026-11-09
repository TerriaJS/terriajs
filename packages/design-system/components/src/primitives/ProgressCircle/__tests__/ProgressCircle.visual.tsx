import { describe, it } from "vitest";
import { render } from "vitest-browser-react";
import { snap } from "../../../visual";
import {
  ProgressCircle,
  type ProgressCircleColor,
  type ProgressCircleProps,
  type ProgressCircleSize
} from "..";

const COLORS: ProgressCircleColor[] = [
  "accent",
  "default",
  "success",
  "warning",
  "danger",
  "current"
];
const SIZES: ProgressCircleSize[] = ["sm", "md", "lg"];

const circle = (props: ProgressCircleProps): React.ReactElement => (
  <ProgressCircle aria-label="Loading" {...props}>
    <ProgressCircle.Track>
      <ProgressCircle.TrackCircle />
      <ProgressCircle.FillCircle />
    </ProgressCircle.Track>
  </ProgressCircle>
);

describe("ProgressCircle", () => {
  it.each([0, 60, 100])("value %i", async (value) => {
    await render(circle({ value }));
    await snap();
  });

  it.each(COLORS)("color %s", async (color) => {
    await render(circle({ value: 60, color }));
    await snap();
  });

  it.each(SIZES)("size %s", async (size) => {
    await render(circle({ value: 60, size }));
    await snap();
  });

  // Animations are stopped for screenshots, so the quarter arc is at the top
  it("indeterminate", async () => {
    await render(circle({ isIndeterminate: true }));
    await snap();
  });
});
