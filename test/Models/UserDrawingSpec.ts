import i18next from "i18next";
import { runInAction } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import pollToPromise from "../../lib/Core/pollToPromise";
import supportsWebGL from "../../lib/Core/supportsWebGL";
import PickedFeatures from "../../lib/Map/PickedFeatures/PickedFeatures";
import Terria from "../../lib/Models/Terria";
import UserDrawing from "../../lib/Models/UserDrawing";
import TerriaFeature from "../../lib/Models/Feature/Feature";

const describeIfSupported = supportsWebGL() ? describe : xdescribe;

describeIfSupported("UserDrawing that requires WebGL", function () {
  it("changes cursor to crosshair when entering drawing mode", function (done) {
    const terria = new Terria();
    const container = document.createElement("div");
    document.body.appendChild(container);
    terria.mainViewer.attach(container);

    const userDrawing = new UserDrawing({ terria });
    pollToPromise(() => {
      return userDrawing.terria.cesium !== undefined;
    })
      .then(() => {
        const cesium = userDrawing.terria.cesium;
        expect(cesium).toBeDefined();
        if (cesium) {
          expect(cesium.cesiumWidget.canvas.style.cursor).toEqual("");
          userDrawing.enterDrawMode();
          expect(cesium.cesiumWidget.canvas.style.cursor).toEqual("crosshair");
          (<any>userDrawing).cleanUp();
          expect(cesium.cesiumWidget.canvas.style.cursor).toEqual("auto");
        }
      })
      .then(done)
      .catch(done.fail);
  });
});

describe("UserDrawing", function () {
  let terria: Terria;

  beforeEach(function () {
    terria = new Terria();
  });

  it("will use default options if options are not specified", function () {
    var options = { terria: terria };
    var userDrawing = new UserDrawing(options);

    expect(userDrawing.getDialogMessage()).toEqual(
      `<div><strong>${i18next.t(
        "models.userDrawing.messageHeader"
      )}</strong></br><i>${i18next.t(
        "models.userDrawing.clickToAddFirstPoint"
      )}</i></div>`
    );
  });

  it("getDialogMessage contains callback message if callback is specified", function () {
    var options = {
      terria: terria,
      onMakeDialogMessage: function () {
        return "HELLO";
      }
    };
    var userDrawing = new UserDrawing(options);

    expect(userDrawing.getDialogMessage()).toEqual(
      `<div><strong>${i18next.t(
        "models.userDrawing.messageHeader"
      )}</strong></br>HELLO</br><i>${i18next.t(
        "models.userDrawing.clickToAddFirstPoint"
      )}</i></div>`
    );
  });

  it("listens for user picks on map after entering drawing mode", function () {
    var userDrawing = new UserDrawing({ terria });
    expect(userDrawing.terria.mapInteractionModeStack.length).toEqual(0);
    userDrawing.enterDrawMode();
    expect(userDrawing.terria.mapInteractionModeStack.length).toEqual(1);
  });

  it("disables feature info requests when in drawing mode", function () {
    var options = { terria: terria };
    var userDrawing = new UserDrawing(options);
    expect(userDrawing.terria.allowFeatureInfoRequests).toEqual(true);
    userDrawing.enterDrawMode();
    expect(userDrawing.terria.allowFeatureInfoRequests).toEqual(false);
  });

  it("re-enables feature info requests on cleanup", function () {
    var options = { terria: terria };
    var userDrawing = new UserDrawing(options);
    userDrawing.enterDrawMode();
    expect(userDrawing.terria.allowFeatureInfoRequests).toEqual(false);
    userDrawing.cleanUp();
    expect(userDrawing.terria.allowFeatureInfoRequests).toEqual(true);
  });

  it("ensures onPointClicked callback is called when point is picked by user", function () {
    const onPointClicked = jasmine.createSpy();
    const userDrawing = new UserDrawing({ terria, onPointClicked });
    userDrawing.enterDrawMode();
    const pickedFeatures = new PickedFeatures();
    // Auckland, in case you're wondering
    pickedFeatures.pickPosition = new Cartesian3(
      -5088454.576893678,
      465233.10329933715,
      -3804299.6786334896
    );
    runInAction(() => {
      userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
        pickedFeatures;
    });
    const pointEntities = onPointClicked.calls.mostRecent().args[0];
    expect(pointEntities.entities.values.length).toEqual(1);
  });

  it("ensures graphics are added when point is picked by user", async function () {
    const userDrawing = new UserDrawing({ terria });
    expect(userDrawing.pointEntities.entities.values.length).toEqual(0);
    expect(userDrawing.otherEntities.entities.values.length).toEqual(0);
    userDrawing.enterDrawMode();
    const pickedFeatures = new PickedFeatures();
    // Auckland, in case you're wondering
    pickedFeatures.pickPosition = new Cartesian3(
      -5088454.576893678,
      465233.10329933715,
      -3804299.6786334896
    );
    runInAction(() => {
      userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
        pickedFeatures;
    });
    expect(userDrawing.pointEntities.entities.values.length).toEqual(1);
    expect(userDrawing.otherEntities.entities.values.length).toEqual(1);
  });

  it("ensures graphics are updated when points change", function () {
    const options = { terria: terria };
    const userDrawing = new UserDrawing(options);
    expect(userDrawing.pointEntities.entities.values.length).toEqual(0);
    expect(userDrawing.otherEntities.entities.values.length).toEqual(0);

    userDrawing.enterDrawMode();
    const pickedFeatures = new PickedFeatures();
    // Auckland, in case you're wondering
    const x = -5088454.576893678;
    const y = 465233.10329933715;
    const z = -3804299.6786334896;

    pickedFeatures.pickPosition = new Cartesian3(x, y, z);
    runInAction(() => {
      userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
        pickedFeatures;
    });

    // Check point
    const currentPoint = userDrawing.pointEntities.entities.values[0];
    expect(currentPoint.position).toBeDefined();

    if (currentPoint.position !== undefined) {
      let currentPointPos = currentPoint.position.getValue(
        terria.timelineClock.currentTime
      );
      expect(currentPointPos.x).toEqual(x);
      expect(currentPointPos.y).toEqual(y);
      expect(currentPointPos.z).toEqual(z);
    }

    // Check line as well
    let lineEntity = userDrawing.otherEntities.entities.values[0];
    expect(lineEntity.polyline).toBeDefined();

    if (lineEntity.polyline !== undefined) {
      expect(lineEntity.polyline.positions).toBeDefined();
      if (lineEntity.polyline.positions !== undefined) {
        let currentPointPos = lineEntity.polyline.positions.getValue(
          terria.timelineClock.currentTime
        )[0];
        expect(currentPointPos.x).toEqual(x);
        expect(currentPointPos.y).toEqual(y);
        expect(currentPointPos.z).toEqual(z);
      }
    }

    // Okay, now change points. LA.
    const newPickedFeatures = new PickedFeatures();
    const newX = -2503231.890682526;
    const newY = -4660863.528418564;
    const newZ = 3551306.84427321;
    newPickedFeatures.pickPosition = new Cartesian3(newX, newY, newZ);
    runInAction(() => {
      userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
        newPickedFeatures;
    });

    // Check point
    const newPoint = userDrawing.pointEntities.entities.values[1];
    expect(newPoint.position).toBeDefined();

    if (newPoint.position !== undefined) {
      let newPointPos = newPoint.position.getValue(
        terria.timelineClock.currentTime
      );
      expect(newPointPos.x).toEqual(newX);
      expect(newPointPos.y).toEqual(newY);
      expect(newPointPos.z).toEqual(newZ);
    }

    // Check line as well
    lineEntity = userDrawing.otherEntities.entities.values[0];
    expect(lineEntity.polyline).toBeDefined();

    if (lineEntity.polyline !== undefined) {
      expect(lineEntity.polyline.positions).toBeDefined();
      if (lineEntity.polyline.positions !== undefined) {
        let newPointPos = lineEntity.polyline.positions.getValue(
          terria.timelineClock.currentTime
        )[1];
        expect(newPointPos.x).toEqual(newX);
        expect(newPointPos.y).toEqual(newY);
        expect(newPointPos.z).toEqual(newZ);
      }
    }
  });

  it("returns correct button text for any given number of points on map", function () {
    const options = { terria: terria };
    const userDrawing = new UserDrawing(options);

    expect(userDrawing.getButtonText()).toEqual(
      i18next.t("models.userDrawing.btnCancel")
    );
    userDrawing.pointEntities.entities.values.push(new Entity());
    expect(userDrawing.getButtonText()).toEqual(
      i18next.t("models.userDrawing.btnCancel")
    );
    userDrawing.pointEntities.entities.values.push(new Entity());
    expect(userDrawing.getButtonText()).toEqual(
      i18next.t("models.userDrawing.btnDone")
    );
  });

  it("cleans up when cleanup is called", function () {
    const options = { terria: terria };
    const userDrawing = new UserDrawing(options);
    expect(userDrawing.pointEntities.entities.values.length).toEqual(0);
    expect(userDrawing.otherEntities.entities.values.length).toEqual(0);
    userDrawing.enterDrawMode();

    let pickedFeatures = new PickedFeatures();
    // Auckland, in case you're wondering
    pickedFeatures.pickPosition = new Cartesian3(
      -5088454.576893678,
      465233.10329933715,
      -3804299.6786334896
    );
    runInAction(() => {
      userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
        pickedFeatures;
    });

    expect(userDrawing.pointEntities.entities.values.length).toEqual(1);
    expect(userDrawing.otherEntities.entities.values.length).toEqual(1);

    (<any>userDrawing).cleanUp();
    expect(userDrawing.pointEntities.entities.values.length).toEqual(0);
    expect(userDrawing.otherEntities.entities.values.length).toEqual(0);
    expect((<any>userDrawing).inDrawMode).toBeFalsy();
    expect((<any>userDrawing).closeLoop).toBeFalsy();
  });

  it("ensures onCleanUp callback is called when clean up occurs", function () {
    const onCleanUp = jasmine.createSpy();
    const userDrawing = new UserDrawing({ terria, onCleanUp });
    userDrawing.enterDrawMode();
    expect(onCleanUp).not.toHaveBeenCalled();
    (<any>userDrawing).cleanUp();
    expect(onCleanUp).toHaveBeenCalled();
  });

  it("function clickedExistingPoint detects and handles if existing point is clicked", function () {
    const userDrawing = new UserDrawing({ terria });
    userDrawing.enterDrawMode();
    const pickedFeatures = new PickedFeatures();

    // First point
    // Points around Parliament house
    const pt1Position = new Cartographic(
      CesiumMath.toRadians(149.121),
      CesiumMath.toRadians(-35.309),
      CesiumMath.toRadians(0)
    );
    const pt1CartesianPosition =
      Ellipsoid.WGS84.cartographicToCartesian(pt1Position);
    pickedFeatures.pickPosition = pt1CartesianPosition;
    runInAction(() => {
      userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
        pickedFeatures;
    });

    // Second point
    const pt2Position = new Cartographic(
      CesiumMath.toRadians(149.124),
      CesiumMath.toRadians(-35.311),
      CesiumMath.toRadians(0)
    );
    const pt2CartesianPosition =
      Ellipsoid.WGS84.cartographicToCartesian(pt2Position);
    pickedFeatures.pickPosition = pt2CartesianPosition;
    runInAction(() => {
      userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
        pickedFeatures;
    });

    // Third point
    const pt3Position = new Cartographic(
      CesiumMath.toRadians(149.127),
      CesiumMath.toRadians(-35.308),
      CesiumMath.toRadians(0)
    );
    const pt3CartesianPosition =
      Ellipsoid.WGS84.cartographicToCartesian(pt3Position);
    pickedFeatures.pickPosition = pt3CartesianPosition;
    runInAction(() => {
      userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
        pickedFeatures;
    });
    expect((<any>userDrawing).closeLoop).toBeFalsy();

    // Now pick the first point
    pickedFeatures.pickPosition = pt1CartesianPosition;
    // If in the UI the user clicks on a point, it returns that entity, so we're pulling it out of userDrawing and
    // pretending the user actually clicked on it.
    const pt1Entity = userDrawing.pointEntities.entities.values[0];
    pickedFeatures.features = [pt1Entity as TerriaFeature];
    runInAction(() => {
      userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
        pickedFeatures;
    });

    expect((<any>userDrawing).closeLoop).toBeTruthy();
    expect(userDrawing.pointEntities.entities.values.length).toEqual(3);
  });

  it("loop does not close if polygon is not allowed", function () {
    const options = { terria: terria, allowPolygon: false };
    const userDrawing = new UserDrawing(options);
    userDrawing.enterDrawMode();
    const pickedFeatures = new PickedFeatures();

    // First point
    // Points around Parliament house
    const pt1Position = new Cartographic(
      CesiumMath.toRadians(149.121),
      CesiumMath.toRadians(-35.309),
      CesiumMath.toRadians(0)
    );
    const pt1CartesianPosition =
      Ellipsoid.WGS84.cartographicToCartesian(pt1Position);
    pickedFeatures.pickPosition = pt1CartesianPosition;
    runInAction(() => {
      userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
        pickedFeatures;
    });

    // Second point
    const pt2Position = new Cartographic(
      CesiumMath.toRadians(149.124),
      CesiumMath.toRadians(-35.311),
      CesiumMath.toRadians(0)
    );
    const pt2CartesianPosition =
      Ellipsoid.WGS84.cartographicToCartesian(pt2Position);
    pickedFeatures.pickPosition = pt2CartesianPosition;
    runInAction(() => {
      userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
        pickedFeatures;
    });

    // Third point
    const pt3Position = new Cartographic(
      CesiumMath.toRadians(149.127),
      CesiumMath.toRadians(-35.308),
      CesiumMath.toRadians(0)
    );
    const pt3CartesianPosition =
      Ellipsoid.WGS84.cartographicToCartesian(pt3Position);
    pickedFeatures.pickPosition = pt3CartesianPosition;
    runInAction(() => {
      userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
        pickedFeatures;
    });
    expect((<any>userDrawing).closeLoop).toBeFalsy();

    // Now pick the first point
    pickedFeatures.pickPosition = pt1CartesianPosition;
    // If in the UI the user clicks on a point, it returns that entity, so we're pulling it out of userDrawing and
    // pretending the user actually clicked on it.
    const pt1Entity = userDrawing.pointEntities.entities.values[0];
    pickedFeatures.features = [pt1Entity as TerriaFeature];
    runInAction(() => {
      userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
        pickedFeatures;
    });

    expect((<any>userDrawing).closeLoop).toBeFalsy();
    expect(userDrawing.pointEntities.entities.values.length).toEqual(2);
  });

  it("polygon is only drawn once", function () {
    const userDrawing = new UserDrawing({ terria });
    userDrawing.enterDrawMode();
    const pickedFeatures = new PickedFeatures();

    // First point
    // Points around Parliament house
    const pt1Position = new Cartographic(
      CesiumMath.toRadians(149.121),
      CesiumMath.toRadians(-35.309),
      CesiumMath.toRadians(0)
    );
    const pt1CartesianPosition =
      Ellipsoid.WGS84.cartographicToCartesian(pt1Position);
    pickedFeatures.pickPosition = pt1CartesianPosition;
    runInAction(() => {
      userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
        pickedFeatures;
    });

    // Second point
    const pt2Position = new Cartographic(
      CesiumMath.toRadians(149.124),
      CesiumMath.toRadians(-35.311),
      CesiumMath.toRadians(0)
    );
    const pt2CartesianPosition =
      Ellipsoid.WGS84.cartographicToCartesian(pt2Position);
    pickedFeatures.pickPosition = pt2CartesianPosition;
    runInAction(() => {
      userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
        pickedFeatures;
    });

    // Third point
    const pt3Position = new Cartographic(
      CesiumMath.toRadians(149.127),
      CesiumMath.toRadians(-35.308),
      CesiumMath.toRadians(0)
    );
    const pt3CartesianPosition =
      Ellipsoid.WGS84.cartographicToCartesian(pt3Position);
    pickedFeatures.pickPosition = pt3CartesianPosition;
    runInAction(() => {
      userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
        pickedFeatures;
    });
    expect((<any>userDrawing).closeLoop).toBeFalsy();
    expect(userDrawing.otherEntities.entities.values.length).toEqual(1);

    // Now pick the first point
    pickedFeatures.pickPosition = pt1CartesianPosition;
    // If in the UI the user clicks on a point, it returns that entity, so we're pulling it out of userDrawing and
    // pretending the user actually clicked on it.
    const pt1Entity = userDrawing.pointEntities.entities.values[0];
    pickedFeatures.features = [pt1Entity as TerriaFeature];
    runInAction(() => {
      userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
        pickedFeatures;
    });
    expect((<any>userDrawing).closeLoop).toBeTruthy();
    expect(userDrawing.otherEntities.entities.values.length).toEqual(2);

    // Another point. Polygon is still closed.
    const newPtPosition = new Cartographic(
      CesiumMath.toRadians(149.0),
      CesiumMath.toRadians(-35.0),
      CesiumMath.toRadians(0)
    );
    const newPtCartesianPosition =
      Ellipsoid.WGS84.cartographicToCartesian(newPtPosition);
    pickedFeatures.pickPosition = newPtCartesianPosition;
    runInAction(() => {
      userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
        pickedFeatures;
    });

    expect((<any>userDrawing).closeLoop).toBeTruthy();
    expect(userDrawing.otherEntities.entities.values.length).toEqual(2);
  });

  it("point is removed if it is clicked on and it is not the first point", function () {
    const options = { terria: terria };
    const userDrawing = new UserDrawing(options);
    userDrawing.enterDrawMode();
    const pickedFeatures = new PickedFeatures();

    // First point
    // Points around Parliament house
    const pt1Position = new Cartographic(
      CesiumMath.toRadians(149.121),
      CesiumMath.toRadians(-35.309),
      CesiumMath.toRadians(0)
    );
    const pt1CartesianPosition =
      Ellipsoid.WGS84.cartographicToCartesian(pt1Position);
    pickedFeatures.pickPosition = pt1CartesianPosition;
    runInAction(() => {
      userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
        pickedFeatures;
    });

    // Second point
    const pt2Position = new Cartographic(
      CesiumMath.toRadians(149.124),
      CesiumMath.toRadians(-35.311),
      CesiumMath.toRadians(0)
    );
    const pt2CartesianPosition =
      Ellipsoid.WGS84.cartographicToCartesian(pt2Position);
    pickedFeatures.pickPosition = pt2CartesianPosition;
    runInAction(() => {
      userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
        pickedFeatures;
    });

    // Third point
    const pt3Position = new Cartographic(
      CesiumMath.toRadians(149.127),
      CesiumMath.toRadians(-35.308),
      CesiumMath.toRadians(0)
    );
    const pt3CartesianPosition =
      Ellipsoid.WGS84.cartographicToCartesian(pt3Position);
    pickedFeatures.pickPosition = pt3CartesianPosition;
    runInAction(() => {
      userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
        pickedFeatures;
    });
    expect((<any>userDrawing).closeLoop).toBeFalsy();

    // Now pick the second point
    pickedFeatures.pickPosition = pt2CartesianPosition;
    // If in the UI the user clicks on a point, it returns that entity, so we're pulling it out of userDrawing and
    // pretending the user actually clicked on it.
    const pt2Entity = userDrawing.pointEntities.entities.values[1];
    pickedFeatures.features = [pt2Entity as TerriaFeature];
    runInAction(() => {
      userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
        pickedFeatures;
    });

    expect(userDrawing.pointEntities.entities.values.length).toEqual(2);
    expect(userDrawing.mapItems.length).toBe(2);
  });

  it("draws rectangle", function () {
    const userDrawing = new UserDrawing({
      terria,
      allowPolygon: false,
      drawRectangle: true
    });
    userDrawing.enterDrawMode();
    const pickedFeatures = new PickedFeatures();

    // First point
    // Points around Parliament house
    const pt1Position = new Cartographic(
      CesiumMath.toRadians(149.121),
      CesiumMath.toRadians(-35.309),
      CesiumMath.toRadians(0)
    );
    const pt1CartesianPosition =
      Ellipsoid.WGS84.cartographicToCartesian(pt1Position);
    pickedFeatures.pickPosition = pt1CartesianPosition;
    runInAction(() => {
      userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
        pickedFeatures;
    });

    expect(userDrawing.pointEntities.entities.values.length).toEqual(1);
    expect(userDrawing.otherEntities.entities.values.length).toEqual(1);

    let rectangle: Rectangle = userDrawing.otherEntities.entities
      .getById("rectangle")
      ?.rectangle?.coordinates?.getValue(terria.timelineClock.currentTime);

    expect(rectangle).toBeUndefined();

    // Second point
    const pt2Position = new Cartographic(
      CesiumMath.toRadians(149.124),
      CesiumMath.toRadians(-35.311),
      CesiumMath.toRadians(0)
    );
    const pt2CartesianPosition =
      Ellipsoid.WGS84.cartographicToCartesian(pt2Position);
    pickedFeatures.pickPosition = pt2CartesianPosition;
    runInAction(() => {
      userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
        pickedFeatures;
    });

    expect(userDrawing.pointEntities.entities.values.length).toEqual(2);
    expect(userDrawing.otherEntities.entities.values.length).toEqual(1);

    rectangle = userDrawing.otherEntities.entities
      .getById("rectangle")
      ?.rectangle?.coordinates?.getValue(terria.timelineClock.currentTime);

    expect(rectangle.east).toBeCloseTo(CesiumMath.toRadians(149.124));
    expect(rectangle.west).toBeCloseTo(CesiumMath.toRadians(149.121));
    expect(rectangle.north).toBeCloseTo(CesiumMath.toRadians(-35.309));
    expect(rectangle.south).toBeCloseTo(CesiumMath.toRadians(-35.311));

    expect(userDrawing.mapItems.length).toBe(1);
  });

  it("calls onDrawingComplete with the drawn points or rectangle", function () {
    let completedPoints: Cartesian3[] | undefined;
    let completedRectangle: Rectangle | undefined;
    const userDrawing = new UserDrawing({
      terria,
      allowPolygon: false,
      drawRectangle: true,
      onDrawingComplete: ({ points, rectangle }) => {
        completedPoints = points;
        completedRectangle = rectangle;
      }
    });
    userDrawing.enterDrawMode();
    const pickedFeatures = new PickedFeatures();

    // First point
    // Points around Parliament house
    const pt1Position = new Cartographic(
      CesiumMath.toRadians(149.121),
      CesiumMath.toRadians(-35.309),
      CesiumMath.toRadians(0)
    );
    const pt1CartesianPosition =
      Ellipsoid.WGS84.cartographicToCartesian(pt1Position);
    pickedFeatures.pickPosition = pt1CartesianPosition;
    runInAction(() => {
      userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
        pickedFeatures;
    });

    // Second point
    const pt2Position = new Cartographic(
      CesiumMath.toRadians(149.124),
      CesiumMath.toRadians(-35.311),
      CesiumMath.toRadians(0)
    );
    const pt2CartesianPosition =
      Ellipsoid.WGS84.cartographicToCartesian(pt2Position);
    pickedFeatures.pickPosition = pt2CartesianPosition;
    runInAction(() => {
      userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
        pickedFeatures;
    });

    // Check onDrawingComplete was called when we end the drawing.
    userDrawing.terria.mapInteractionModeStack[0].onCancel?.();
    expect(completedPoints).toBeDefined();
    if (completedPoints) {
      expect(completedPoints.length).toEqual(2);
    }
    expect(completedRectangle).toBeDefined();
  });
});
