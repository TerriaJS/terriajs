"use strict";

import DragPoints from "../../lib/Map/DragPoints/DragPoints";
import Terria from "../../lib/Models/Terria";
import ViewerMode from "../../lib/Models/ViewerMode";
import Entity from "terriajs-cesium/Source/DataSources/Entity.js";

describe("DragPoints", function () {
  var terria;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
  });

  it("will change helper to right type if viewerMode changes to Leaflet", function () {
    terria.viewerMode = ViewerMode.CesiumTerrain;
    var dragPointsHelper = new DragPoints(terria);
    expect(dragPointsHelper._dragPointsHelper.type).toEqual("Cesium");
    terria.viewerMode = ViewerMode.Leaflet;
    terria.mainViewer.afterViewerChanged.raiseEvent();
    expect(dragPointsHelper._dragPointsHelper.type).toEqual("Leaflet");
  });

  it("will change helper to right type if viewerMode changes to Cesium", function () {
    terria.viewerMode = ViewerMode.Leaflet;
    var dragPointsHelper = new DragPoints(terria);
    expect(dragPointsHelper._dragPointsHelper.type).toEqual("Leaflet");
    terria.viewerMode = ViewerMode.CesiumTerrain;
    terria.mainViewer.afterViewerChanged.raiseEvent();
    expect(dragPointsHelper._dragPointsHelper.type).toEqual("Cesium");
  });

  it("will inform new helper about existing entities if helper is changed to Leaflet", function () {
    var entityArray = [
      new Entity({ name: "first test entity" }),
      new Entity({ name: "second test entity" })
    ];
    terria.viewerMode = ViewerMode.CesiumTerrain;

    var dragPointsHelper = new DragPoints(terria);
    dragPointsHelper.updateDraggableObjects(entityArray);
    expect(dragPointsHelper._dragPointsHelper._draggableObjects).toBe(
      entityArray
    );

    terria.viewerMode = ViewerMode.Leaflet;
    // Same as before, but dragPointsHelper is now new.
    expect(dragPointsHelper._dragPointsHelper._draggableObjects).toBe(
      entityArray
    );
  });

  it("will inform new helper about existing entities if helper is changed to Cesium", function () {
    var entityArray = [
      new Entity({ name: "first test entity" }),
      new Entity({ name: "second test entity" })
    ];
    terria.viewerMode = ViewerMode.Leaflet;

    var dragPointsHelper = new DragPoints(terria);
    dragPointsHelper.updateDraggableObjects(entityArray);
    expect(dragPointsHelper._dragPointsHelper._draggableObjects).toBe(
      entityArray
    );

    terria.viewerMode = ViewerMode.CesiumTerrain;
    // Same as before, but dragPointsHelper is now new.
    expect(dragPointsHelper._dragPointsHelper._draggableObjects).toBe(
      entityArray
    );
  });
});
