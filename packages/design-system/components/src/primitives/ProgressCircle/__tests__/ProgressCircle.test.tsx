import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { render, type RenderResult } from "vitest-browser-react";
import { ProgressCircle, type ProgressCircleProps } from "..";

const renderCircle = (props: ProgressCircleProps = {}): Promise<RenderResult> =>
  render(
    <ProgressCircle aria-label="Loading" {...props}>
      <ProgressCircle.Track>
        <ProgressCircle.TrackCircle />
        <ProgressCircle.FillCircle />
      </ProgressCircle.Track>
    </ProgressCircle>
  );

const fillCircle = (container: HTMLElement): Element => {
  const fill = container.querySelector(
    '[data-tds="progress-circle-fill-circle"]'
  );
  if (!fill) throw new Error("fill circle not rendered");
  return fill;
};

describe("ProgressCircle", () => {
  it("renders a progressbar with an accessible name and value", async () => {
    const screen = await renderCircle({ value: 40 });

    await expect
      .element(screen.getByRole("progressbar", { name: "Loading" }))
      .toHaveAttribute("aria-valuenow", "40");
  });

  it("draws the fill arc in proportion to the value", async () => {
    const screen = await renderCircle({ value: 25 });

    const fill = fillCircle(screen.container);
    const circumference = Number(fill.getAttribute("stroke-dasharray"));
    expect(Number(fill.getAttribute("stroke-dashoffset"))).toBeCloseTo(
      circumference * 0.75
    );
  });

  it("shows a fixed quarter arc and no value while indeterminate", async () => {
    const screen = await renderCircle({ isIndeterminate: true });

    await expect
      .element(screen.getByRole("progressbar"))
      .not.toHaveAttribute("aria-valuenow");
    const fill = fillCircle(screen.container);
    const circumference = Number(fill.getAttribute("stroke-dasharray"));
    expect(Number(fill.getAttribute("stroke-dashoffset"))).toBeCloseTo(
      circumference * 0.75
    );
  });

  it("defaults to the accent color and medium size", async () => {
    const screen = await renderCircle();

    const progress = screen.getByRole("progressbar");
    await expect.element(progress).toHaveAttribute("data-tds-color", "accent");
    await expect.element(progress).toHaveAttribute("data-tds-size", "md");
  });

  it.each(["default", "success", "warning", "danger", "current"] as const)(
    "renders the %s color",
    async (color) => {
      const screen = await renderCircle({ color });

      await expect
        .element(screen.getByRole("progressbar"))
        .toHaveAttribute("data-tds-color", color);
    }
  );

  it("passes data attributes through to the root", async () => {
    const screen = await renderCircle({
      "data-testid": "spinner"
    } as ProgressCircleProps);

    await expect
      .element(screen.getByTestId("spinner"))
      .toHaveAttribute("data-tds", "progress-circle");
  });

  it("exposes every part for styling", async () => {
    const screen = await renderCircle({ value: 10 });

    for (const part of ["track", "track-circle", "fill-circle"]) {
      expect(
        screen.container.querySelector(`[data-tds="progress-circle-${part}"]`)
      ).not.toBeNull();
    }
  });
});

// React 18 drops `ref` from plain function components; each part forwards it
describe("ProgressCircle refs", () => {
  it("reaches the track and circle elements", async () => {
    const track = createRef<SVGSVGElement>();
    const trackCircle = createRef<SVGCircleElement>();
    const fillCircle = createRef<SVGCircleElement>();
    await render(
      <ProgressCircle aria-label="Loading" value={40}>
        <ProgressCircle.Track ref={track}>
          <ProgressCircle.TrackCircle ref={trackCircle} />
          <ProgressCircle.FillCircle ref={fillCircle} />
        </ProgressCircle.Track>
      </ProgressCircle>
    );

    expect(track.current?.getAttribute("data-tds")).toBe(
      "progress-circle-track"
    );
    expect(trackCircle.current?.getAttribute("data-tds")).toBe(
      "progress-circle-track-circle"
    );
    expect(fillCircle.current?.getAttribute("data-tds")).toBe(
      "progress-circle-fill-circle"
    );
  });
});
