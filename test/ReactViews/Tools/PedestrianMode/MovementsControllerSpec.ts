import { action } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Camera from "terriajs-cesium/Source/Scene/Camera";
import Scene from "terriajs-cesium/Source/Scene/Scene";
import LatLonHeight from "../../../../lib/Core/LatLonHeight";
import Cesium from "../../../../lib/Models/Cesium";
import Terria from "../../../../lib/Models/Terria";
import MovementsController from "../../../../lib/ReactViews/Tools/PedestrianMode/MovementsController";
import {
  MAX_VERTICAL_LOOK_ANGLE,
  PEDESTRIAN_HEIGHT
} from "../../../../lib/ReactViews/Tools/PedestrianMode/PedestrianMode";

describe("MovementsController", function () {
  let cesium: Cesium;
  let scene: Scene;
  let camera: Camera;
  let controller: MovementsController;

  beforeEach(async function () {
    const terria = new Terria();
    const container = document.createElement("div");
    terria.mainViewer.attach(container);
    await (terria.mainViewer as any)._cesiumPromise;
    cesium = terria.cesium!;
    controller = new MovementsController(
      cesium,
      () => {},
      PEDESTRIAN_HEIGHT,
      MAX_VERTICAL_LOOK_ANGLE
    );
    scene = cesium.scene;
    camera = scene.camera;
  });

  describe("when activated", function () {
    it(
      "disables all default map interactions",
      action(function () {
        controller.activate();
        expect(scene.screenSpaceCameraController.enableTranslate).toBe(false);
        expect(scene.screenSpaceCameraController.enableRotate).toBe(false);
        expect(scene.screenSpaceCameraController.enableLook).toBe(false);
        expect(scene.screenSpaceCameraController.enableTilt).toBe(false);
        expect(scene.screenSpaceCameraController.enableZoom).toBe(false);
        expect(cesium.isFeaturePickingPaused).toBe(true);
      })
    );

    it("sets up the key map", function () {
      const setupKeyMap = spyOn(controller, "setupKeyMap");
      controller.activate();
      expect(setupKeyMap).toHaveBeenCalled();
    });

    it("sets up the mouse map", function () {
      const setupMouseMap = spyOn(controller, "setupMouseMap");
      controller.activate();
      expect(setupMouseMap).toHaveBeenCalled();
    });

    it("starts animating", function () {
      const startAnimating = spyOn(controller, "startAnimating");
      controller.activate();
      expect(startAnimating).toHaveBeenCalled();
    });
  });

  describe("when deactivated", function () {
    it(
      "re-enables all default map interactions",
      action(function () {
        const deactivate = controller.activate();
        deactivate();
        expect(scene.screenSpaceCameraController.enableTranslate).toBe(true);
        expect(scene.screenSpaceCameraController.enableRotate).toBe(true);
        expect(scene.screenSpaceCameraController.enableLook).toBe(true);
        expect(scene.screenSpaceCameraController.enableTilt).toBe(true);
        expect(scene.screenSpaceCameraController.enableZoom).toBe(true);
        expect(cesium.isFeaturePickingPaused).toBe(false);
      })
    );

    it("destroys the key map", function () {
      const destroyKeyMap = jasmine.createSpy("destroyKeyMap");
      spyOn(controller, "setupKeyMap").and.returnValue(destroyKeyMap);
      const deactivate = controller.activate();
      deactivate();
      expect(destroyKeyMap).toHaveBeenCalled();
    });

    it("destroys the mouse map", function () {
      const destroyMouseMap = jasmine.createSpy("destroyMouseMap");
      spyOn(controller, "setupMouseMap").and.returnValue(destroyMouseMap);
      const deactivate = controller.activate();
      deactivate();
      expect(destroyMouseMap).toHaveBeenCalled();
    });

    it("stops animating", function () {
      const stopAnimating = jasmine.createSpy("stopAnimating");
      spyOn(controller, "startAnimating").and.returnValue(stopAnimating);
      const deactivate = controller.activate();
      deactivate();
      expect(stopAnimating).toHaveBeenCalled();
    });
  });

  describe("moveAmount", function () {
    describe("in walk mode", function () {
      it("is a constant", function () {
        expect(controller.moveAmount).toBe(0.2);
      });
    });

    describe("in fly mode", function () {
      it("is proportional to the height", function () {
        controller.mode = "fly";
        spyOnProperty(
          controller,
          "currentPedestrianHeightFromSurface"
        ).and.returnValue(100);
        expect(controller.moveAmount).toBe(1);
      });

      it("is never below baseAmount", function () {
        controller.mode = "fly";
        spyOnProperty(
          controller,
          "currentPedestrianHeightFromSurface"
        ).and.returnValue(0.5);
        expect(controller.moveAmount).toBe(0.2);
      });
    });
  });

  describe("when animating", function () {
    it("automatically switches to fly mode when moving up", function () {
      controller.mode = "walk";
      controller.activeMovements.add("up");
      controller.animate();
      expect(controller.mode).toEqual("fly");
    });

    it("automatically switches to walk mode when moving down and hitting ground", function () {
      controller.mode = "fly";
      controller.activeMovements.add("down");
      controller.animate();
      expect(controller.mode).toEqual("walk");
    });
  });

  describe("movements", function () {
    beforeEach(function () {
      camera.position = Cartographic.toCartesian(
        Cartographic.fromDegrees(76.93, 8.52, 100)
      );
    });

    it("can move forward", function () {
      spyOnProperty(controller, "moveAmount").and.returnValue(100000);
      controller.move("forward");
      expect(toLatLonHeight(camera.position)).toEqual({
        latitude: 8.55,
        longitude: 77.81,
        height: 844.61
      });
    });

    it("can move backward", function () {
      spyOnProperty(controller, "moveAmount").and.returnValue(100000);
      controller.move("backward");
      expect(toLatLonHeight(camera.position)).toEqual({
        latitude: 8.49,
        longitude: 76.05,
        height: 844.61
      });
    });

    it("can move up", function () {
      spyOnProperty(controller, "moveAmount").and.returnValue(100);
      controller.move("up");
      expect(toLatLonHeight(camera.position)).toEqual({
        latitude: 8.52,
        longitude: 76.93,
        height: 200
      });
    });

    it("can move down", function () {
      spyOnProperty(controller, "moveAmount").and.returnValue(100);
      controller.move("down");
      expect(toLatLonHeight(camera.position)).toEqual({
        latitude: 8.52,
        longitude: 76.93,
        height: 0
      });
    });
  });
});

function toLatLonHeight(position: Cartesian3): LatLonHeight {
  const cartographic = Cartographic.fromCartesian(position);
  const round2 = (float: number) => Math.round(float * 100) / 100;
  return {
    latitude: round2(CesiumMath.toDegrees(cartographic.latitude)),
    longitude: round2(CesiumMath.toDegrees(cartographic.longitude)),
    height: round2(cartographic.height)
  };
}
