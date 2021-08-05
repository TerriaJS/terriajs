import CesiumMath from "terriajs-cesium/Source/Core/Math";
import defined from "terriajs-cesium/Source/Core/defined";
import ViewerMode from "../../../Models/ViewerMode";
import CameraView from "../../../Models/CameraView";
import runLater from "../../../Core/runLater";

export const captureCurrentView = viewState => {
  // Based on BuildShareLink.js

  const { terria } = viewState;

  const cameraExtent = terria.currentViewer.getCurrentExtent();

  // Add an init source with the camera position.
  const initialCamera = {
    west: CesiumMath.toDegrees(cameraExtent.west),
    south: CesiumMath.toDegrees(cameraExtent.south),
    east: CesiumMath.toDegrees(cameraExtent.east),
    north: CesiumMath.toDegrees(cameraExtent.north)
  };

  if (defined(terria.cesium)) {
    const cesiumCamera = terria.cesium.scene.camera;
    initialCamera.position = cesiumCamera.positionWC;
    initialCamera.direction = cesiumCamera.directionWC;
    initialCamera.up = cesiumCamera.upWC;
  }

  const homeCamera = {
    west: CesiumMath.toDegrees(terria.homeView.rectangle.west),
    south: CesiumMath.toDegrees(terria.homeView.rectangle.south),
    east: CesiumMath.toDegrees(terria.homeView.rectangle.east),
    north: CesiumMath.toDegrees(terria.homeView.rectangle.north),
    position: terria.homeView.position,
    direction: terria.homeView.direction,
    up: terria.homeView.up
  };

  const time = {
    dayNumber: terria.clock.currentTime.dayNumber,
    secondsOfDay: terria.clock.currentTime.secondsOfDay
  };

  let viewerMode;
  switch (terria.viewerMode) {
    case ViewerMode.CesiumTerrain:
      viewerMode = "3d";
      break;
    case ViewerMode.CesiumEllipsoid:
      viewerMode = "3dSmooth";
      break;
    case ViewerMode.Leaflet:
      viewerMode = "2d";
      break;
    case ViewerMode.Cesium2D:
      viewerMode = "2dcesium";
      break;
  }

  const terriaSettings = {
    initialCamera: initialCamera,
    homeCamera: homeCamera,
    baseMapName: terria.baseMap.name,
    viewerMode: viewerMode,
    currentTime: time
  };

  if (defined(terria.showSplitter)) {
    terriaSettings.showSplitter = terria.showSplitter;
    terriaSettings.splitPosition = terria.splitPosition;
  }

  return terriaSettings;
};

export const moveToSavedView = (viewState, initSource) => {
  // Based on Terria.addInitSource()
  console.log("move to", initSource);

  const fromStory = true;
  const { terria } = viewState;

  let viewerChangeListener;
  function zoomToInitialView() {
    terria.currentViewer.zoomTo(terria.initialView, 1.0);
    if (defined(viewerChangeListener)) {
      viewerChangeListener();
    }
  }

  if (defined(initSource.splitPosition)) {
    terria.splitPosition = initSource.splitPosition;
  }

  if (defined(initSource.showSplitter)) {
    // If you try to show the splitter straight away, the browser hangs.
    runLater(function() {
      terria.showSplitter = initSource.showSplitter;
    });
  }
  if (fromStory === true) {
    viewerChangeListener = terria.afterViewerChanged.addEventListener(
      zoomToInitialView
    );
  }

  if (defined(initSource.viewerMode) && !defined(terria.userProperties.map)) {
    const desiredMode = (initSource.viewerMode || "").toLowerCase();

    if (desiredMode === "2d") {
      // if (fromStory && terria.viewerMode === ViewerMode.Leaflet) {
      //   return;
      // }
      terria.viewerMode = ViewerMode.Leaflet;
    } else if (desiredMode === "3d") {
      // if (fromStory && terria.viewerMode === ViewerMode.CesiumTerrain) {
      //   return;
      // }
      terria.viewerMode = ViewerMode.CesiumTerrain;
    } else if (desiredMode === "3dsmooth") {
      // if (fromStory && terria.viewerMode === ViewerMode.CesiumEllipsoid) {
      //   return;
      // }
      terria.viewerMode = ViewerMode.CesiumEllipsoid;
    } else if (desiredMode === "2dcesium") {
      // if (fromStory && terria.viewerMode === ViewerMode.Cesium2D) {
      //   return;
      // }
      terria.viewerMode = ViewerMode.Cesium2D;
    }
  }

  // The last init source to specify an initial/home camera view wins.
  if (defined(initSource.homeCamera)) {
    terria.homeView = CameraView.fromJson(initSource.homeCamera);
  }

  if (defined(initSource.initialCamera)) {
    terria.initialView = CameraView.fromJson(initSource.initialCamera);
  }

  if (!defined(initSource.timeline) && defined(initSource.currentTime)) {
    // If the time is supplied we want to freeze the display at the specified time and not auto playing.
    terria.autoPlay = false;

    const time = initSource.currentTime;
    terria.clock.currentTime.dayNumber = parseInt(time.dayNumber, 10);
    terria.clock.currentTime.secondsOfDay = parseInt(time.secondsOfDay, 10);
  }

  if (defined(initSource.timeline)) {
    terria.clock.shouldAnimate = initSource.timeline.shouldAnimate;
    terria.clock.multiplier = initSource.timeline.multiplier;
    const time = initSource.timeline.currentTime;
    terria.clock.currentTime.dayNumber = parseInt(time.dayNumber, 10);
    terria.clock.currentTime.secondsOfDay = parseInt(time.secondsOfDay, 10);
  }

  terria.currentViewer.zoomTo(terria.initialView.rectangle, 1.0);
};
