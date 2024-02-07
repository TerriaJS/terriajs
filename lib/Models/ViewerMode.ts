import { runInAction } from "mobx";
import TerriaViewer from "../ViewModels/TerriaViewer";
import Cesium from "./Cesium";

enum ViewerMode {
  Cesium = "cesium",
  Cesium2D = "cesium2D",
  LeafletDeprecated = "leaflet"
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
    viewerMode: ViewerMode.Cesium2D,
    terrain: false,
    label: "settingPanel.viewerModeLabels.Leaflet",
    available: true
  },
  "2d-deprecated": {
    viewerMode: ViewerMode.LeafletDeprecated,
    terrain: false,
    label: "settingPanel.viewerModeLabels.Leaflet",
    available: false
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
      if (viewer.currentViewer instanceof Cesium) {
        viewer.currentViewer.scene.morphTo3D(0);
      }
    } else if (viewerMode === "2d") {
      viewer.viewerMode = ViewerMode.Cesium2D;
      viewer.viewerOptions.useTerrain = false;
      if (viewer.currentViewer instanceof Cesium) {
        viewer.currentViewer.scene.morphTo2D(0);
      }
    } else if (viewerMode === "2d-deprecated") {
      viewer.viewerMode = ViewerMode.LeafletDeprecated;
    } else {
      console.error(
        `Trying to select ViewerMode ${viewerMode} that doesn't exist`
      );
    }
  });
}

export default ViewerMode;
