// cdp() is typed by the Playwright provider the tests run in
/// <reference types="@vitest/browser-playwright" />
import { describe, expect, it, onTestFinished } from "vitest";
import { render } from "vitest-browser-react";
import { cdp } from "vitest/browser";
import { Separator } from "..";

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

describe("Separator", () => {
  it("is a separator", async () => {
    const screen = await render(<Separator />);

    await expect.element(screen.getByRole("separator")).toBeInTheDocument();
  });

  it("shows against the page in forced-colors mode", async () => {
    await inForcedColors();
    const screen = await render(
      <>
        <div data-testid="page" style={{ backgroundColor: "Canvas" }} />
        <Separator />
      </>
    );

    await expect
      .poll(() => background(screen.getByRole("separator").element()))
      .not.toBe(background(screen.getByTestId("page").element()));
  });
});
