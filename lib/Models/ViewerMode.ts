import { runInAction } from "mobx";
import TerriaViewer from "../ViewModels/TerriaViewer";

enum ViewerMode {
  Cesium = "cesium",
  Leaflet = "leaflet"
}

export const MapViewers = Object.seal({
  "3d": {
    viewerMode: ViewerMode.Cesium,
    terrain: true,
    label: "settingPanel.viewerModeLabels.CesiumTerrain",
    available: true
  },
  "3dsmooth": {
    viewerMode: ViewerMode.Cesium,
    terrain: false,
    label: "settingPanel.viewerModeLabels.CesiumEllipsoid",
    available: true
  },
  "2d": {
    viewerMode: ViewerMode.Leaflet,
    terrain: false,
    label: "settingPanel.viewerModeLabels.Leaflet",
    available: true
  }
});

export const isViewerMode = (mode: string): mode is keyof typeof MapViewers =>
  mode in MapViewers;

export function setViewerMode(
  viewerMode: keyof typeof MapViewers,
  viewer: TerriaViewer
): void {
  runInAction(() => {
    if (viewerMode === "3d" || viewerMode === "3dsmooth") {
      viewer.viewerMode = ViewerMode.Cesium;
      viewer.viewerOptions.useTerrain = viewerMode === "3d";
    } else if (viewerMode === "2d") {
      viewer.viewerMode = ViewerMode.Leaflet;
    } else {
      console.error(
        `Trying to select ViewerMode ${viewerMode} that doesn't exist`
      );
    }
  });
}

/**
 * Returns the viewer type for the given viewer mode
 *
 * @param viewerMode 3d, 3dsmooth or 2d
 */
export function getViewerType(viewerMode: string): ViewerMode | undefined {
  // Note:
  // There is small naming ambiguity here
  // ViewerMode can either mean Leaflet|Cesium|NoViewer or 3d|3dsmooth|2d
  // The 3d|2d sense of viewermode is used in APIs, for eg to set preference in localStorage
  // So I think we should rename Leaflet|Cesium... as viewerType instead!
  if (isViewerMode(viewerMode)) {
    return MapViewers[viewerMode].viewerMode;
  }
}

export default ViewerMode;
