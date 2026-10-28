import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

const surface = (element: Element): string =>
  getComputedStyle(element).getPropertyValue("--terria-ds-surface-bg");

describe("themes", () => {
  it("switches a region inside a dark page back to the light theme", async () => {
    const screen = await render(
      <div data-theme="dark">
        <span>Dark</span>
        <div data-theme="light">
          <span>Light</span>
        </div>
      </div>
    );

    const light = screen.getByText("Light").element();
    const dark = screen.getByText("Dark").element();
    expect(surface(light)).toBe(surface(document.documentElement));
    expect(surface(light)).not.toBe(surface(dark));
  });

  it("gives a light region light native controls and scrollbars", async () => {
    const screen = await render(
      <div data-theme="dark">
        <div data-theme="light">
          <span>Light</span>
        </div>
      </div>
    );

    const region = screen.getByText("Light").element().parentElement;
    expect(region && getComputedStyle(region).colorScheme).toBe("light");
  });
});
