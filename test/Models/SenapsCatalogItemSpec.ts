import { runInAction } from "mobx";
import _loadWithXhr from "../../lib/Core/loadWithXhr";
import Terria from "../../lib/Models/Terria";
import SenapsLocationsCatalogItem, {
  SenapsFeature,
  SenapsFeatureCollection
} from "../../lib/Models/SenapsLocationsCatalogItem";
import CommonStrata from "../../lib/Models/CommonStrata";
import isDefined from "../../lib/Core/isDefined";
import { JsonArray, JsonObject } from "../../lib/Core/Json";
import { urlInput } from "../../lib/ReactViews/ExplorerWindow/Tabs/MyDataTab/add-data.scss";

interface ExtendedLoadWithXhr {
  (): any;
  load: { (...args: any[]): any; calls: any };
}

const loadWithXhr: ExtendedLoadWithXhr = <any>_loadWithXhr;

describe("SenapsLocationsCatalogItem", function() {
  let terria: Terria;
  let item: SenapsLocationsCatalogItem;
  let geoJsonItem: any;
  let geoJsonData: SenapsFeatureCollection;
  let feature: SenapsFeature;

  const recordId = "a-record-id";
  const proxy = "/api/v0/data/proxy";
  const remoteUrl = "https://senaps.io/api/sensor/v2";
  const newBaseUrl = `${proxy}/${recordId}/${remoteUrl}`;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    item = new SenapsLocationsCatalogItem("test", terria);

    const realLoadWithXhr = loadWithXhr.load;
    spyOn(loadWithXhr, "load").and.callFake(function(...args: any[]) {
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

  it("- has a type and typename", function() {
    expect(item.type).toBe("senaps-locations");
    expect(item.typeName).toBe("Senaps Locations");
  });

  it("- supports zooming to extent", function() {
    expect(item.canZoomTo).toBeTruthy();
  });

  it("- supports show info", function() {
    expect(item.showsInfo).toBeTruthy();
  });

  describe("Can get all items", async function() {
    beforeEach(async function() {
      runInAction(() => {
        item = new SenapsLocationsCatalogItem("test", new Terria());
      });
      await item.loadMapItems();
      geoJsonItem = item.geoJsonItem;
      geoJsonData = (geoJsonItem.geoJsonData as any) as SenapsFeatureCollection;
      feature = geoJsonData.features[0];
    });

    it("- constructs correct locations url", function() {
      expect(item._constructLocationsUrl()).toBe(
        "https://senaps.io/api/sensor/v2/locations?count=1000&expand=true"
      );
    });

    it("- constructs correct streams url", function() {
      expect(item._constructStreamsUrl("123")).toBe(
        "https://senaps.io/api/sensor/v2/streams?locationid=123"
      );
    });

    it("- has the right number of features", function() {
      expect(item.geoJsonItem).toBeDefined();
      expect(geoJsonData).toBeDefined();
      expect(geoJsonData.features.length).toEqual(2);
    });

    it("- has a feature with the right properties", function() {
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

  describe("Can get all items from given base url", async function() {
    beforeEach(async function() {
      runInAction(() => {
        item = new SenapsLocationsCatalogItem("test", new Terria());
        item.setTrait("definition", "url", newBaseUrl);
      });
      await item.loadMapItems();
      geoJsonItem = item.geoJsonItem;
      geoJsonData = (geoJsonItem.geoJsonData as any) as SenapsFeatureCollection;
      feature = geoJsonData.features[0];
    });

    it("- constructs correct locations from a given base url", function() {
      expect(item._constructLocationsUrl()).toBe(
        `${newBaseUrl}/locations?count=1000&expand=true`
      );
    });

    it("- constructs correct streams from a given base url", function() {
      expect(item._constructStreamsUrl("123")).toBe(
        `${newBaseUrl}/streams?locationid=123`
      );
    });

    it("- has the right number of features", function() {
      expect(item.geoJsonItem).toBeDefined();
      expect(geoJsonData).toBeDefined();
      expect(geoJsonData.features.length).toEqual(2);
    });

    it("- has a feature with the right properties", function() {
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

  describe("Can get filtered items", async function() {
    beforeEach(async function() {
      runInAction(() => {
        item = new SenapsLocationsCatalogItem("test", new Terria());
        item.setTrait("definition", "locationIdFilter", "boor");
        item.setTrait("definition", "streamIdFilter", "temp");
      });
      await item.loadMapItems();
      geoJsonItem = item.geoJsonItem;
      geoJsonData = (geoJsonItem.geoJsonData as any) as SenapsFeatureCollection;
      feature = geoJsonData.features[0];
    });

    it("- constructs correct locations url", function() {
      expect(item._constructLocationsUrl()).toBe(
        "https://senaps.io/api/sensor/v2/locations?id=boor&count=1000&expand=true"
      );
    });

    it("- constructs correct streams url", function() {
      expect(item._constructStreamsUrl("123")).toBe(
        "https://senaps.io/api/sensor/v2/streams?id=temp&locationid=123"
      );
    });

    it("- only retrieves matching features", async function() {
      expect(item.geoJsonItem).toBeDefined();
      expect(geoJsonData.type).toEqual("FeatureCollection");
      expect(geoJsonData.features.length).toEqual(1);
    });

    it("- only retrieves matching streams", async function() {
      expect(feature.properties.streamIds.length).toEqual(1);
    });
  });

  describe("Can get filtered items from given base url", async function() {
    beforeEach(async function() {
      runInAction(() => {
        item = new SenapsLocationsCatalogItem("test", new Terria());
        item.setTrait("definition", "locationIdFilter", "boor");
        item.setTrait("definition", "streamIdFilter", "temp");
        item.setTrait("definition", "url", newBaseUrl);
      });
      await item.loadMapItems();
      geoJsonItem = item.geoJsonItem;
      geoJsonData = (geoJsonItem.geoJsonData as any) as SenapsFeatureCollection;
      feature = geoJsonData.features[0];
    });

    it("- constructs correct locations from a given base url", function() {
      expect(item._constructLocationsUrl()).toBe(
        `${newBaseUrl}/locations?id=boor&count=1000&expand=true`
      );
    });

    it("- constructs correct streams from a given base url", function() {
      expect(item._constructStreamsUrl("123")).toBe(
        `${newBaseUrl}/streams?id=temp&locationid=123`
      );
    });

    it("- only retrieves matching features", async function() {
      expect(item.geoJsonItem).toBeDefined();
      expect(geoJsonData.type).toEqual("FeatureCollection");
      expect(geoJsonData.features.length).toEqual(1);
    });

    it("- only retrieves matching streams", async function() {
      expect(feature.properties.streamIds.length).toEqual(1);
    });
  });
});
