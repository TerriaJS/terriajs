"use strict";

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

export default ViewerMode;
