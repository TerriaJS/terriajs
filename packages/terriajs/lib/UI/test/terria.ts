import { expect } from "vitest";
import Terria from "../../Models/Terria";
import { setViewerMode } from "../../Models/ViewerMode";
import ViewState from "../../ReactViewModels/ViewState";

/**
 * A real Terria and ViewState, with the 2D map by default: the 3D globe needs
 * WebGL. The globe is the smooth one, without world terrain, which needs the
 * network and a Cesium ion token that tests don't have
 */
export const createTerria = (
  mode: "2d" | "3d" = "2d"
): { terria: Terria; viewState: ViewState } => {
  // Cesium's workers and assets, as vitest.config.mts serves them
  const terria = new Terria({ baseUrl: "./", cesiumBaseUrl: "/cesium/" });
  setViewerMode(mode === "3d" ? "3dsmooth" : mode, terria.mainViewer);
  return { terria, viewState: new ViewState({ terria }) };
};

/**
 * Waits for the chosen map to be drawn. Until the map attaches, terria's
 * viewer is a placeholder, and the chosen one replaces it after: spy on the
 * viewer, or look for the map's layers, only once this resolves
 */
export const waitForMap = async (terria: Terria): Promise<void> => {
  await expect
    .poll(() => terria.currentViewer.type.toLowerCase())
    .toBe(terria.mainViewer.viewerMode);
};
