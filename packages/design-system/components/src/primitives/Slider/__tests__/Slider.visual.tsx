import { describe, expect, it } from "vitest";
import { page, userEvent, type Locator } from "vitest/browser";
import { render } from "vitest-browser-react";
import { focusVisible, hover, press, snap, viewport } from "../../../visual";
import { Slider, type SliderProps } from "..";
// Slider's stories set their width inline; the colour slider's class gives
// the same kind of room, as in a panel
import "../../ColorSlider/color-slider.stories.css";

const slider = (props: SliderProps): React.ReactElement => (
  <div
    className={
      props.orientation === "vertical"
        ? "color-slider-story color-slider-story-upright"
        : "color-slider-story"
    }
  >
    <Slider label="Opacity" defaultValue={30} {...props} />
  </div>
);

// The thumb a person points at, not the hidden input inside it
const thumb = (index = 0): Locator => {
  const element = document.querySelectorAll('[data-tds="slider-thumb"]')[index];
  if (!element) throw new Error(`No thumb ${String(index)}`);
  return page.elementLocator(element);
};

const CASES: Record<string, SliderProps> = {
  single: {},
  range: { label: "Price", defaultValue: [20, 60] },
  vertical: { orientation: "vertical", step: 10, showSteps: true }
};

describe.each(Object.entries(CASES))("Slider %s", (_, props) => {
  it("default", async () => {
    await render(slider(props));
    await snap();
  });

  it("thumb hovered", async () => {
    await render(slider(props));
    await hover(thumb());
    await snap();
  });

  it("thumb focused", async () => {
    const screen = await render(slider(props));
    await focusVisible(screen.getByRole("slider").first());
    await expect.element(thumb()).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("thumb hovered and focused", async () => {
    const screen = await render(slider(props));
    await focusVisible(screen.getByRole("slider").first());
    await hover(thumb());
    await expect.element(thumb()).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("thumb dragging", async () => {
    await render(slider(props));
    await press(thumb());
    await expect.element(thumb()).toHaveAttribute("data-dragging");
    await snap();
  });

  it("disabled", async () => {
    await render(slider({ ...props, isDisabled: true }));
    await snap();
  });
});

describe("Slider", () => {
  it("moved with the arrow keys", async () => {
    const screen = await render(slider({}));
    await focusVisible(screen.getByRole("slider"));
    await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
    await expect.element(screen.getByRole("slider")).toHaveValue("33");
    await snap();
  });

  it("three thumbs", async () => {
    await render(slider({ label: "Price", defaultValue: [20, 60, 90] }));
    await snap();
  });

  it("without value", async () => {
    await render(slider({ showValue: false }));
    await snap();
  });

  it("percent", async () => {
    await render(
      slider({
        defaultValue: 0.3,
        maxValue: 1,
        step: 0.01,
        formatOptions: { style: "percent" }
      })
    );
    await snap();
  });

  it("steps", async () => {
    await render(
      slider({
        label: "Price",
        defaultValue: [20, 60],
        step: 10,
        showSteps: true
      })
    );
    await snap();
  });

  it("marks", async () => {
    await render(
      slider({
        defaultValue: 0.5,
        maxValue: 1,
        step: 0.1,
        formatOptions: { style: "percent" },
        showSteps: true,
        marks: [0.2, 0.5, 0.8]
      })
    );
    await snap();
  });

  it("mark labels", async () => {
    await render(
      slider({
        label: "Zoom",
        defaultValue: 12,
        maxValue: 20,
        marks: [
          { value: 2, label: "World" },
          { value: 10, label: "City" },
          { value: 18, label: "Street" }
        ]
      })
    );
    await snap();
  });

  it("vertical with marks", async () => {
    await render(
      slider({
        orientation: "vertical",
        step: 10,
        showSteps: true,
        marks: [0, 50, 100]
      })
    );
    await snap();
  });

  // The fill reaches into the track's rounded ends
  it.each([
    ["minimum", 0],
    ["maximum", 100]
  ])("at the %s", async (_, value) => {
    await render(slider({ defaultValue: value }));
    await snap();
  });

  it("full range", async () => {
    await render(slider({ label: "Full range", defaultValue: [0, 100] }));
    await snap();
  });

  // The tooltip is an overlay, outside the test's container. React Aria
  // places it after it shows, and may nudge it again a frame later, so the
  // screenshot waits until it stays put
  const settled = async (tooltip: Locator): Promise<void> => {
    await expect.element(tooltip).toBeVisible();
    const frame = (): Promise<unknown> =>
      new Promise((resolve) => requestAnimationFrame(resolve));
    const where = (): string =>
      JSON.stringify(tooltip.element().getBoundingClientRect());
    let last = "";
    while (where() !== last) {
      last = where();
      await frame();
      await frame();
    }
  };

  const priced = (): React.ReactElement =>
    slider({
      label: "Price",
      defaultValue: [20, 60],
      step: 10,
      showSteps: true,
      showTooltip: true,
      formatOptions: {
        style: "currency",
        currency: "AUD",
        maximumFractionDigits: 0
      }
    });

  it("tooltip, thumb hovered", async () => {
    const screen = await render(priced());
    await hover(thumb());
    await settled(screen.getByRole("tooltip"));
    await snap(viewport());
  });

  it("tooltip, thumb focused", async () => {
    const screen = await render(priced());
    await focusVisible(screen.getByRole("slider").first());
    await settled(screen.getByRole("tooltip"));
    await snap(viewport());
  });
});
