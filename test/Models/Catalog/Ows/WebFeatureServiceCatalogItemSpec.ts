import i18next from "i18next";
import { runInAction } from "mobx";
import GetCapabilitiesMixin from "../../../../lib/ModelMixins/GetCapabilitiesMixin";
import WebFeatureServiceCatalogItem, {
  GetCapabilitiesStratum
} from "../../../../lib/Models/Catalog/Ows/WebFeatureServiceCatalogItem";
import Terria from "../../../../lib/Models/Terria";

describe("WebFeatureServiceCatalogItem", function () {
  let terria: Terria;
  let wfs: WebFeatureServiceCatalogItem;

  beforeEach(() => {
    terria = new Terria();
    wfs = new WebFeatureServiceCatalogItem("test", terria);
  });

  it("derives getCapabilitiesUrl from url if getCapabilitiesUrl is not specified", function () {
    wfs.setTrait("definition", "url", "foo.bar.baz");
    expect(wfs.getCapabilitiesUrl).toBeDefined();
    expect(wfs.url).toBeDefined();
    expect(
      wfs.getCapabilitiesUrl &&
        wfs.getCapabilitiesUrl.indexOf(wfs.url || "undefined") === 0
    ).toBe(true);
  });

  describe("GetCapabilities", function () {
    beforeEach(() => {
      wfs.setTrait("definition", "url", "test/WFS/getCapabilities.xml");
      wfs.setTrait("definition", "typeNames", "name_of_feature_type");
    });

    it("loads get capabilities", async () => {
      expect((await wfs.loadMetadata()).error).toBeUndefined();
    });

    it("updates description from a GetCapabilities", async function () {
      (await wfs.loadMetadata()).throwIfError();

      expect(
        wfs.info.find(
          (section) =>
            section.name ===
            i18next.t("models.webFeatureServiceCatalogItem.abstract")
        )?.content
      ).toBe("Abstract of feature type");
    });

    it("updates rectangle from a GetCapabilities", async function () {
      (await wfs.loadMetadata()).throwIfError();

      expect(wfs.rectangle.west).toBeCloseTo(142.163757324219, 5);
      expect(wfs.rectangle.east).toBeCloseTo(153.598999023438, 5);
      expect(wfs.rectangle.south).toBeCloseTo(-28.2700939178467, 5);
      expect(wfs.rectangle.north).toBeCloseTo(-10.4980516433716, 5);
    });

    it("pulls correct SRS from GetCapabilities", async function () {
      (await wfs.loadMetadata()).throwIfError();

      const strata = wfs.strata.get(
        GetCapabilitiesMixin.getCapabilitiesStratumName
      ) as GetCapabilitiesStratum;

      const layerSrsArray = strata.capabilities.srsNames?.find(
        (layer) => layer.layerName === "name_of_feature_type"
      );

      expect(layerSrsArray?.srsArray).toEqual([
        "urn:x-ogc:def:crs:EPSG:4283", // From DefaultCRS
        "urn:x-ogc:def:crs:EPSG:4326", // From OtherCRS
        "urn:x-ogc:def:crs:EPSG:900913" // From OtherCRS
      ]);

      expect(wfs.srsName).toBe("urn:x-ogc:def:crs:EPSG:4326");
    });

    it("pulls correct output formats from GetCapabilities", async function () {
      (await wfs.loadMetadata()).throwIfError();

      const strata = wfs.strata.get(
        GetCapabilitiesMixin.getCapabilitiesStratumName
      ) as GetCapabilitiesStratum;

      expect(strata.capabilities.outputTypes).toEqual([
        "text/xml; subtype=gml/3.1.1",
        "GML2",
        "KML",
        "SHAPE-ZIP",
        "application/gml+xml; version=3.2",
        "application/json",
        "application/vnd.google-earth.kml xml",
        "application/vnd.google-earth.kml+xml",
        "csv",
        "gml3",
        "gml32",
        "json",
        "text/csv",
        "text/xml; subtype=gml/2.1.2",
        "text/xml; subtype=gml/3.2"
      ]);

      expect(wfs.outputFormat).toBe("JSON");
    });
  });

  describe("GetFeature", function () {
    beforeEach(() => {
      wfs.setTrait("definition", "url", "test/WFS/getCapabilities.xml");
      wfs.setTrait("definition", "typeNames", "name_of_feature_type");

      jasmine.Ajax.install();

      jasmine.Ajax.stubRequest(
        `test/WFS/getCapabilities.xml?service=WFS&request=GetFeature&typeName=name_of_feature_type&version=1.1.0&outputFormat=JSON&srsName=urn%3Ax-ogc%3Adef%3Acrs%3AEPSG%3A4326&maxFeatures=1000`
      ).andReturn({
        responseJSON: {
          type: "FeatureCollection",
          name: "Test data",
          features: [
            {
              type: "Feature",
              properties: {
                someProp: "someValue"
              },
              geometry: {
                type: "LineString",
                coordinates: [
                  [143.876421625763385, -37.565365204704129, 0.0],
                  [143.878406116725529, -37.565587782094575, 0.0],
                  [143.878637784265578, -37.565655550547291, 0.0]
                ]
              }
            }
          ]
        }
      });
    });

    afterEach(() => {
      jasmine.Ajax.uninstall();
    });

    it("fetches GeoJSON", async () => {
      (await wfs.loadMapItems()).throwIfError();

      expect(wfs.readyData?.features?.length).toBe(1);
      const feature = wfs.readyData?.features[0];

      expect(feature?.type).toBe("Feature");
      expect(feature?.properties?.someProp).toBe("someValue");
    });
  });
});
