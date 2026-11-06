import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { createTerria } from "../../test/terria";
import { UserInterface } from "../UserInterface";

describe("UserInterface", () => {
  it("shows the map, in the shell's map region", async () => {
    const { terria, viewState } = createTerria();
    const screen = await render(
      <UserInterface terria={terria} viewState={viewState} />
    );

    const map = screen.getByRole("main");
    await expect.element(map).toBeInTheDocument();
    expect(terria.mainViewer.attached).toBe(true);
    expect(map.element().contains(terria.mainViewer.mapContainer as Node)).toBe(
      true
    );

    await screen.unmount();
    expect(terria.mainViewer.attached).toBe(false);
  });

  it("is styled by the design system", async () => {
    const { terria, viewState } = createTerria();
    await render(<UserInterface terria={terria} viewState={viewState} />);

    // Its tokens are defined on the root
    expect(
      getComputedStyle(document.documentElement)
        .getPropertyValue("--terria-ds-text-foreground")
        .trim()
    ).not.toBe("");
  });
});
