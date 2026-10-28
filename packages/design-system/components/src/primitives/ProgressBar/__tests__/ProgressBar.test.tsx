import { describe, expect, it } from "vitest";
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

describe("ProgressBar", () => {
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
