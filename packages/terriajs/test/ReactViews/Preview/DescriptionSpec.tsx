import { act, render, screen } from "@testing-library/react";
import { runInAction } from "mobx";
import GeoJsonCatalogItem from "../../../lib/Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import WebMapServiceCatalogItem from "../../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import CommonStrata from "../../../lib/Models/Definition/CommonStrata";
import updateModelFromJson from "../../../lib/Models/Definition/updateModelFromJson";
import Terria from "../../../lib/Models/Terria";
import Description from "../../../lib/ReactViews/Preview/Description";
import { TerriaThemeProvider } from "../withContext";

describe("DescriptionSpec", function () {
  let terria: Terria;
  let wmsItem: WebMapServiceCatalogItem;

  beforeEach(async function () {
    terria = new Terria({
      baseUrl: "./"
    });
    wmsItem = new WebMapServiceCatalogItem("test", terria);

    runInAction(() => {
      wmsItem.setTrait("definition", "url", "test/WMS/single_metadata_url.xml");
    });
    await wmsItem.loadMetadata();
  });

  it("renders metadataUrls", function () {
    render(
      <TerriaThemeProvider>
        <Description item={wmsItem} />
      </TerriaThemeProvider>
    );

    expect(
      screen.getByRole("link", { name: "http://examplemetadata.com" })
    ).toBeVisible();
  });

  it("renders metadataUrl button", function () {
    runInAction(() => {
      updateModelFromJson(wmsItem, "definition", {
        metadataUrls: [{ title: "Some Title" }]
      });
    });

    render(
      <TerriaThemeProvider>
        <Description item={wmsItem} />
      </TerriaThemeProvider>
    );

    expect(screen.queryByRole("link", { name: "Some Title" })).toBeVisible();
  });

  it("renders dataUrls", function () {
    runInAction(() => {
      updateModelFromJson(wmsItem, "definition", {
        metadataUrls: [{ title: "Some Title" }],
        dataUrls: [
          {
            url: "http://exampledata-data.com",
            type: "wfs-complete"
          }
        ]
      });
    });

    render(
      <TerriaThemeProvider>
        <Description item={wmsItem} />
      </TerriaThemeProvider>
    );

    expect(
      screen.getByRole("link", { name: "http://exampledata-data.com" })
    ).toBeVisible();
  });

  it("renders dataUrl with title", function () {
    runInAction(() => {
      updateModelFromJson(wmsItem, "definition", {
        metadataUrls: [{ title: "Some Title" }],
        dataUrls: [
          {
            url: "http://exampledata.com",
            type: "wfs-complete",
            title: "some link"
          }
        ]
      });
    });

    render(
      <TerriaThemeProvider>
        <Description item={wmsItem} />
      </TerriaThemeProvider>
    );

    expect(screen.queryByRole("link", { name: "some link" })).toBeVisible();
  });

  it("respects hideDefaultDescription", function () {
    const geoJsonItem = new GeoJsonCatalogItem("test-geojson", terria);
    runInAction(() => {
      geoJsonItem.setTrait(CommonStrata.definition, "description", "test");
    });

    const { container, rerender } = render(
      <TerriaThemeProvider>
        <Description item={geoJsonItem} />
      </TerriaThemeProvider>
    );

    expect(
      screen.getByRole("heading", { name: "description.name" })
    ).toBeVisible();
    expect(screen.getByText("test")).toBeVisible();

    act(() =>
      runInAction(() => {
        geoJsonItem.setTrait(CommonStrata.definition, "description", "");
      })
    );

    rerender(
      <TerriaThemeProvider>
        <Description item={geoJsonItem} />
      </TerriaThemeProvider>
    );

    expect(screen.getByText("description.dataNotLocal")).toBeVisible();

    act(() => {
      runInAction(() => {
        geoJsonItem.setTrait(
          CommonStrata.definition,
          "hideDefaultDescription",
          true
        );
      });
    });

    rerender(
      <TerriaThemeProvider>
        <Description item={geoJsonItem} />
      </TerriaThemeProvider>
    );

    const showNoDescription = container.querySelectorAll("p");
    expect(showNoDescription.length).toEqual(0);
  });
});
