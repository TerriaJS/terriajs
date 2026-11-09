// cdp() is typed by the Playwright provider the tests run in
/// <reference types="@vitest/browser-playwright" />
import { describe, expect, it, onTestFinished } from "vitest";
import { cdp } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Label } from "../../Field";
import { Meter, type MeterProps } from "..";

const storage = (props: Partial<MeterProps> = {}): ReturnType<typeof render> =>
  render(
    <Meter value={60} {...props}>
      <Label>Storage</Label>
      <Meter.Output />
      <Meter.Track>
        <Meter.Fill />
      </Meter.Track>
    </Meter>
  );

// Forced-colors mode (Windows High Contrast) replaces background colours with
// the page's, which would leave nothing to see
const inForcedColors = async (): Promise<void> => {
  const session = cdp();
  await session.send("Emulation.setEmulatedMedia", {
    features: [{ name: "forced-colors", value: "active" }]
  });
  onTestFinished(async () => {
    await session.send("Emulation.setEmulatedMedia", { features: [] });
  });
};

const background = (element: Element | null): string =>
  element ? getComputedStyle(element).backgroundColor : "";

describe("Meter", () => {
  it("shows its fill against its track in forced-colors mode", async () => {
    await inForcedColors();
    const screen = await storage();
    const track = screen.container.querySelector('[data-tds="meter-track"]');
    const fill = screen.container.querySelector('[data-tds="meter-fill"]');

    await expect.poll(() => background(fill)).not.toBe(background(track));
  });

  it("is a meter named by its label, showing its value", async () => {
    const screen = await storage();
    const meter = screen.getByRole("meter", { name: "Storage" });

    await expect.element(meter).toHaveAttribute("aria-valuenow", "60");
    await expect.element(meter.getByText("60%")).toBeVisible();
  });

  it("fills its track in proportion to its value", async () => {
    const screen = await storage({ value: 25 });
    const meter = screen.getByRole("meter").element();
    const track = meter.querySelector("[data-tds='meter-track']");
    const fill = meter.querySelector("[data-tds='meter-fill']");

    expect(track && fill).toBeTruthy();
    await expect
      .poll(
        () =>
          (fill?.getBoundingClientRect().width ?? 0) /
          (track?.getBoundingClientRect().width ?? 1)
      )
      .toBeCloseTo(0.25, 2);
  });

  it("shows its value in its own words", async () => {
    const screen = await storage({
      value: 6.2,
      maxValue: 10,
      valueLabel: "6.2 of 10 GB"
    });

    await expect
      .element(screen.getByRole("meter").getByText("6.2 of 10 GB"))
      .toBeVisible();
  });

  it("is accented and medium by default", async () => {
    const screen = await storage();
    const meter = screen.getByRole("meter");

    await expect.element(meter).toHaveAttribute("data-tds-color", "accent");
    await expect.element(meter).toHaveAttribute("data-tds-size", "md");
  });
});
