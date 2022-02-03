import React from "react";
import { act } from "react-dom/test-utils";
import TestRenderer, { ReactTestRenderer } from "react-test-renderer";
import Terria from "../../../../lib/Models/Terria";
import Cesium3DTilesCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/Cesium3DTilesCatalogItem";

// @ts-ignore
import ViewingControls from "../../../../lib/ReactViews/Workbench/Controls/ViewingControls";
import ViewState from "../../../../lib/ReactViewModels/ViewState";

describe("Ideal Zoom", function() {
  let terria: Terria;
  let theItem: Cesium3DTilesCatalogItem;
  let testRenderer: ReactTestRenderer;
  let viewState: ViewState;
  beforeEach(async function() {
    terria = new Terria({
      baseUrl: "./"
    });
    theItem = new Cesium3DTilesCatalogItem("my3dtiles", terria);
    theItem.setTrait("definition", "url", "/test/Cesium3DTiles/tileset.json");

    const options = {
      terria: terria,
      catalogSearchProvider: undefined,
      locationSearchProviders: []
    };
    viewState = new ViewState(options);
  });

  it("should use default camera view if no parameters are given.", async function() {
    await theItem.loadMapItems();

    act(() => {
      testRenderer = TestRenderer.create(
        <ViewingControls item={theItem} viewState={viewState} />
      );
    });

    testRenderer.root?.findAllByType("button")[0].props.onClick();
    const theCameraView = terria.currentViewer.getCurrentCameraView();

    expect(theCameraView.direction).toBe(undefined);
    expect(theCameraView.position).toBe(undefined);
    expect(theCameraView.up).toBe(undefined);
  });

  it("should customise camera view if the given parameters are valid.", async function() {
    const idealZoom = {
      targetLongitude: 150.60832,
      targetLatitude: -34.19483,
      targetHeight: 200,
      heading: 180,
      pitch: 15,
      range: 200
    };
    theItem.setTrait("definition", "idealZoom", idealZoom);
    await theItem.loadMapItems();
    act(() => {
      testRenderer = TestRenderer.create(
        <ViewingControls item={theItem} viewState={viewState} />
      );
    });

    testRenderer.root.findAllByType("button")[0].props.onClick();
    const theCameraView = terria.currentViewer.getCurrentCameraView();

    const directionX = 0.6595071845691584;
    const directionY = -0.37148703631220265;
    const directionZ = -0.6534888333809832;
    expect(theCameraView.direction?.x).toBe(directionX);
    expect(theCameraView.direction?.y).toBe(directionY);
    expect(theCameraView.direction?.z).toBe(directionZ);

    const positionX = -4601657.155837906;
    const positionY = 2592020.25230978;
    const positionZ = -3564324.3086873693;
    expect(theCameraView.position?.x).toBe(positionX);
    expect(theCameraView.position?.y).toBe(positionY);
    expect(theCameraView.position?.z).toBe(positionZ);

    const upX = -0.5693750748843667;
    const upY = 0.3207174448857751;
    const upZ = -0.7569361562551771;
    expect(theCameraView.up?.x).toBe(upX);
    expect(theCameraView.up?.y).toBe(upY);
    expect(theCameraView.up?.z).toBe(upZ);
  });

  it("should use default camera view if the given parameters are invalid.", async function() {
    const idealZoom = {
      targetLongitude: undefined,
      targetLatitude: undefined,
      targetHeight: 200,
      heading: 180,
      pitch: 15,
      range: 200
    };
    theItem.setTrait("definition", "idealZoom", idealZoom);
    await theItem.loadMapItems();

    act(() => {
      testRenderer = TestRenderer.create(
        <ViewingControls item={theItem} viewState={viewState} />
      );
    });

    testRenderer.root?.findAllByType("button")[0].props.onClick();
    const theCameraView = terria.currentViewer.getCurrentCameraView();

    expect(theCameraView.direction).toBe(undefined);
    expect(theCameraView.position).toBe(undefined);
    expect(theCameraView.up).toBe(undefined);
  });
});
