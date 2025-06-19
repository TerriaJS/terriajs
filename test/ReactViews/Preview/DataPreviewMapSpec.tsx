import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GeoJsonCatalogItem from "../../../lib/Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import CommonStrata from "../../../lib/Models/Definition/CommonStrata";
import Terria from "../../../lib/Models/Terria";
import DataPreviewMap from "../../../lib/ReactViews/Preview/DataPreviewMap";
import TerriaViewer from "../../../lib/ViewModels/TerriaViewer";

describe("DataPreviewMapSpec", () => {
  let terria: Terria;
  let attachSpy: jasmine.Spy;

  beforeEach(() => {
    terria = new Terria({
      baseUrl: "./"
    });
    attachSpy = spyOn(TerriaViewer.prototype, "attach").and.callThrough();
  });
  it("renders DataPreviewMap placeholder", () => {
    const { container } = render(
      <DataPreviewMap terria={terria} showMap={false} />
    );

    expect(
      container.querySelector(".tjs-data-preview-map__terria-preview")
    ).toBeVisible();
    expect(screen.getByText("preview.noPreviewAvailable")).toBeVisible();
  });

  it("renders DataPreviewMap with no data", async () => {
    const { container } = render(<DataPreviewMap terria={terria} showMap />);

    await waitFor(() =>
      expect(container.querySelector(".leaflet-container")).toBeVisible()
    );
    expect(screen.getByText("preview.noPreviewAvailable")).toBeVisible();
    expect(attachSpy).toHaveBeenCalledTimes(1);
  });

  it("renders DataPreviewMap with data", async () => {
    const geojson = new GeoJsonCatalogItem("test-geojson", terria);
    geojson.setTrait(CommonStrata.user, "geoJsonData", {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            LGA_CODE19: "19499",
            LGA_NAME19: "No usual address (NSW)",
            STE_CODE16: "1",
            STE_NAME16: "New South Wales",
            AREASQKM19: 0.0
          },
          geometry: null
        },
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [0.806671142578125, -2.96258644191746],
                [0.008544921875, -2.19273094190691],
                [0.557861328125, -2.659031913817685],
                [0.042877197265625, -2.375322284319346],
                [0.7998046875, -2.96719522935591],
                [0.806671142578125, -2.96258644191746]
              ]
            ]
          }
        }
      ]
    });
    await geojson.loadMapItems();

    const { container } = render(
      <DataPreviewMap terria={terria} previewed={geojson} showMap />
    );

    await waitFor(() =>
      expect(container.querySelector(".leaflet-container")).toBeVisible()
    );
    screen.debug(container, Infinity);
    expect(screen.getByText("preview.dataPreview")).toBeVisible();
    expect(attachSpy).toHaveBeenCalledTimes(1);
  });

  it("doesn't render entire data preview map when clicking on the map", async () => {
    const geojson = new GeoJsonCatalogItem("test-geojson", terria);
    geojson.setTrait(CommonStrata.user, "geoJsonData", {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            LGA_CODE19: "19499",
            LGA_NAME19: "No usual address (NSW)",
            STE_CODE16: "1",
            STE_NAME16: "New South Wales",
            AREASQKM19: 0.0
          },
          geometry: null
        },
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [0.806671142578125, -2.96258644191746],
                [0.008544921875, -2.19273094190691],
                [0.557861328125, -2.659031913817685],
                [0.042877197265625, -2.375322284319346],
                [0.7998046875, -2.96719522935591],
                [0.806671142578125, -2.96258644191746]
              ]
            ]
          }
        }
      ]
    });
    await geojson.loadMapItems();

    const { container } = render(
      <DataPreviewMap terria={terria} previewed={geojson} showMap />
    );

    await waitFor(() =>
      expect(container.querySelector(".leaflet-container")).toBeVisible()
    );

    expect(attachSpy).toHaveBeenCalledTimes(1);

    const containerElement = container.querySelector(
      ".tjs-data-preview-map__map"
    )!;

    screen.debug(containerElement, Infinity);
    await userEvent.click(containerElement);

    expect(attachSpy).toHaveBeenCalledTimes(1);
  });

  it("should not reinitialize the map after rerender", async () => {
    const geojson = new GeoJsonCatalogItem("test-geojson", terria);
    geojson.setTrait(CommonStrata.user, "geoJsonData", {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            LGA_CODE19: "19499",
            LGA_NAME19: "No usual address (NSW)",
            STE_CODE16: "1",
            STE_NAME16: "New South Wales",
            AREASQKM19: 0.0
          },
          geometry: null
        },
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [0.806671142578125, -2.96258644191746],
                [0.008544921875, -2.19273094190691],
                [0.557861328125, -2.659031913817685],
                [0.042877197265625, -2.375322284319346],
                [0.7998046875, -2.96719522935591],
                [0.806671142578125, -2.96258644191746]
              ]
            ]
          }
        }
      ]
    });
    await geojson.loadMapItems();

    const { container, rerender } = render(
      <DataPreviewMap terria={terria} previewed={geojson} showMap />
    );

    await waitFor(() =>
      expect(container.querySelector(".leaflet-container")).toBeVisible()
    );

    expect(attachSpy).toHaveBeenCalledTimes(1);

    rerender(<DataPreviewMap terria={terria} previewed={geojson} />);

    expect(attachSpy).toHaveBeenCalledTimes(1);
  });
});
