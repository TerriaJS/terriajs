import i18next from "i18next";
import loadText from "../../../../lib/Core/loadText";
import ProtomapsImageryProvider from "../../../../lib/Map/ImageryProvider/ProtomapsImageryProvider";
import GpxCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/GpxCatalogItem";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import Terria from "../../../../lib/Models/Terria";

describe("GpxCatalogItem", function () {
  let terria;
  let item: GpxCatalogItem;

  beforeEach(function () {
    terria = new Terria();
    item = new GpxCatalogItem("test", terria);
  });

  it("has type and type name", function () {
    expect(item.type).toBe("gpx");
    expect(item.typeName).toBe(i18next.t("models.gpx.name"));
  });

  it("supports zooming to extent", async function () {
    item.setTrait(CommonStrata.definition, "url", "test/gpx/example.gpx");
    await item.loadMapItems();
    expect(item.disableZoomTo).toBeFalsy();
  });

  it("supports show info", async function () {
    item.setTrait(CommonStrata.definition, "url", "test/gpx/example.gpx");
    await item.loadMapItems();
    expect(item.disableAboutData).toBeFalsy();
  });

  it("can load a GPX file by URL", async () => {
    item.setTrait(CommonStrata.definition, "url", "test/gpx/example.gpx");
    await item.loadMapItems();
    expect(item.mapItems.length).toEqual(2);
    const mapItem = item.mapItems[1];
    expect(
      "imageryProvider" in mapItem &&
        mapItem.imageryProvider instanceof ProtomapsImageryProvider
    ).toBeTruthy();

    expect(item.readyData?.features.length).toEqual(2);
  });

  it("can load a GPX file by string", async () => {
    const string = await loadText("test/gpx/example.gpx");
    item.setTrait(CommonStrata.definition, "gpxString", string);
    await item.loadMapItems();

    expect(item.mapItems.length).toEqual(2);

    const mapItem = item.mapItems[1];
    expect(
      "imageryProvider" in mapItem &&
        mapItem.imageryProvider instanceof ProtomapsImageryProvider
    ).toBeTruthy();

    expect(item.readyData?.features.length).toEqual(2);
  });
});
