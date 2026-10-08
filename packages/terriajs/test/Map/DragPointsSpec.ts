import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import Ray from "terriajs-cesium/Source/Core/Ray";
import ScreenSpaceEventHandler from "terriajs-cesium/Source/Core/ScreenSpaceEventHandler";
import ScreenSpaceEventType from "terriajs-cesium/Source/Core/ScreenSpaceEventType";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import DragPoints from "../../lib/Map/DragPoints/DragPoints";
import Terria from "../../lib/Models/Terria";
import ViewerMode, { setViewerMode } from "../../lib/Models/ViewerMode";

/** The private surface of the Cesium/Leaflet helpers that the specs poke at. */
interface DragPointsHelper {
  type: "Cesium" | "Leaflet";
  dragCount: number;
  dragOnObjects?: boolean;
  _draggableObjects: CustomDataSource;
  _pointMovedCallback: (draggableObjects: CustomDataSource) => void;
  _pointMovingCallback: (entity: Entity) => void;
  _mapPickedObjectCallback: (entity: Entity | undefined) => Entity | undefined;
  _mouseHandler?: ScreenSpaceEventHandler;
  setUp(): void;
  destroy(): void;
}

function helperOf(dragPoints: DragPoints): DragPointsHelper {
  return (dragPoints as unknown as { _dragPointsHelper: DragPointsHelper })
    ._dragPointsHelper;
}

function draggableObjects(...entities: Entity[]): CustomDataSource {
  const dataSource = new CustomDataSource();
  entities.forEach((entity) => dataSource.entities.add(entity));
  return dataSource;
}

function positionOf(entity: Entity): Cartesian3 | undefined {
  return entity.position?.getValue(JulianDate.now());
}

describe("DragPoints", function () {
  describe("changing viewerMode", function () {
    let terria: Terria;

    beforeEach(function () {
      terria = new Terria({
        baseUrl: "./"
      });
    });

    /**
     * Switch the viewer and raise the event that `TerriaViewer` raises once the
     * new viewer is in place. The event isn't raised for us here because the
     * viewer is never attached to a DOM element in the specs.
     */
    function changeViewerMode(viewerMode: "2d" | "3d") {
      setViewerMode(viewerMode, terria.mainViewer);
      terria.mainViewer.afterViewerChanged.raiseEvent();
    }

    it("will change helper to right type if viewerMode changes to Leaflet", function () {
      setViewerMode("3d", terria.mainViewer);
      const dragPointsHelper = new DragPoints(terria);
      expect(helperOf(dragPointsHelper).type).toEqual("Cesium");
      changeViewerMode("2d");
      expect(helperOf(dragPointsHelper).type).toEqual("Leaflet");
    });

    it("will change helper to right type if viewerMode changes to Cesium", function () {
      setViewerMode("2d", terria.mainViewer);
      const dragPointsHelper = new DragPoints(terria);
      expect(helperOf(dragPointsHelper).type).toEqual("Leaflet");
      changeViewerMode("3d");
      expect(helperOf(dragPointsHelper).type).toEqual("Cesium");
    });

    it("will inform new helper about existing entities if helper is changed to Leaflet", function () {
      const entities = draggableObjects(
        new Entity({ name: "first test entity" }),
        new Entity({ name: "second test entity" })
      );
      setViewerMode("3d", terria.mainViewer);

      const dragPointsHelper = new DragPoints(terria);
      dragPointsHelper.updateDraggableObjects(entities);
      expect(helperOf(dragPointsHelper)._draggableObjects).toBe(entities);

      changeViewerMode("2d");
      // Same as before, but dragPointsHelper is now new.
      expect(helperOf(dragPointsHelper).type).toEqual("Leaflet");
      expect(helperOf(dragPointsHelper)._draggableObjects).toBe(entities);
    });

    it("will inform new helper about existing entities if helper is changed to Cesium", function () {
      const entities = draggableObjects(
        new Entity({ name: "first test entity" }),
        new Entity({ name: "second test entity" })
      );
      setViewerMode("2d", terria.mainViewer);

      const dragPointsHelper = new DragPoints(terria);
      dragPointsHelper.updateDraggableObjects(entities);
      expect(helperOf(dragPointsHelper)._draggableObjects).toBe(entities);

      changeViewerMode("3d");
      // Same as before, but dragPointsHelper is now new.
      expect(helperOf(dragPointsHelper).type).toEqual("Cesium");
      expect(helperOf(dragPointsHelper)._draggableObjects).toBe(entities);
    });

    it("keeps the constructor options when the helper is recreated", function () {
      const pointMovedCallback = jasmine.createSpy("pointMovedCallback");
      const pointMovingCallback = jasmine.createSpy("pointMovingCallback");
      setViewerMode("2d", terria.mainViewer);

      const dragPointsHelper = new DragPoints(terria, {
        pointMovedCallback,
        pointMovingCallback,
        dragOnObjects: true
      });

      changeViewerMode("3d");

      const helper = helperOf(dragPointsHelper);
      expect(helper.type).toEqual("Cesium");
      expect(helper._pointMovedCallback).toBe(pointMovedCallback);
      expect(helper._pointMovingCallback).toBe(pointMovingCallback);
      expect(helper.dragOnObjects).toBe(true);
    });

    it("stops listening for viewer changes once destroyed", function () {
      setViewerMode("3d", terria.mainViewer);
      const dragPointsHelper = new DragPoints(terria);
      const helper = helperOf(dragPointsHelper);
      spyOn(helper, "destroy").and.callThrough();

      dragPointsHelper.destroy();
      expect(helper.destroy).toHaveBeenCalled();

      changeViewerMode("2d");
      // The helper would have been swapped for a Leaflet one if the listener
      // were still attached.
      expect(helperOf(dragPointsHelper)).toBe(helper);
    });
  });

  describe("constructor arguments", function () {
    let terria: Terria;

    beforeEach(function () {
      terria = new Terria({ baseUrl: "./" });
      setViewerMode("3d", terria.mainViewer);
    });

    it("accepts a point moved callback function", function () {
      const pointMovedCallback = jasmine.createSpy("pointMovedCallback");
      const helper = helperOf(new DragPoints(terria, pointMovedCallback));
      expect(helper._pointMovedCallback).toBe(pointMovedCallback);
    });

    it("accepts an options object", function () {
      const pointMovedCallback = jasmine.createSpy("pointMovedCallback");
      const pointMovingCallback = jasmine.createSpy("pointMovingCallback");
      const mapPickedObjectCallback = jasmine
        .createSpy("mapPickedObjectCallback")
        .and.returnValue(undefined);

      const helper = helperOf(
        new DragPoints(terria, {
          pointMovedCallback,
          pointMovingCallback,
          mapPickedObjectCallback,
          dragOnObjects: true
        })
      );

      expect(helper._pointMovedCallback).toBe(pointMovedCallback);
      expect(helper._pointMovingCallback).toBe(pointMovingCallback);
      expect(helper._mapPickedObjectCallback).toBe(mapPickedObjectCallback);
      expect(helper.dragOnObjects).toBe(true);
    });

    it("defaults the callbacks and dragOnObjects when given nothing", function () {
      const helper = helperOf(new DragPoints(terria));
      const entity = new Entity({ name: "test entity" });

      expect(helper.dragOnObjects).toBe(false);
      expect(function () {
        helper._pointMovedCallback(new CustomDataSource());
        helper._pointMovingCallback(entity);
      }).not.toThrow();
      // The default resolves a picked object to itself.
      expect(helper._mapPickedObjectCallback(entity)).toBe(entity);
    });

    it("defaults dragOnObjects to false when options omit it", function () {
      const helper = helperOf(
        new DragPoints(terria, { pointMovingCallback: () => {} })
      );
      expect(helper.dragOnObjects).toBe(false);
    });
  });

  describe("CesiumDragPoints", function () {
    const MOUSE_DOWN_POSITION = new Cartesian2(10, 20);
    const MOUSE_MOVE_POSITION = new Cartesian2(30, 40);
    const MOUSE_UP_POSITION = new Cartesian2(31, 41);
    const GLOBE_POSITION = new Cartesian3(1, 2, 3);
    const SCENE_POSITION = new Cartesian3(4, 5, 6);

    let terria: Terria;
    let scene: {
      canvas: HTMLCanvasElement;
      globe: { pick: jasmine.Spy };
      pick: jasmine.Spy;
      pickPosition: jasmine.Spy;
      screenSpaceCameraController: Record<string, boolean>;
    };
    let pointMovedCallback: jasmine.Spy;
    let pointMovingCallback: jasmine.Spy;
    let entity: Entity;
    let entities: CustomDataSource;

    beforeEach(function () {
      scene = {
        canvas: document.createElement("canvas"),
        globe: {
          pick: jasmine.createSpy("globePick").and.returnValue(GLOBE_POSITION)
        },
        pick: jasmine.createSpy("pick").and.returnValue(undefined),
        pickPosition: jasmine
          .createSpy("pickPosition")
          .and.returnValue(SCENE_POSITION),
        screenSpaceCameraController: {
          enableRotate: true,
          enableZoom: true,
          enableLook: true,
          enableTilt: true,
          enableTranslate: true
        }
      };

      terria = {
        mainViewer: {
          viewerMode: ViewerMode.Cesium,
          afterViewerChanged: new CesiumEvent()
        },
        cesium: {
          scene,
          cesiumWidget: {
            camera: {
              getPickRay: (_position: Cartesian2, result?: Ray) =>
                result ?? new Ray()
            }
          }
        }
      } as unknown as Terria;

      pointMovedCallback = jasmine.createSpy("pointMovedCallback");
      pointMovingCallback = jasmine.createSpy("pointMovingCallback");
      entity = new Entity({ name: "draggable entity" });
      entities = draggableObjects(entity);
    });

    function setUpDragPoints(
      options: {
        mapPickedObjectCallback?: (
          entity: Entity | undefined
        ) => Entity | undefined;
        dragOnObjects?: boolean;
      } = {}
    ) {
      const dragPoints = new DragPoints(terria, {
        pointMovedCallback,
        pointMovingCallback,
        ...options
      });
      dragPoints.updateDraggableObjects(entities);
      dragPoints.setUp();
      return dragPoints;
    }

    function mouseDown(dragPoints: DragPoints, position = MOUSE_DOWN_POSITION) {
      const action = helperOf(dragPoints)._mouseHandler?.getInputAction(
        ScreenSpaceEventType.LEFT_DOWN
      ) as (event: { position: Cartesian2 }) => void;
      action({ position });
    }

    function mouseMove(dragPoints: DragPoints, position = MOUSE_MOVE_POSITION) {
      const action = helperOf(dragPoints)._mouseHandler?.getInputAction(
        ScreenSpaceEventType.MOUSE_MOVE
      ) as (event: {
        startPosition: Cartesian2;
        endPosition: Cartesian2;
      }) => void;
      action({ startPosition: MOUSE_DOWN_POSITION, endPosition: position });
    }

    function mouseUp(dragPoints: DragPoints, position = MOUSE_UP_POSITION) {
      const action = helperOf(dragPoints)._mouseHandler?.getInputAction(
        ScreenSpaceEventType.LEFT_UP
      ) as (event: { position: Cartesian2 }) => void;
      action({ position });
    }

    it("sets up mouse handlers when a Cesium viewer is available", function () {
      const dragPoints = setUpDragPoints();
      const helper = helperOf(dragPoints);
      expect(helper._mouseHandler).toBeDefined();
      expect(
        helper._mouseHandler?.getInputAction(ScreenSpaceEventType.LEFT_DOWN)
      ).toBeDefined();
    });

    it("drags a picked entity that is in the draggable objects", function () {
      scene.pick.and.returnValue({ id: entity });
      const dragPoints = setUpDragPoints();

      mouseDown(dragPoints);
      mouseMove(dragPoints);

      expect(pointMovingCallback).toHaveBeenCalledWith(entity);
      expect(positionOf(entity)).toEqual(GLOBE_POSITION);
      expect(dragPoints.getDragCount()).toBe(1);
      expect(scene.screenSpaceCameraController.enableRotate).toBe(false);

      mouseUp(dragPoints);

      expect(pointMovedCallback).toHaveBeenCalledWith(entities);
      expect(scene.screenSpaceCameraController.enableRotate).toBe(true);
    });

    it("matches the picked entity by id, not by identity", function () {
      // A different Entity object standing in for the same drawn point - this
      // is what picking a billboard of a cloned entity gives us.
      scene.pick.and.returnValue({ id: new Entity({ id: entity.id }) });
      const dragPoints = setUpDragPoints();

      mouseDown(dragPoints);
      mouseMove(dragPoints);

      expect(pointMovingCallback).toHaveBeenCalledWith(entity);
      expect(positionOf(entity)).toEqual(GLOBE_POSITION);
    });

    it("does not drag when the picked object is not an entity", function () {
      // e.g. a 3D tile feature, whose `id` is not an Entity.
      scene.pick.and.returnValue({ id: { name: "not an entity" } });
      const dragPoints = setUpDragPoints();

      mouseDown(dragPoints);
      mouseMove(dragPoints);

      expect(pointMovingCallback).not.toHaveBeenCalled();
      expect(positionOf(entity)).toBeUndefined();
    });

    it("does not drag a non-entity picked object that shares an id with a draggable entity", function () {
      // A picked object that isn't an Entity must not be dragged even when its
      // `id` would match a draggable entity.
      scene.pick.and.returnValue({ id: { id: entity.id } });
      const dragPoints = setUpDragPoints();

      mouseDown(dragPoints);
      mouseMove(dragPoints);

      expect(pointMovingCallback).not.toHaveBeenCalled();
      expect(positionOf(entity)).toBeUndefined();
    });

    it("does not drag when nothing is picked", function () {
      scene.pick.and.returnValue(undefined);
      const dragPoints = setUpDragPoints();

      mouseDown(dragPoints);
      mouseMove(dragPoints);
      mouseUp(dragPoints);

      expect(pointMovingCallback).not.toHaveBeenCalled();
      expect(pointMovedCallback).not.toHaveBeenCalled();
      expect(dragPoints.getDragCount()).toBe(0);
    });

    it("passes the picked entity to mapPickedObjectCallback", function () {
      const pickedEntity = new Entity({ name: "picked entity" });
      scene.pick.and.returnValue({ id: pickedEntity });
      const mapPickedObjectCallback = jasmine
        .createSpy("mapPickedObjectCallback")
        .and.returnValue(undefined);

      mouseDown(setUpDragPoints({ mapPickedObjectCallback }));

      expect(mapPickedObjectCallback).toHaveBeenCalledWith(pickedEntity);
    });

    it("passes undefined to mapPickedObjectCallback when the picked object is not an entity", function () {
      scene.pick.and.returnValue({ id: { id: entity.id } });
      const mapPickedObjectCallback = jasmine
        .createSpy("mapPickedObjectCallback")
        .and.returnValue(undefined);

      mouseDown(setUpDragPoints({ mapPickedObjectCallback }));

      expect(mapPickedObjectCallback).toHaveBeenCalledWith(undefined);
    });

    it("passes undefined to mapPickedObjectCallback when nothing is picked", function () {
      scene.pick.and.returnValue(undefined);
      const mapPickedObjectCallback = jasmine
        .createSpy("mapPickedObjectCallback")
        .and.returnValue(undefined);

      mouseDown(setUpDragPoints({ mapPickedObjectCallback }));

      expect(mapPickedObjectCallback).toHaveBeenCalledWith(undefined);
    });

    it("drags the entity substituted by mapPickedObjectCallback", function () {
      // Nothing draggable under the cursor, but the callback nominates the
      // entity that should move anyway.
      scene.pick.and.returnValue({ id: new Entity({ name: "a handle" }) });
      const dragPoints = setUpDragPoints({
        mapPickedObjectCallback: () => entity
      });

      mouseDown(dragPoints);
      mouseMove(dragPoints);

      expect(pointMovingCallback).toHaveBeenCalledWith(entity);
      expect(positionOf(entity)).toEqual(GLOBE_POSITION);
    });

    it("picks drag positions off the globe when dragOnObjects is false", function () {
      scene.pick.and.returnValue({ id: entity });
      const dragPoints = setUpDragPoints({ dragOnObjects: false });

      mouseDown(dragPoints);
      mouseMove(dragPoints);

      expect(scene.pickPosition).not.toHaveBeenCalled();
      expect(scene.globe.pick).toHaveBeenCalled();
      expect(positionOf(entity)).toEqual(GLOBE_POSITION);
    });

    it("picks drag positions off the scene when dragOnObjects is true", function () {
      scene.pick.and.returnValue({ id: entity });
      const dragPoints = setUpDragPoints({ dragOnObjects: true });

      mouseDown(dragPoints);
      mouseMove(dragPoints);

      expect(scene.pickPosition).toHaveBeenCalledWith(MOUSE_MOVE_POSITION);
      expect(scene.globe.pick).not.toHaveBeenCalled();
      expect(positionOf(entity)).toEqual(SCENE_POSITION);
    });

    it("falls back to the globe when the scene pick misses", function () {
      scene.pick.and.returnValue({ id: entity });
      scene.pickPosition.and.returnValue(undefined);
      const dragPoints = setUpDragPoints({ dragOnObjects: true });

      mouseDown(dragPoints);
      mouseMove(dragPoints);

      expect(scene.pickPosition).toHaveBeenCalled();
      expect(scene.globe.pick).toHaveBeenCalled();
      expect(positionOf(entity)).toEqual(GLOBE_POSITION);
    });

    it("ignores mouse moves when no drag is in progress", function () {
      const dragPoints = setUpDragPoints();

      mouseMove(dragPoints);

      expect(pointMovingCallback).not.toHaveBeenCalled();
      expect(dragPoints.getDragCount()).toBe(0);
    });

    it("resets the drag count", function () {
      scene.pick.and.returnValue({ id: entity });
      const dragPoints = setUpDragPoints();

      mouseDown(dragPoints);
      mouseMove(dragPoints);
      mouseMove(dragPoints);
      expect(dragPoints.getDragCount()).toBe(2);

      dragPoints.resetDragCount();
      expect(dragPoints.getDragCount()).toBe(0);
    });
  });

  describe("LeafletDragPoints", function () {
    let terria: Terria;
    let featureMousedown: CesiumEvent<(entity: Entity) => void>;
    let map: FakeLeafletMap;
    let currentViewer: {
      pauseMapInteraction: jasmine.Spy;
      resumeMapInteraction: jasmine.Spy;
    };
    let pointMovedCallback: jasmine.Spy;
    let pointMovingCallback: jasmine.Spy;
    let entity: Entity;
    let entities: CustomDataSource;

    /** Just enough of `L.Map` to record and fire the drag listeners. */
    class FakeLeafletMap {
      private readonly listeners = new Map<
        string,
        { callback: (event: any) => void; context: unknown }[]
      >();

      on(name: string, callback: (event: any) => void, context: unknown) {
        const forName = this.listeners.get(name) ?? [];
        forName.push({ callback, context });
        this.listeners.set(name, forName);
      }

      off(name: string, callback: (event: any) => void, context: unknown) {
        this.listeners.set(
          name,
          (this.listeners.get(name) ?? []).filter(
            (listener) =>
              listener.callback !== callback || listener.context !== context
          )
        );
      }

      fire(name: string, event: unknown) {
        (this.listeners.get(name) ?? [])
          .slice()
          .forEach(({ callback, context }) => callback.call(context, event));
      }

      listenerCount(name: string) {
        return (this.listeners.get(name) ?? []).length;
      }
    }

    beforeEach(function () {
      featureMousedown = new CesiumEvent<(entity: Entity) => void>();
      map = new FakeLeafletMap();
      currentViewer = {
        pauseMapInteraction: jasmine.createSpy("pauseMapInteraction"),
        resumeMapInteraction: jasmine.createSpy("resumeMapInteraction")
      };

      terria = {
        mainViewer: {
          viewerMode: ViewerMode.Leaflet,
          afterViewerChanged: new CesiumEvent()
        },
        leaflet: {
          map,
          scene: { featureMousedown }
        },
        currentViewer
      } as unknown as Terria;

      pointMovedCallback = jasmine.createSpy("pointMovedCallback");
      pointMovingCallback = jasmine.createSpy("pointMovingCallback");
      entity = new Entity({ name: "draggable entity" });
      entities = draggableObjects(entity);
    });

    function setUpDragPoints(
      options: {
        mapPickedObjectCallback?: (
          entity: Entity | undefined
        ) => Entity | undefined;
      } = {}
    ) {
      const dragPoints = new DragPoints(terria, {
        pointMovedCallback,
        pointMovingCallback,
        ...options
      });
      dragPoints.updateDraggableObjects(entities);
      dragPoints.setUp();
      return dragPoints;
    }

    function moveMouseTo(longitude: number, latitude: number) {
      map.fire("mousemove", { latlng: { lng: longitude, lat: latitude } });
    }

    it("listens for feature mouse down when a Leaflet viewer is available", function () {
      setUpDragPoints();
      expect(featureMousedown.numberOfListeners).toBe(1);
    });

    it("drags an entity that is in the draggable objects", function () {
      const dragPoints = setUpDragPoints();

      featureMousedown.raiseEvent(entity);
      expect(currentViewer.pauseMapInteraction).toHaveBeenCalled();

      moveMouseTo(135, -28.5);

      expect(pointMovingCallback).toHaveBeenCalledWith(entity);
      expect(positionOf(entity)).toEqual(Cartesian3.fromDegrees(135, -28.5));
      expect(dragPoints.getDragCount()).toBe(1);

      map.fire("mouseup", { latlng: { lng: 135, lat: -28.5 } });

      expect(pointMovedCallback).toHaveBeenCalledWith(entities);
      expect(currentViewer.resumeMapInteraction).toHaveBeenCalled();
      expect(map.listenerCount("mousemove")).toBe(0);
      expect(map.listenerCount("mouseup")).toBe(0);
    });

    it("calls pointMovingCallback for every mouse move of a drag", function () {
      const dragPoints = setUpDragPoints();

      featureMousedown.raiseEvent(entity);
      moveMouseTo(135, -28.5);
      moveMouseTo(136, -29.5);

      expect(pointMovingCallback).toHaveBeenCalledTimes(2);
      expect(positionOf(entity)).toEqual(Cartesian3.fromDegrees(136, -29.5));
      expect(dragPoints.getDragCount()).toBe(2);
      // Still mid-drag, so the moved callback hasn't fired.
      expect(pointMovedCallback).not.toHaveBeenCalled();
    });

    it("does not drag an entity that is not in the draggable objects", function () {
      setUpDragPoints();

      featureMousedown.raiseEvent(new Entity({ name: "some other entity" }));

      expect(currentViewer.pauseMapInteraction).not.toHaveBeenCalled();
      expect(map.listenerCount("mousemove")).toBe(0);
    });

    it("drags the entity substituted by mapPickedObjectCallback", function () {
      setUpDragPoints({ mapPickedObjectCallback: () => entity });

      featureMousedown.raiseEvent(new Entity({ name: "some other entity" }));
      moveMouseTo(135, -28.5);

      expect(pointMovingCallback).toHaveBeenCalledWith(entity);
      expect(positionOf(entity)).toEqual(Cartesian3.fromDegrees(135, -28.5));
    });

    it("does not drag when mapPickedObjectCallback returns nothing", function () {
      setUpDragPoints({ mapPickedObjectCallback: () => undefined });

      featureMousedown.raiseEvent(entity);

      expect(currentViewer.pauseMapInteraction).not.toHaveBeenCalled();
      expect(pointMovingCallback).not.toHaveBeenCalled();
    });

    it("stops listening for feature mouse down once destroyed", function () {
      const dragPoints = setUpDragPoints();

      dragPoints.destroy();

      expect(featureMousedown.numberOfListeners).toBe(0);
      featureMousedown.raiseEvent(entity);
      expect(currentViewer.pauseMapInteraction).not.toHaveBeenCalled();
    });
  });
});
