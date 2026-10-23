import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { Label } from "../Field";
import { Slider, SliderPrimitive } from ".";

describe("Slider", () => {
  it("is a slider named by its label, showing its value", async () => {
    const screen = await render(<Slider label="Opacity" defaultValue={30} />);

    await expect
      .element(screen.getByRole("slider", { name: "Opacity" }))
      .toHaveValue("30");
    await expect.element(screen.getByRole("status")).toHaveTextContent("30");
  });

  it("moves by its step with the arrow keys", async () => {
    const onChange = vi.fn();
    const screen = await render(
      <Slider label="Opacity" defaultValue={30} step={10} onChange={onChange} />
    );

    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");

    expect(onChange).toHaveBeenLastCalledWith(40);
    await expect.element(screen.getByRole("status")).toHaveTextContent("40");
  });

  it("has a thumb for each end of a range", async () => {
    const screen = await render(
      <Slider label="Year" defaultValue={[20, 80]} />
    );

    expect(screen.getByRole("slider").elements()).toHaveLength(2);
    await expect
      .element(screen.getByRole("status"))
      .toHaveTextContent("20 – 80");
  });

  it("fills the track between a range's thumbs", async () => {
    const screen = await render(
      <Slider label="Year" defaultValue={[20, 80]} />
    );
    const fill = screen.container.querySelector<HTMLElement>(
      "[data-tds='slider-fill']"
    );

    expect(fill?.style.insetInlineStart).toBe("20%");
    expect(fill?.style.width).toBe("60%");
  });

  it("sets the value under the pointer when its track is pressed", async () => {
    const thumbCentre = (
      screen: Awaited<ReturnType<typeof render>>
    ): number => {
      const rect = screen
        .getByRole("slider")
        .element()
        .closest("[data-tds='slider-thumb']")
        ?.getBoundingClientRect();
      return (rect?.left ?? 0) + (rect?.width ?? 0) / 2;
    };
    const screen = await render(<Slider label="Opacity" value={0} />);
    const atMin = thumbCentre(screen);
    await screen.rerender(<Slider label="Opacity" value={100} />);
    const atMax = thumbCentre(screen);
    const onChange = vi.fn();
    await screen.rerender(
      <Slider label="Opacity" defaultValue={0} onChange={onChange} />
    );
    const track = screen.container.querySelector<HTMLElement>(
      "[data-tds='slider-track']"
    );
    if (track === null) throw new Error("The slider has no track");
    const trackRect = track.getBoundingClientRect();

    // Where the design draws 75: three quarters of the way between the
    // thumb's centres at the two ends
    await userEvent.click(track, {
      position: {
        x: atMin + (atMax - atMin) * 0.75 - trackRect.left,
        y: trackRect.height / 2
      }
    });

    expect(onChange).toHaveBeenLastCalledWith(75);
  });

  it("marks each step with a tick when asked", async () => {
    const screen = await render(
      <Slider label="Opacity" defaultValue={50} step={25} showSteps />
    );

    expect(
      screen.container.querySelectorAll("[data-tds='slider-tick']")
    ).toHaveLength(5);
  });

  it("marks the ticks the fill covers", async () => {
    const screen = await render(
      <Slider label="Year" defaultValue={[25, 75]} step={25} showSteps />
    );
    const filled = [
      ...screen.container.querySelectorAll("[data-tds='slider-tick']")
    ].map((tick) => tick.hasAttribute("data-tds-filled"));

    expect(filled).toEqual([false, true, true, true, false]);
  });

  it("has no ticks unless asked", async () => {
    const screen = await render(
      <Slider label="Opacity" defaultValue={50} step={25} />
    );

    expect(
      screen.container.querySelector("[data-tds='slider-tick']")
    ).toBeNull();
  });

  it("labels marked values in the slider's format", async () => {
    const screen = await render(
      <Slider
        label="Opacity"
        defaultValue={0.5}
        maxValue={1}
        step={0.1}
        formatOptions={{ style: "percent" }}
        marks={[0.2, 0.5, 0.8]}
      />
    );

    await expect.element(screen.getByText("20%")).toBeVisible();
    await expect.element(screen.getByText("80%")).toBeVisible();
  });

  it("uses a mark's own label when it has one", async () => {
    const screen = await render(
      <Slider
        label="Zoom"
        defaultValue={5}
        maxValue={10}
        marks={[
          { value: 0, label: "World" },
          { value: 10, label: "Street" }
        ]}
      />
    );

    await expect.element(screen.getByText("Street")).toBeVisible();
  });

  it("centres a mark under the thumb at the same value", async () => {
    const screen = await render(
      <Slider
        label="Opacity"
        defaultValue={30}
        marks={[30]}
        showValue={false}
      />
    );
    const centre = (element: Element | null | undefined): number => {
      const rect = element?.getBoundingClientRect();
      return (rect?.left ?? 0) + (rect?.width ?? 0) / 2;
    };
    const thumb = screen
      .getByRole("slider")
      .element()
      .closest("[data-tds='slider-thumb']");
    const mark = screen.getByText("30", { exact: true }).element();

    expect(Math.abs(centre(mark) - centre(thumb))).toBeLessThan(1);
  });

  it("shows the thumb's value in a tooltip while it has keyboard focus", async () => {
    const screen = await render(
      <Slider
        label="Opacity"
        defaultValue={30}
        step={10}
        showValue={false}
        showTooltip
      />
    );

    await userEvent.tab();
    await expect.element(screen.getByRole("tooltip")).toHaveTextContent("30");

    await userEvent.keyboard("{ArrowRight}");
    await expect.element(screen.getByRole("tooltip")).toHaveTextContent("40");
  });

  it("shows a tooltip for each thumb of a range", async () => {
    const screen = await render(
      <Slider label="Year" defaultValue={[20, 80]} showTooltip />
    );

    await userEvent.tab();
    await expect.element(screen.getByRole("tooltip")).toHaveTextContent("20");

    await userEvent.tab();
    await expect.element(screen.getByRole("tooltip")).toHaveTextContent("80");
  });

  it("renders each thumb's tooltip from a function of its index and value", async () => {
    const screen = await render(
      <Slider
        label="Year"
        defaultValue={[20, 80]}
        showTooltip={({ index, value }) =>
          `${index === 0 ? "From" : "To"} ${String(value)}`
        }
      />
    );

    await userEvent.tab();
    await expect
      .element(screen.getByRole("tooltip"))
      .toHaveTextContent("From 20");

    await userEvent.tab();
    await expect
      .element(screen.getByRole("tooltip"))
      .toHaveTextContent("To 80");
  });

  it("has no tooltip unless asked", async () => {
    const screen = await render(<Slider label="Opacity" defaultValue={30} />);

    await userEvent.tab();

    await expect.element(screen.getByRole("tooltip")).not.toBeInTheDocument();
  });

  it("hides its value when asked", async () => {
    const screen = await render(
      <Slider label="Opacity" defaultValue={30} showValue={false} />
    );

    expect(screen.container.querySelector("output")).toBeNull();
  });

  it("can't be moved while disabled", async () => {
    const screen = await render(
      <Slider label="Opacity" defaultValue={30} isDisabled />
    );

    await expect
      .element(screen.getByRole("slider", { name: "Opacity" }))
      .toBeDisabled();
  });

  // Centred labels at the ends would hang off the slider: they line up with
  // its edges instead
  it("keeps labels at the minimum and maximum inside the slider", async () => {
    const screen = await render(
      <div style={{ inlineSize: 240 }}>
        <Slider
          label="Map quality"
          minValue={1}
          maxValue={3}
          defaultValue={2}
          marks={[
            { value: 1, label: "Quality" },
            { value: 3, label: "Performance" }
          ]}
        />
      </div>
    );
    const slider = screen
      .getByRole("slider")
      .element()
      .closest("[data-tds='slider']")
      ?.getBoundingClientRect();
    const first = screen.getByText("Quality").element().getBoundingClientRect();
    const last = screen
      .getByText("Performance")
      .element()
      .getBoundingClientRect();

    expect(first.left).toBeGreaterThanOrEqual(slider?.left ?? Infinity);
    expect(last.right).toBeLessThanOrEqual(slider?.right ?? -Infinity);
  });
});

describe("SliderPrimitive", () => {
  const renderFromCentre = (value: number): ReturnType<typeof render> =>
    render(
      <SliderPrimitive
        aria-label="Exaggeration"
        value={value}
        minValue={-50}
        maxValue={50}
        step={10}
      >
        <SliderPrimitive.Track>
          <SliderPrimitive.Fill offset={0} />
          <SliderPrimitive.Ticks fillOffset={0} />
          <SliderPrimitive.Thumb />
        </SliderPrimitive.Track>
      </SliderPrimitive>
    );
  const fill = (screen: Awaited<ReturnType<typeof render>>): Element | null =>
    screen.container.querySelector("[data-tds='slider-fill']");

  it("fills the track's ends only when the fill reaches them", async () => {
    const screen = await renderFromCentre(20);

    expect(fill(screen)?.hasAttribute("data-tds-fill-start")).toBe(false);
    expect(fill(screen)?.hasAttribute("data-tds-fill-end")).toBe(false);

    await screen.rerender(
      <SliderPrimitive
        aria-label="Exaggeration"
        value={-50}
        minValue={-50}
        maxValue={50}
      >
        <SliderPrimitive.Track>
          <SliderPrimitive.Fill offset={0} />
          <SliderPrimitive.Thumb />
        </SliderPrimitive.Track>
      </SliderPrimitive>
    );

    expect(fill(screen)?.hasAttribute("data-tds-fill-start")).toBe(true);
  });

  it("lightens only the ticks between the offset and the thumb", async () => {
    const screen = await renderFromCentre(20);
    const filled = [
      ...screen.container.querySelectorAll("[data-tds='slider-tick']")
    ].map((tick) => tick.hasAttribute("data-tds-filled"));

    // -50 … 50 by 10: filled from 0 to 20
    expect(filled).toEqual([
      false,
      false,
      false,
      false,
      false,
      true,
      true,
      true,
      false,
      false,
      false
    ]);
  });

  it("formats its output with a custom render", async () => {
    const screen = await render(
      <SliderPrimitive defaultValue={30}>
        <Label>Opacity</Label>
        <SliderPrimitive.Output>
          {({ state }) => `${String(state.values[0])} percent`}
        </SliderPrimitive.Output>
        <SliderPrimitive.Track>
          <SliderPrimitive.Fill />
          <SliderPrimitive.Thumb />
        </SliderPrimitive.Track>
      </SliderPrimitive>
    );

    await expect
      .element(screen.getByRole("status"))
      .toHaveTextContent("30 percent");
  });
});
