import i18next from "i18next";
import { runInAction } from "mobx";
import _loadWithXhr from "../../lib/Core/loadWithXhr";
import Terria from "../../lib/Models/Terria";
import SenapsLocationsCatalogItem, {
  SenapsFeature,
  SenapsFeatureCollection
} from "../../lib/Models/SenapsLocationsCatalogItem";
import TerriaError from "../../lib/Core/TerriaError";

interface ExtendedLoadWithXhr {
  (): any;
  load: { (...args: any[]): any; calls: any };
}

const loadWithXhr: ExtendedLoadWithXhr = <any>_loadWithXhr;

describe("SenapsLocationsCatalogItem", function () {
  let terria: Terria;
  let item: SenapsLocationsCatalogItem;
  let geoJsonItem: any;
  let geoJsonData: SenapsFeatureCollection;
  let feature: SenapsFeature;

  const proxyUrl = "/api/v0/data/proxy/a-record-id";
  const remoteUrl = "https://senaps.io/api/sensor/v2";
  const proxiedBaseUrl = `${proxyUrl}/${remoteUrl}`;
  const unproxiedBaseUrl = `${remoteUrl}`;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    item = new SenapsLocationsCatalogItem("test", terria);

    const realLoadWithXhr = loadWithXhr.load;
    spyOn(loadWithXhr, "load").and.callFake(function (...args: any[]) {
      let url = args[0];
      // if we have a ?id= then we've passed in a filter
      if (url.match(/locations\?id/g))
        args[0] = "test/Senaps/locations_filtered.json";
      if (url.match(/streams\?id/g))
        args[0] = "test/Senaps/streams_filtered.json";

      // non-filtered requests
      if (url.match(/locations\?count/g))
        args[0] = "test/Senaps/locations.json";
      if (url.match(/streams\?location/g)) args[0] = "test/Senaps/streams.json";
      return realLoadWithXhr(...args);
    });
  });

  it("- has a type and typename", function () {
    expect(item.type).toBe("senaps-locations");
    expect(item.typeName).toBe("Senaps Locations");
  });

  it("- supports zooming to extent", function () {
    expect(item.canZoomTo).toBeTruthy();
  });

  it("- supports show info", function () {
    expect(item.showsInfo).toBeTruthy();
  });

  describe("Can not construct urls without base url", async function () {
    const msg = "models.senaps.missingSenapsBaseUrl";
    const expectedError = new TerriaError({
      title: i18next.t("models.senaps.retrieveErrorTitle"),
      message: i18next.t(msg)
    });

    beforeEach(async function () {
      runInAction(() => {
        item = new SenapsLocationsCatalogItem("test", new Terria());
      });
      await item.loadMapItems();
      geoJsonItem = item.geoJsonItem;
      geoJsonData = (geoJsonItem.geoJsonData as any) as SenapsFeatureCollection;
      feature = geoJsonData.features[0];
    });

    it("- fail to construct locations url", function () {
      expect(function () {
        item._constructLocationsUrl();
      }).toThrow(expectedError);
    });

    it("- fail to construct streams url", function () {
      expect(function () {
        item._constructStreamsUrl("123");
      }).toThrow(expectedError);
    });
  });

  describe("Can get all items from proxied base url", async function () {
    beforeEach(async function () {
      runInAction(() => {
        item = new SenapsLocationsCatalogItem("test", new Terria());
        item.setTrait("definition", "url", remoteUrl);
        item.setTrait("definition", "proxyUrl", proxyUrl);
      });
      await item.loadMapItems();
      geoJsonItem = item.geoJsonItem;
      geoJsonData = (geoJsonItem.geoJsonData as any) as SenapsFeatureCollection;
      feature = geoJsonData.features[0];
    });

    it("- constructs correct locations from a proxied base url", function () {
      expect(item._constructLocationsUrl()).toBe(
        `${proxiedBaseUrl}/locations?count=1000&expand=true`
      );
    });

    it("- constructs correct streams from a proxied base url", function () {
      expect(item._constructStreamsUrl("123")).toBe(
        `${proxiedBaseUrl}/streams?locationid=123`
      );
    });

    it("- has the right number of features", function () {
      expect(item.geoJsonItem).toBeDefined();
      expect(geoJsonData).toBeDefined();
      expect(geoJsonData.features.length).toEqual(2);
    });

    it("- has a feature with the right properties", function () {
      expect(feature.geometry.coordinates).toEqual([148.699683, -34.470083]);
      expect(feature.properties).toBeDefined();
      expect(feature.properties.id).toBe("boorowa.temprh.site5a");
      expect(feature.properties.description).toBe("Boorowa TempRH Site5a");
      expect(feature.properties.hasStreams).toBe(true);
      expect(feature.properties.streamIds).toEqual([
        "tdfnode.0.323831395a368714-99.SHT31DIS_ALL.temperature",
        "tdfnode.0.323831395a368714-99.SHT31DIS_ALL.humidity"
      ]);
    });
  });

  describe("Can get all items from unproxied base url", async function () {
    beforeEach(async function () {
      runInAction(() => {
        item = new SenapsLocationsCatalogItem("test", new Terria());
        item.setTrait("definition", "url", remoteUrl);
      });
      await item.loadMapItems();
      geoJsonItem = item.geoJsonItem;
      geoJsonData = (geoJsonItem.geoJsonData as any) as SenapsFeatureCollection;
      feature = geoJsonData.features[0];
    });

    it("- constructs correct locations from unproxied base url", function () {
      expect(item._constructLocationsUrl()).toBe(
        `${unproxiedBaseUrl}/locations?count=1000&expand=true`
      );
    });

    it("- constructs correct streams from unproxied base url", function () {
      expect(item._constructStreamsUrl("123")).toBe(
        `${unproxiedBaseUrl}/streams?locationid=123`
      );
    });

    it("- has the right number of features", function () {
      expect(item.geoJsonItem).toBeDefined();
      expect(geoJsonData).toBeDefined();
      expect(geoJsonData.features.length).toEqual(2);
    });

    it("- has a feature with the right properties", function () {
      expect(feature.geometry.coordinates).toEqual([148.699683, -34.470083]);
      expect(feature.properties).toBeDefined();
      expect(feature.properties.id).toBe("boorowa.temprh.site5a");
      expect(feature.properties.description).toBe("Boorowa TempRH Site5a");
      expect(feature.properties.hasStreams).toBe(true);
      expect(feature.properties.streamIds).toEqual([
        "tdfnode.0.323831395a368714-99.SHT31DIS_ALL.temperature",
        "tdfnode.0.323831395a368714-99.SHT31DIS_ALL.humidity"
      ]);
    });
  });

  describe("Can get filtered items from unproxied base url", async function () {
    beforeEach(async function () {
      runInAction(() => {
        item = new SenapsLocationsCatalogItem("test", new Terria());
        item.setTrait("definition", "locationIdFilter", "boor");
        item.setTrait("definition", "streamIdFilter", "temp");
        item.setTrait("definition", "url", remoteUrl);
      });
      await item.loadMapItems();
      geoJsonItem = item.geoJsonItem;
      geoJsonData = (geoJsonItem.geoJsonData as any) as SenapsFeatureCollection;
      feature = geoJsonData.features[0];
    });

    it("- constructs correct locations url", function () {
      expect(item._constructLocationsUrl()).toBe(
        `${unproxiedBaseUrl}/locations?id=boor&count=1000&expand=true`
      );
    });

    it("- constructs correct streams url", function () {
      expect(item._constructStreamsUrl("123")).toBe(
        `${unproxiedBaseUrl}/streams?id=temp&locationid=123`
      );
    });

    it("- only retrieves matching features", async function () {
      expect(item.geoJsonItem).toBeDefined();
      expect(geoJsonData.type).toEqual("FeatureCollection");
      expect(geoJsonData.features.length).toEqual(1);
    });

    it("- only retrieves matching streams", async function () {
      expect(feature.properties.streamIds.length).toEqual(1);
    });
  });

  describe("Can get filtered items from proxied base url", async function () {
    beforeEach(async function () {
      runInAction(() => {
        item = new SenapsLocationsCatalogItem("test", new Terria());
        item.setTrait("definition", "locationIdFilter", "boor");
        item.setTrait("definition", "streamIdFilter", "temp");
        item.setTrait("definition", "url", remoteUrl);
        item.setTrait("definition", "proxyUrl", proxyUrl);
      });
      await item.loadMapItems();
      geoJsonItem = item.geoJsonItem;
      geoJsonData = (geoJsonItem.geoJsonData as any) as SenapsFeatureCollection;
      feature = geoJsonData.features[0];
    });

    it("- constructs correct locations from a given base url", function () {
      expect(item._constructLocationsUrl()).toBe(
        `${proxiedBaseUrl}/locations?id=boor&count=1000&expand=true`
      );
    });

    it("- constructs correct streams from a given base url", function () {
      expect(item._constructStreamsUrl("123")).toBe(
        `${proxiedBaseUrl}/streams?id=temp&locationid=123`
      );
    });

    it("- only retrieves matching features", async function () {
      expect(item.geoJsonItem).toBeDefined();
      expect(geoJsonData.type).toEqual("FeatureCollection");
      expect(geoJsonData.features.length).toEqual(1);
    });

    it("- only retrieves matching streams", async function () {
      expect(feature.properties.streamIds.length).toEqual(1);
    });
  });
});
