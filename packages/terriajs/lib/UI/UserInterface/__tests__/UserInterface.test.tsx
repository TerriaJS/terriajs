import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import Terria from "../../../Models/Terria";
import { setViewerMode } from "../../../Models/ViewerMode";
import ViewState from "../../../ReactViewModels/ViewState";
import { UserInterface } from "../UserInterface";

// A real Terria and ViewState, with the 2D map: the 3D globe needs WebGL
const app = (): { terria: Terria; viewState: ViewState } => {
  const terria = new Terria({ baseUrl: "./" });
  setViewerMode("2d", terria.mainViewer);
  return { terria, viewState: new ViewState({ terria }) };
};

describe("UserInterface", () => {
  it("shows the map, in the shell's map region", async () => {
    const { terria, viewState } = app();
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
    const { terria, viewState } = app();
    await render(<UserInterface terria={terria} viewState={viewState} />);

    // Its tokens are defined on the root
    expect(
      getComputedStyle(document.documentElement)
        .getPropertyValue("--terria-ds-text-foreground")
        .trim()
    ).not.toBe("");
  });
});
