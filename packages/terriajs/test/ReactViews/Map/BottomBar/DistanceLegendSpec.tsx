import { act } from "@testing-library/react";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import Matrix4 from "terriajs-cesium/Source/Core/Matrix4";
import Ray from "terriajs-cesium/Source/Core/Ray";
import Terria from "../../../../lib/Models/Terria";
import ViewState from "../../../../lib/ReactViewModels/ViewState";
import { DistanceLegend } from "../../../../lib/ReactViews/Map/BottomBar/DistanceLegend";
import { renderWithContexts } from "../../withContext";

const FRAME_MS = 16;

describe("DistanceLegend", function () {
  let terria: Terria;
  let viewState: ViewState;
  let scene: {
    postRender: CesiumEvent;
    canvas: { clientWidth: number; clientHeight: number };
    camera: { viewMatrix: Matrix4; getPickRay: () => Ray };
    globe: {
      ellipsoid: Ellipsoid;
      pick: jasmine.Spy<() => Cartesian3 | undefined>;
    };
  };
  let positions: Cartesian3[];

  const legendText = (container: HTMLElement) =>
    container.querySelector(".tjs-legend__distanceLegend")?.textContent;

  const renderFrame = () =>
    act(() => {
      scene.postRender.raiseEvent(scene);
    });

  const moveCamera = () => {
    scene.camera.viewMatrix = Matrix4.multiplyByTranslation(
      scene.camera.viewMatrix,
      new Cartesian3(1, 0, 0),
      new Matrix4()
    );
  };

  beforeEach(function () {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 0, 1));

    terria = new Terria();
    viewState = new ViewState({ terria });

    // Two points ~1km apart, i.e. 1km per pixel.
    positions = [
      Ellipsoid.WGS84.cartographicToCartesian(
        Cartographic.fromDegrees(149.0, -35.0)
      ),
      Ellipsoid.WGS84.cartographicToCartesian(
        Cartographic.fromDegrees(149.011, -35.0)
      )
    ];
    let next = 0;
    scene = {
      postRender: new CesiumEvent(),
      canvas: { clientWidth: 800, clientHeight: 600 },
      camera: {
        viewMatrix: Matrix4.clone(Matrix4.IDENTITY),
        getPickRay: () => new Ray()
      },
      globe: {
        ellipsoid: Ellipsoid.WGS84,
        pick: jasmine
          .createSpy("pick")
          .and.callFake(() => positions[next++ % 2])
      }
    };
    spyOnProperty(terria, "cesium", "get").and.returnValue({ scene } as any);
  });

  afterEach(function () {
    jasmine.clock().uninstall();
  });

  it("shows the scale for the current view", function () {
    const { container } = renderWithContexts(<DistanceLegend />, viewState);
    renderFrame();
    expect(legendText(container)).toBe("100 km");
  });

  it("does no work on frames where the view hasn't changed", function () {
    renderWithContexts(<DistanceLegend />, viewState);
    for (let i = 0; i < 60; i++) {
      renderFrame();
      jasmine.clock().tick(FRAME_MS);
    }
    jasmine.clock().tick(1000);

    // One update (two globe picks) for the first frame only.
    expect(scene.globe.pick).toHaveBeenCalledTimes(2);
  });

  it("updates at most every 200ms while the camera moves", function () {
    renderWithContexts(<DistanceLegend />, viewState);
    // One second of continuous camera movement at ~60fps.
    for (let i = 0; i < 60; i++) {
      moveCamera();
      renderFrame();
      jasmine.clock().tick(FRAME_MS);
    }
    act(() => jasmine.clock().tick(1000));

    // Previously every frame ran an update: 60 updates, 120 picks.
    const updates = scene.globe.pick.calls.count() / 2;
    expect(updates).toBeGreaterThanOrEqual(5);
    expect(updates).toBeLessThanOrEqual(7);
  });

  it("keeps retrying while the globe can't be picked", function () {
    scene.globe.pick.and.returnValue(undefined);
    const { container } = renderWithContexts(<DistanceLegend />, viewState);
    renderFrame();
    expect(legendText(container)).toBeUndefined();

    scene.globe.pick.and.callFake(
      (() => {
        let next = 0;
        return () => positions[next++ % 2];
      })()
    );
    act(() => jasmine.clock().tick(250));
    renderFrame();
    expect(legendText(container)).toBe("100 km");
  });

  it("stops listening when unmounted", function () {
    const { unmount } = renderWithContexts(<DistanceLegend />, viewState);
    unmount();
    expect(scene.postRender.numberOfListeners).toBe(0);
  });
});
