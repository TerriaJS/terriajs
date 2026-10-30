import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { ShuffleIcon } from "@terria/design-system-icons";
import { createRef } from "react";
import { focusVisible, snap, viewport } from "../../../visual";
import { Button } from "../../Button";
import { ColorArea } from "../../ColorArea";
import { ColorField } from "../../ColorField";
import { ColorSlider } from "../../ColorSlider";
import { ColorSwatch } from "../../ColorSwatch";
import { ColorSwatchPicker } from "../../ColorSwatchPicker";
import { Label } from "../../Field";
import { ColorPicker } from "..";
import "../color-picker.stories.css";

// Done animating in: no data-entering left, every animation finished, and
// two frames drawn since, so nothing is caught on a layer of its own
const settled = async (): Promise<void> => {
  await expect.poll(() => document.querySelector("[data-entering]")).toBeNull();
  await Promise.all(
    document.getAnimations().map((animation) => animation.finished)
  );
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
};

const SUGGESTED = [
  "#f43f5e",
  "#d946ef",
  "#8b5cf6",
  "#10b981",
  "#06b6d4",
  "#22c55e",
  "#84cc16",
  "#f59e0b",
  "#f97316"
];

const suggestions = (
  <ColorSwatchPicker
    aria-label="Suggested colours"
    size="xs"
    className="color-picker-story-suggestions"
  >
    {SUGGESTED.map((color) => (
      <ColorSwatchPicker.Item key={color} color={color} />
    ))}
  </ColorSwatchPicker>
);

const hue = (
  <ColorSlider
    aria-label="Hue"
    channel="hue"
    colorSpace="hsb"
    showValue={false}
  />
);

// The design's picker: suggestions, area, hue and shuffle, and the hex field
const picker = ({
  isEmpty = false,
  isDisabled = false
}: { isEmpty?: boolean; isDisabled?: boolean } = {}): React.ReactElement => (
  <ColorPicker defaultValue="#e9b42f">
    <ColorPicker.Trigger isDisabled={isDisabled}>
      <ColorPicker.Indicator isEmpty={isEmpty} />
      {isEmpty ? "Pick a color" : "Color"}
    </ColorPicker.Trigger>
    <ColorPicker.Popover>
      {suggestions}
      <ColorArea aria-label="Saturation and brightness" />
      <div className="color-picker-story-hue">
        {hue}
        <Button
          size="sm"
          variant="tertiary"
          isIconOnly
          aria-label="Random colour"
        >
          <ShuffleIcon aria-hidden />
        </Button>
      </div>
      <ColorField aria-label="Hex" fullWidth>
        <ColorField.Group variant="secondary">
          <ColorField.Swatch />
          <ColorField.Input />
        </ColorField.Group>
      </ColorField>
    </ColorPicker.Popover>
  </ColorPicker>
);

// Open, placed, and done animating in
const opened = async (): Promise<void> => {
  await expect.element(page.getByRole("dialog")).toBeVisible();
  await settled();
};

// The field's swatch opens it, below the whole field
const fieldMarker = (): React.ReactElement => {
  const groupRef = createRef<HTMLDivElement>();
  return (
    <div className="color-picker-story-field">
      <ColorPicker defaultValue="#0485f7">
        <ColorField fullWidth>
          <Label>Fill</Label>
          <ColorField.Group ref={groupRef}>
            <ColorPicker.Trigger aria-label="Pick a colour">
              <ColorField.Swatch />
            </ColorPicker.Trigger>
            <ColorField.Input />
          </ColorField.Group>
        </ColorField>
        <ColorPicker.Popover triggerRef={groupRef}>
          {suggestions}
          <ColorArea aria-label="Saturation and brightness" />
          {hue}
        </ColorPicker.Popover>
      </ColorPicker>
    </div>
  );
};

describe("ColorPicker", () => {
  it("default", async () => {
    await render(picker());
    await snap();
  });

  it("empty", async () => {
    await render(picker({ isEmpty: true }));
    await snap();
  });

  it("focused", async () => {
    await render(picker());
    await focusVisible(page.getByRole("button", { name: /Color/ }));
    await snap();
  });

  it("disabled", async () => {
    await render(picker({ isDisabled: true }));
    await snap();
  });

  it("open", async () => {
    await render(picker());
    await userEvent.click(page.getByRole("button", { name: /Color/ }));
    await opened();
    await snap(viewport());
  });

  it("open from a button with a swatch", async () => {
    await render(
      <ColorPicker defaultValue="#10b981">
        <Button variant="secondary" slot="trigger">
          <ColorSwatch size="xs" />
          Fill colour
        </Button>
        <ColorPicker.Popover>{suggestions}</ColorPicker.Popover>
      </ColorPicker>
    );
    await userEvent.click(page.getByRole("button", { name: /Fill colour/ }));
    await opened();
    await snap(viewport());
  });

  it("open from a field's swatch", async () => {
    await render(fieldMarker());
    await userEvent.click(page.getByRole("button", { name: "Pick a colour" }));
    await opened();
    await snap(viewport());
  });
});
