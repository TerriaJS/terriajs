// cdp() is typed by the Playwright provider the tests run in
/// <reference types="@vitest/browser-playwright" />
import { describe, expect, it, onTestFinished } from "vitest";
import { cdp } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Label } from "../../Field";
import { ProgressBar, type ProgressBarProps } from "..";

const renderStorage = (
  props: Partial<ProgressBarProps> = {}
): ReturnType<typeof render> =>
  render(
    <ProgressBar value={60} {...props}>
      <Label>Storage</Label>
      <ProgressBar.Output />
      <ProgressBar.Track>
        <ProgressBar.Fill />
      </ProgressBar.Track>
    </ProgressBar>
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

describe("ProgressBar", () => {
  it("shows its fill against its track in forced-colors mode", async () => {
    await inForcedColors();
    const screen = await renderStorage({ value: 60 });
    const track = screen.container.querySelector(
      '[data-tds="progress-bar-track"]'
    );
    const fill = screen.container.querySelector(
      '[data-tds="progress-bar-fill"]'
    );

    await expect.poll(() => background(fill)).not.toBe(background(track));
  });

  it("is a progress bar named by its label, showing its value", async () => {
    const screen = await renderStorage();
    const bar = screen.getByRole("progressbar", { name: "Storage" });

    await expect.element(bar).toHaveAttribute("aria-valuenow", "60");
    await expect.element(bar.getByText("60%")).toBeVisible();
  });

  it("fills its track in proportion to its value", async () => {
    const screen = await renderStorage({ value: 25 });
    const bar = screen.getByRole("progressbar").element();
    const track = bar.querySelector("[data-tds='progress-bar-track']");
    const fill = bar.querySelector("[data-tds='progress-bar-fill']");

    expect(track && fill).toBeTruthy();
    await expect
      .poll(
        () =>
          (fill?.getBoundingClientRect().width ?? 0) /
          (track?.getBoundingClientRect().width ?? 1)
      )
      .toBeCloseTo(0.25, 2);
  });

  it("shows no value while indeterminate", async () => {
    const screen = await renderStorage({ isIndeterminate: true });
    const bar = screen.getByRole("progressbar", { name: "Storage" });

    await expect.element(bar).not.toHaveAttribute("aria-valuenow");
    expect(bar.element().textContent).toBe("Storage");
  });
});
