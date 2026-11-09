import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import type { ColorSwatchShape, ColorSwatchSize } from "../../ColorSwatch";
import { focusVisible, hover, press, snap } from "../../../visual";
import { ColorSwatchPicker, type ColorSwatchPickerProps } from "..";

// The design's colours; blue picked, as in the stories
const COLORS = [
  "#f43f5e",
  "#d946ef",
  "#8b5cf6",
  "#3b82f6",
  "#06b6d4",
  "#10b981",
  "#84cc16",
  "#f59e0b",
  "#f97316"
];
const SHAPES: ColorSwatchShape[] = ["circle", "square"];
const SIZES: ColorSwatchSize[] = ["xs", "sm", "md", "lg", "xl"];

const picker = (
  props: Partial<ColorSwatchPickerProps> = {},
  disabled?: string
): React.ReactElement => (
  <ColorSwatchPicker
    aria-label="Layer colour"
    defaultValue="#3b82f6"
    {...props}
  >
    {COLORS.map((color) => (
      <ColorSwatchPicker.Item
        key={color}
        color={color}
        isDisabled={color === disabled}
      />
    ))}
  </ColorSwatchPicker>
);

describe.each(SHAPES)("ColorSwatchPicker %s", (shape) => {
  it.each(SIZES)("size %s", async (size) => {
    await render(picker({ shape, size }));
    await snap();
  });
});

describe("ColorSwatchPicker", () => {
  it("item hovered", async () => {
    const screen = await render(picker());
    await hover(screen.getByRole("option").first());
    await snap();
  });

  it("item focused", async () => {
    const screen = await render(picker());
    const first = screen.getByRole("option").first();
    await focusVisible(first);
    await expect.element(first).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("picked item focused", async () => {
    const screen = await render(picker());
    const picked = screen.getByRole("option", { selected: true });
    await focusVisible(picked);
    await expect.element(picked).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("item pressed", async () => {
    const screen = await render(picker());
    await press(screen.getByRole("option").first());
    await snap();
  });

  // A press picks it: the ring and check move to it
  it("another picked", async () => {
    const screen = await render(picker());
    const green = screen.getByRole("option").nth(5);
    await green.click();
    await expect.element(green).toHaveAttribute("data-selected");
    await snap();
  });

  // Light colours get a dark check
  it("light colour picked", async () => {
    await render(picker({ defaultValue: "#84cc16" }));
    await snap();
  });

  it("disabled item", async () => {
    await render(picker({}, "#8b5cf6"));
    await snap();
  });

  it("stack layout", async () => {
    await render(picker({ layout: "stack", size: "sm" }));
    await snap();
  });
});
