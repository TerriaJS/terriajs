import { runInAction } from "mobx";
import TerriaViewer from "../ViewModels/TerriaViewer";
import SceneMode from "terriajs-cesium/Source/Scene/SceneMode";

enum ViewerMode {
  Cesium = "cesium",
  Cesium2D = "cesium2d",
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
  "2dcesium": {
    viewerMode: ViewerMode.Cesium2D,
    terrain: false,
    label: "settingPanel.viewerModeLabels.Cesium2D",
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
      if (viewer.terria.cesium) {
        viewer.terria.cesium.scene.mode =
          viewerMode === "3d" ? SceneMode.SCENE3D : SceneMode.COLUMBUS_VIEW;
      }
    } else if (viewerMode === "2dcesium") {
      viewer.viewerMode = ViewerMode.Cesium2D;
      viewer.viewerOptions.useTerrain = false;
      if (viewer.terria.cesium) {
        viewer.terria.cesium.scene.mode = SceneMode.SCENE2D;
      }
    } else if (viewerMode === "2d") {
      viewer.viewerMode = ViewerMode.Leaflet;
    } else {
      console.error(
        `Trying to select ViewerMode ${viewerMode} that doesn't exist`
      );
    }
  });
}

export default ViewerMode;
