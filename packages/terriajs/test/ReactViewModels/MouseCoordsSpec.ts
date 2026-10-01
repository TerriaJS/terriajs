import { computed } from "mobx";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cesium from "../../lib/Models/Cesium";
import MapInteractionMode, {
  MouseMoveEventProps
} from "../../lib/Models/MapInteractionMode";
import Terria from "../../lib/Models/Terria";
import MouseCoords from "../../lib/ReactViewModels/MouseCoords";
import TerriaViewer from "../../lib/ViewModels/TerriaViewer";

describe("MouseCoords", function () {
  describe("triggering mouseMoveEvent for the current mapInteractionMode", function () {
    let terria: Terria;
    let mouseCoords: MouseCoords;
    let mouseMoveListener: jasmine.Spy<(props: MouseMoveEventProps) => void>;
    let animationFrameCallbacks: FrameRequestCallback[];

    beforeEach(function () {
      terria = new Terria({ baseUrl: "./" });
      mouseCoords = new MouseCoords();
      const mapInteractionMode = new MapInteractionMode({
        message: "test",
        enableScenePicking: true
      });
      terria.mapInteractionModeStack.push(mapInteractionMode);
      mouseMoveListener = jasmine.createSpy("mouseMoveListener");
      mapInteractionMode.mouseMoveEvent.addEventListener(mouseMoveListener);

      animationFrameCallbacks = [];
      spyOn(window, "requestAnimationFrame").and.callFake((callback) => {
        animationFrameCallbacks.push(callback);
        return animationFrameCallbacks.length;
      });
    });

    function flushAnimationFrames() {
      animationFrameCallbacks.splice(0).forEach((callback) => callback(0));
    }

    function expectGlobePosition(actual: Cartesian3, expected: Cartesian3) {
      expect(Cartesian3.equalsEpsilon(actual, expected, 0, 1e-6)).toBeTrue();
    }

    describe("for Cesium", function () {
      let terriaViewer: TerriaViewer;
      let cesium: Cesium;
      let container: HTMLElement;

      beforeEach(function () {
        terriaViewer = new TerriaViewer(
          terria,
          computed(() => [])
        );
        terriaViewer.viewerOptions = { useTerrain: false };
        container = document.createElement("div");
        document.body.appendChild(container);
        cesium = new Cesium(terriaViewer, container);
        spyOnProperty(terria, "cesium", "get").and.returnValue(cesium);
      });

      afterEach(function () {
        terriaViewer.destroy();
        document.body.removeChild(container);
      });

      it("raises the mouse move event", function () {
        const pickedGlobePosition = Cartesian3.fromDegrees(10, 20);
        spyOn(mouseCoords as any, "pickGlobeTriangle").and.returnValue({
          tile: undefined,
          intersection: pickedGlobePosition,
          v0: pickedGlobePosition,
          v1: pickedGlobePosition,
          v2: pickedGlobePosition
        });
        const scenePosition = new Cartesian3(1, 2, 3);
        spyOn(cesium.scene, "pickPosition").and.returnValue(scenePosition);

        mouseCoords.updateCoordinatesFromCesium(
          terria,
          new Cartesian2(100, 200) // screen position from cesium
        );
        expect(mouseMoveListener).not.toHaveBeenCalled();

        flushAnimationFrames();

        expect(mouseMoveListener).toHaveBeenCalledTimes(1);
        const props = mouseMoveListener.calls.mostRecent().args[0];
        expectGlobePosition(props.globePosition, pickedGlobePosition);
        expect(props.screenPosition).toEqual(new Cartesian2(100, 200));
        expect(props.scenePosition).toBe(scenePosition);
      });
    });

    describe("for Leaflet", function () {
      it("raises the mouse move event", function () {
        spyOnProperty(terria, "leaflet", "get").and.returnValue({
          map: {
            mouseEventToLatLng: () => ({ lat: 20, lng: 10 }),
            mouseEventToContainerPoint: () => ({ x: 100, y: 200 })
          }
        } as any);

        mouseCoords.updateCoordinatesFromLeaflet(
          terria,
          new MouseEvent("mousemove")
        );
        expect(mouseMoveListener).not.toHaveBeenCalled();

        flushAnimationFrames();

        expect(mouseMoveListener).toHaveBeenCalledTimes(1);
        const props = mouseMoveListener.calls.mostRecent().args[0];
        expectGlobePosition(
          props.globePosition,
          Cartesian3.fromDegrees(10, 20) // screen position from leaflet
        );
        expect(props.screenPosition).toEqual(new Cartesian2(100, 200));
        expect(props.scenePosition).toBeUndefined();
      });
    });
  });
});
