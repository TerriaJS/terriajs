import i18next from "i18next";
import { autorun, runInAction } from "mobx";
import Resource from "terriajs-cesium/Source/Core/Resource";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";
import WebMapTileServiceImageryProvider from "terriajs-cesium/Source/Scene/WebMapTileServiceImageryProvider";
import { ImageryParts } from "../../../../lib/ModelMixins/MappableMixin";
import WebMapTileServiceCatalogItem from "../../../../lib/Models/Catalog/Ows/WebMapTileServiceCatalogItem";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import Terria from "../../../../lib/Models/Terria";

/** The imagery provider the map will use for the currently selected time. */
function currentProvider(wmts: WebMapTileServiceCatalogItem) {
  return wmts.mapItems.filter(ImageryParts.is)[0]?.imageryProvider as
    | WebMapTileServiceImageryProvider
    | undefined;
}

/**
 * The tile URL Cesium requests for the currently selected time, decoded.
 * Cesium fills in `{Time}` template values / KVP query parameters only when
 * building a request, so the provider's `url` alone does not show the time.
 */
async function requestedTileUrl(wmts: WebMapTileServiceCatalogItem) {
  const loadImage = jasmine.isSpy(ImageryProvider.loadImage)
    ? (ImageryProvider.loadImage as jasmine.Spy)
    : spyOn(ImageryProvider, "loadImage").and.returnValue(
        Promise.resolve(new Image())
      );
  await currentProvider(wmts)!.requestImage(0, 0, 0);
  return decodeURIComponent(String(loadImage.calls.mostRecent().args[1]));
}

describe("WebMapTileServiceCatalogItem", function () {
  let terria: Terria;
  let wmts: WebMapTileServiceCatalogItem;
  beforeEach(function () {
    terria = new Terria();
    wmts = new WebMapTileServiceCatalogItem("test", terria);
  });

  it("has a type", function () {
    expect(wmts.type).toBe("wmts");
  });

  it("handles malformed selected times without throwing during map-item evaluation", async function () {
    runInAction(() => {
      wmts.setTrait("definition", "url", "test/WMTS/tern-landscapes-time.xml");
      wmts.setTrait("definition", "layer", "tern_soil_moisture_daily");
      wmts.setTrait("definition", "currentTime", "not-a-date");
    });
    await wmts.loadMetadata();

    expect(wmts.currentTimeAsJulianDate).toBeUndefined();
    expect(wmts.currentDiscreteTimeTag).toBeUndefined();
    expect(() => wmts.mapItems).not.toThrow();

    runInAction(() => {
      wmts.setTrait("definition", "currentTime", "2024-01-02");
    });
    expect(wmts.currentTimeAsJulianDate).toBeDefined();
    expect(wmts.currentDiscreteTimeTag).toContain("2024-01-02");
  });

  it("derives getCapabilitiesUrl from url if getCapabilitiesUrl is not specifiied", function () {
    wmts.setTrait("definition", "url", "http://www.example.com");
    expect(wmts.url).toBeDefined();
    expect(
      wmts.getCapabilitiesUrl &&
        wmts.getCapabilitiesUrl.indexOf(wmts.url || "undefined") === 0
    ).toBeTruthy();
  });

  it("updates description from a GetCapabilities", async function () {
    runInAction(() => {
      wmts.setTrait("definition", "url", "test/WMTS/with_tilematrix.xml");
      wmts.setTrait("definition", "layer", "Some_Layer1");
    });

    let description: string | undefined;
    const cleanup = autorun(() => {
      if (wmts.info !== undefined) {
        const descSection = wmts.info.find(
          (section) =>
            section.name ===
            i18next.t(
              ($) => $.models.webMapTileServiceCatalogItem.dataDescription
            )
        );
        if (
          descSection !== undefined &&
          descSection.content !== undefined &&
          descSection.content !== null
        ) {
          description = descSection.content;
        }
      }
    });

    try {
      await wmts.loadMetadata();
      expect(description).toBe("description foo bar baz");
    } finally {
      cleanup();
    }
  });

  // it("correctly contstructs ImageryProvider with ResourceUrl", async function() {
  //   runInAction(() => {
  //     wmts.setTrait("definition", "url", "test/WMTS/with_tilematrix.xml");
  //     wmts.setTrait("definition", "layer", "Some_Layer1");
  //   });

  //   let mapItems: ImageryParts[] = [];

  //   const cleanup = autorun(() => {
  //     mapItems = wmts.mapItems.slice();
  //   });

  //   try {
  //     await wmts.loadMapItems();

  //     expect(mapItems.length).toBe(1);
  //     expect(mapItems[0].alpha).toBeCloseTo(0.8);
  //     expect(
  //       mapItems[0].imageryProvider instanceof WebMapTileServiceImageryProvider
  //     ).toBeTruthy();
  //     if (
  //       mapItems[0].imageryProvider instanceof WebMapTileServiceImageryProvider
  //     ) {
  //       expect(mapItems[0].imageryProvider.url).toBe(
  //         "https://some.provider/wmts/Some_Layer1/default/GoogleMapsCompatible_Level9/{TileMatrix}/{TileRow}/{TileCol}.png"
  //       );
  //     }
  //   } finally {
  //     cleanup();
  //   }
  // });

  // it("correctly contstructs ImageryProvider", async function() {
  //   runInAction(() => {
  //     wmts.setTrait("definition", "url", "test/WMTS/with_tilematrix.xml");
  //     wmts.setTrait("definition", "layer", "Some_Layer3");
  //   });

  //   let mapItems: ImageryParts[] = [];

  //   const cleanup = autorun(() => {
  //     mapItems = wmts.mapItems.slice();
  //   });

  //   try {
  //     await wmts.loadMapItems();

  //     expect(mapItems.length).toBe(1);
  //     expect(mapItems[0].alpha).toBeCloseTo(0.8);
  //     expect(
  //       mapItems[0].imageryProvider instanceof WebMapTileServiceImageryProvider
  //     ).toBeTruthy();
  //     if (
  //       mapItems[0].imageryProvider instanceof WebMapTileServiceImageryProvider
  //     ) {
  //       const url = new URI(mapItems[0].imageryProvider.url)
  //         .search("")
  //         .toString();
  //       expect(url).toEqual("test/WMTS/with_tilematrix.xml");
  //     }
  //   } finally {
  //     cleanup();
  //   }
  // });

  it("should properly generate tile url request", async function () {
    runInAction(() => {
      wmts.setTrait(
        "definition",
        "url",
        "test/WMTS/with_operation_metadata.xml"
      );
      wmts.setTrait(
        "definition",
        "layer",
        "NWSHELF_ANALYSISFORECAST_PHY_004_013/cmems_mod_nws_phy_anfc_0.027deg-3D_PT1H-m_202309/vo"
      );
    });

    await wmts.loadMapItems();

    // Base URL comes from OperationsMetadata KVP endpoint, not ResourceURL or item URL
    expect(currentProvider(wmts)?.url).toContain(
      "http://wmts.marine.copernicus.eu/teroWmts"
    );
    expect(currentProvider(wmts)?.url).toContain("service=WMTS");
    expect(currentProvider(wmts)?.url).toContain("request=GetTile");
    expect(currentProvider(wmts)?.url).toContain(
      "layer=NWSHELF_ANALYSISFORECAST_PHY_004_013%2Fcmems_mod_nws_phy_anfc_0.027deg-3D_PT1H-m_202309"
    );
  });

  it("calculates correct tileMatrixSet", async function () {
    runInAction(() => {
      wmts.setTrait("definition", "url", "test/WMTS/with_tilematrix.xml");
      wmts.setTrait("definition", "layer", "Some_Layer1");
    });

    await wmts.loadMapItems();
    expect(wmts.tileMatrixSet).toBeDefined();
    expect(wmts.tileMatrixSet!.id).toEqual("GoogleMapsCompatible_Level9");
    expect(wmts.tileMatrixSet!.labels.length).toBe(10);
    expect(wmts.tileMatrixSet!.maxLevel).toBe(9);
    expect(wmts.tileMatrixSet!.minLevel).toBe(0);
    expect(wmts.tileMatrixSet!.tileWidth).toEqual(256);
    expect(wmts.tileMatrixSet!.tileHeight).toEqual(256);
  });

  xit("non existing tile matrix set", async function () {
    runInAction(() => {
      wmts.setTrait("definition", "url", "test/WMTS/with_tilematrix.xml");
      wmts.setTrait("definition", "layer", "Layer_With_Bad_Tilematrixset");
    });
    await wmts.loadMapItems();

    expect(wmts.tileMatrixSet!.id).toEqual(
      "urn:ogc:def:wkss:OGC:1.0:GoogleMapsCompatible"
    );
    expect(wmts.tileMatrixSet!.labels.length).toBe(0);
    expect(wmts.tileMatrixSet!.maxLevel).toBe(0);
    expect(wmts.tileMatrixSet!.minLevel).toBe(0);
    expect(wmts.tileMatrixSet!.tileWidth).toEqual(256);
    expect(wmts.tileMatrixSet!.tileHeight).toEqual(256);
  });

  it("roots the tiling scheme where a geographic matrix set starts dividing the world evenly", async function () {
    // GIBS runs 2, 3, 5, 10, 20, 40 columns. Cesium's default 2x1 root implies
    // 64 columns at level 5, so it asked for columns past the server's 40 and
    // everything east of them (Asia) came back TileOutOfRange.
    runInAction(() => {
      wmts.setTrait("definition", "url", "test/WMTS/nasa-gibs-epsg4326.xml");
      wmts.setTrait("definition", "layer", "MERRA2_2m_Air_Temperature_Monthly");
    });

    await wmts.loadMapItems();

    const tileMatrixSet = wmts.tileMatrixSet!;
    expect(tileMatrixSet.id).toBe("2km");
    // The coarser matrices have no uniform equivalent, so level 0 is "3".
    expect(tileMatrixSet.labels).toEqual(["3", "4", "5"]);
    expect(tileMatrixSet.minLevel).toBe(0);
    expect(tileMatrixSet.maxLevel).toBe(2);
    expect(tileMatrixSet.scheme.getNumberOfXTilesAtLevel(0)).toBe(10);
    expect(tileMatrixSet.scheme.getNumberOfYTilesAtLevel(0)).toBe(5);
    // The deepest level must match what the server advertises.
    expect(tileMatrixSet.scheme.getNumberOfXTilesAtLevel(2)).toBe(40);
    expect(tileMatrixSet.scheme.getNumberOfYTilesAtLevel(2)).toBe(20);
  });

  it("rejects a matrix set whose tiles never divide the globe evenly", async function () {
    // 5 columns of 72 degrees span 360, but 3 rows of 72 span 216, so no
    // uniform scheme can describe it. Better no imagery than misplaced tiles.
    runInAction(() => {
      wmts.setTrait("definition", "url", "test/WMTS/nasa-gibs-epsg4326.xml");
      wmts.setTrait("definition", "layer", "Coarse_16km");
    });

    await wmts.loadMapItems();

    expect(wmts.tileMatrixSet).toBeUndefined();
    expect(wmts.mapItems).toEqual([]);
  });

  describe("time dimension parsing", function () {
    it("expands explicit <Value> children into discrete times (NASA GIBS style)", async function () {
      runInAction(() => {
        wmts.setTrait("definition", "url", "test/WMTS/nasa-gibs-time.xml");
        wmts.setTrait(
          "definition",
          "layer",
          "MODIS_Terra_CorrectedReflectance_TrueColor"
        );
      });

      await wmts.loadMetadata();

      expect(wmts.discreteTimes).toBeDefined();
      expect(wmts.discreteTimes!.length).toBe(3);
      expect(wmts.discreteTimes!.map((t) => t.time)).toEqual([
        "2024-03-13",
        "2024-03-14",
        "2024-03-15"
      ]);
    });

    it("expands an ISO 19128 start/stop/period range (TERN style)", async function () {
      runInAction(() => {
        wmts.setTrait(
          "definition",
          "url",
          "test/WMTS/tern-landscapes-time.xml"
        );
        wmts.setTrait("definition", "layer", "tern_soil_moisture_daily");
      });

      await wmts.loadMetadata();

      expect(wmts.discreteTimes).toBeDefined();
      // 2024-01-01..2024-01-05 with P1D step -> 5 instants
      expect(wmts.discreteTimes!.length).toBe(5);
      expect(wmts.discreteTimes![0].time).toContain("2024-01-01");
      expect(wmts.discreteTimes![4].time).toContain("2024-01-05");
    });

    it("uses <Default> for the initially-selected time when present", async function () {
      runInAction(() => {
        wmts.setTrait("definition", "url", "test/WMTS/nasa-gibs-time.xml");
        wmts.setTrait(
          "definition",
          "layer",
          "MODIS_Terra_CorrectedReflectance_TrueColor"
        );
      });

      await wmts.loadMetadata();

      // <Default> is deliberately neither the first nor the last <Value>.
      expect(wmts.currentTime).toBe("2024-03-13");
    });

    it("uses initialTimeSource when no <Default> is supplied", async function () {
      runInAction(() => {
        wmts.setTrait("definition", "initialTimeSource", "start");
        wmts.setTrait(
          "definition",
          "url",
          "test/WMTS/nasa-gibs-time-no-default.xml"
        );
        wmts.setTrait(
          "definition",
          "layer",
          "MODIS_Terra_CorrectedReflectance_TrueColor_NoDefault"
        );
      });

      await wmts.loadMetadata();

      expect(wmts.currentTime).toBe(wmts.startTime);
      expect(wmts.currentDiscreteTimeTag).toBe("2024-03-13");
    });

    it("expands a slash-separated range with no period (TERN/GeoServer style)", async function () {
      runInAction(() => {
        wmts.setTrait(
          "definition",
          "url",
          "test/WMTS/tern-landscapes-time.xml"
        );
        wmts.setTrait(
          "definition",
          "layer",
          "tern_soil_moisture_daily_no_period"
        );
      });

      await wmts.loadMetadata();

      // No period given: createDiscreteTimesFromIsoSegments picks one from
      // the span (4 days -> hourly -> 97 inclusive instants).
      expect(wmts.discreteTimes).toBeDefined();
      expect(wmts.discreteTimes!.length).toBe(97);
      expect(wmts.discreteTimes![0].time).toContain("2024-01-01T00:00");
      expect(wmts.discreteTimes![96].time).toContain("2024-01-05T00:00");
    });
  });

  describe("explicit timeValues", function () {
    it("preserves explicit timestamp tags and orders the timeline chronologically", function () {
      const values = ["2024-01-01T00:00:00-12:00", "2024-01-01T23:00:00+14:00"];
      runInAction(() => {
        wmts.setTrait(CommonStrata.definition, "timeValues", values);
      });

      expect(wmts.discreteTimes?.map((time) => time.time)).toEqual(values);
      expect(
        wmts.discreteTimesAsSortedJulianDates?.map((time) => time.tag)
      ).toEqual([values[1], values[0]]);
      expect(wmts.timeValues).toEqual(values);
    });

    it("expands ISO intervals alongside explicit timestamps", function () {
      runInAction(() => {
        wmts.setTrait(CommonStrata.definition, "timeValues", [
          "2024-01-01/2024-01-03/P1D",
          "2024-01-05"
        ]);
      });

      expect(wmts.discreteTimes?.map((time) => time.time)).toEqual([
        "2024-01-01",
        "2024-01-02",
        "2024-01-03",
        "2024-01-05"
      ]);
    });

    it("limits interval expansion with maxRefreshIntervals", function () {
      runInAction(() => {
        wmts.setTrait(CommonStrata.definition, "maxRefreshIntervals", 2);
        wmts.setTrait(CommonStrata.definition, "timeValues", [
          "2024-01-01/2024-01-05/P1D"
        ]);
      });

      expect(wmts.discreteTimes?.map((time) => time.time)).toEqual([
        "2024-01-01",
        "2024-01-02"
      ]);
    });

    it("uses timeValues and currentTime over competing capabilities", async function () {
      runInAction(() => {
        wmts.setTrait(
          CommonStrata.definition,
          "url",
          "test/WMTS/tern-landscapes-time.xml"
        );
        wmts.setTrait(
          CommonStrata.definition,
          "layer",
          "tern_soil_moisture_daily"
        );
        wmts.setTrait(CommonStrata.definition, "timeValues", [
          "2023-01-01/2023-01-03/P1D"
        ]);
        wmts.setTrait(CommonStrata.definition, "currentTime", "2023-01-02");
      });

      await wmts.loadMapItems();

      expect(wmts.discreteTimes?.map((time) => time.time)).toEqual([
        "2023-01-01",
        "2023-01-02",
        "2023-01-03"
      ]);
      expect(wmts.currentTime).toBe("2023-01-02");
      expect(await requestedTileUrl(wmts)).toContain("/2023-01-02/");

      runInAction(() => {
        wmts.setTrait(CommonStrata.user, "currentTime", "2023-01-03");
      });
      expect(await requestedTileUrl(wmts)).toContain("/2023-01-03/");
    });

    [undefined, []].forEach((timeValues) => {
      it(`uses capabilities when timeValues is ${timeValues === undefined ? "absent" : "empty"}`, async function () {
        runInAction(() => {
          wmts.setTrait(
            CommonStrata.definition,
            "url",
            "test/WMTS/tern-landscapes-time.xml"
          );
          wmts.setTrait(
            CommonStrata.definition,
            "layer",
            "tern_soil_moisture_daily"
          );
          wmts.setTrait(CommonStrata.definition, "timeValues", timeValues);
        });

        await wmts.loadMetadata();

        expect(wmts.discreteTimes?.length).toBe(5);
        expect(wmts.discreteTimes?.[0].time).toContain("2024-01-01");
        expect(wmts.discreteTimes?.[4].time).toContain("2024-01-05");
      });
    });
  });

  describe("imagery provider per time", function () {
    it("substitutes {time} in the REST ResourceURL with the selected currentTime", async function () {
      runInAction(() => {
        wmts.setTrait(
          "definition",
          "url",
          "test/WMTS/tern-landscapes-time.xml"
        );
        wmts.setTrait("definition", "layer", "tern_soil_moisture_daily");
      });

      await wmts.loadMapItems();

      // The TERN fixture's <Default> is 2024-01-05T00:00:00Z and the
      // ResourceURL template contains a lowercase `{time}` placeholder.
      const url = await requestedTileUrl(wmts);
      expect(url).toContain("/2024-01-05T00:00:00Z/");
      expect(url).not.toContain("{time}");
      expect(url).not.toContain("{Time}");
    });

    it("prefers the REST ResourceURL that carries a {Time} placeholder when the layer advertises several", async function () {
      // NASA GIBS advertises three tile templates per layer:
      //   .../default/{Time}/{TileMatrixSet}/...
      //   .../default/{TileMatrixSet}/...
      //   .../default/default/{TileMatrixSet}/...
      // Picking the last one silently serves the server's default time for
      // every frame. The selected time must reach the URL.
      runInAction(() => {
        wmts.setTrait("definition", "url", "test/WMTS/nasa-gibs-time.xml");
        wmts.setTrait(
          "definition",
          "layer",
          "MODIS_Terra_CorrectedReflectance_TrueColor"
        );
        wmts.setTrait("definition", "currentTime", "2024-03-14");
      });

      await wmts.loadMapItems();

      const url = await requestedTileUrl(wmts);
      expect(url).toContain(
        "/MODIS_Terra_CorrectedReflectance_TrueColor/default/2024-03-14/"
      );
      expect(url).not.toContain("/default/default/");
    });

    it("passes the selected time as a Time dimension on the imagery provider", async function () {
      runInAction(() => {
        wmts.setTrait("definition", "url", "test/WMTS/nasa-gibs-time.xml");
        wmts.setTrait(
          "definition",
          "layer",
          "MODIS_Terra_CorrectedReflectance_TrueColor"
        );
      });

      await wmts.loadMapItems();

      // Cesium's KVP-mode tile fetch consumes the `dimensions: { Time }`
      // constructor option (it appends &TIME=... to the GetTile request).
      // Assert it round-trips through the provider regardless of the REST
      // {Time} substitution above. <Default> is 2024-03-13.
      expect(currentProvider(wmts)?.dimensions).toEqual({ Time: "2024-03-13" });
    });

    it("substitutes uppercase {Time} in the REST ResourceURL", async function () {
      runInAction(() => {
        wmts.setTrait(
          "definition",
          "url",
          "test/WMTS/tern-landscapes-time-uppercase.xml"
        );
        wmts.setTrait("definition", "layer", "tern_soil_moisture_daily");
      });

      await wmts.loadMapItems();

      // NASA GIBS convention: capital T in the placeholder.
      const url = await requestedTileUrl(wmts);
      expect(url).toContain("/2024-01-05T00:00:00Z/");
      expect(url).not.toContain("{Time}");
      expect(url).not.toContain("{time}");
    });

    it("propagates allowFeaturePicking onto the current imagery and disables it on the next", async function () {
      runInAction(() => {
        wmts.setTrait(
          "definition",
          "url",
          "test/WMTS/tern-landscapes-time.xml"
        );
        wmts.setTrait("definition", "layer", "tern_soil_moisture_daily");
      });

      await wmts.loadMapItems();
      terria.timelineStack.addToTop(wmts);
      terria.timelineStack.activate();

      runInAction(() => {
        wmts.setTrait("definition", "isPaused", false);
        // A non-final time, so a next discrete time exists.
        wmts.setTrait("definition", "currentTime", "2024-01-02T00:00:00Z");
      });

      // mapItems[0] = current, mapItems[1] = next during cross-fade (as WMS).
      const imageryParts = wmts.mapItems.filter(ImageryParts.is);
      expect(imageryParts.length).toBe(2);

      const currentProvider = imageryParts[0].imageryProvider as any;
      expect(currentProvider.enablePickFeatures).toBe(true);

      const nextProvider = imageryParts[1].imageryProvider as any;
      expect(nextProvider.enablePickFeatures).toBe(false);

      // Flip allowFeaturePicking and reload — current should follow.
      runInAction(() => {
        wmts.setTrait("definition", "allowFeaturePicking", false);
      });
      const partsAfter = wmts.mapItems.filter(ImageryParts.is);
      const currentProviderAfter = partsAfter[0].imageryProvider as any;
      expect(currentProviderAfter.enablePickFeatures).toBe(false);
    });

    it("sends the selected time as a query parameter on KVP GetTile requests", async function () {
      // Copernicus Marine only offers KVP GetTile. Cesium composes the tile
      // URL at request time (base URL + DefaultParameters + `dimensions`), so
      // observe the Resource it hands to ImageryProvider.loadImage rather
      // than the provider's base url.
      runInAction(() => {
        wmts.setTrait(
          "definition",
          "url",
          "test/WMTS/with_operation_metadata.xml"
        );
        wmts.setTrait(
          "definition",
          "layer",
          "NWSHELF_ANALYSISFORECAST_PHY_004_013/cmems_mod_nws_phy_anfc_0.027deg-3D_PT1H-m_202309/vo"
        );
        wmts.setTrait("definition", "currentTime", "2023-08-01T00:00:00Z");
      });

      await wmts.loadMapItems();

      const query = new URL(await requestedTileUrl(wmts)).searchParams;
      expect(query.get("request")).toBe("GetTile");
      expect(query.get("Time")).toBe("2023-08-01T00:00:00Z");

      // Selecting another time must reach the next request too.
      runInAction(() => {
        wmts.setTrait(CommonStrata.user, "currentTime", "2023-08-02T00:00:00Z");
      });
      expect(
        new URL(await requestedTileUrl(wmts)).searchParams.get("Time")
      ).toBe("2023-08-02T00:00:00Z");
    });

    it("rebuilds the imagery provider when currentTime changes", async function () {
      runInAction(() => {
        wmts.setTrait(
          "definition",
          "url",
          "test/WMTS/tern-landscapes-time.xml"
        );
        wmts.setTrait("definition", "layer", "tern_soil_moisture_daily");
      });

      await wmts.loadMapItems();

      const providerAtDefault = currentProvider(wmts);
      expect(await requestedTileUrl(wmts)).toContain("/2024-01-05T00:00:00Z/");

      runInAction(() => {
        wmts.setTrait("definition", "currentTime", "2024-01-02T00:00:00Z");
      });

      // Providers are cached per time, so a new time is a new instance with
      // its own dimension value.
      const providerAtNewTime = currentProvider(wmts);
      expect(providerAtNewTime).not.toBe(providerAtDefault);
      const url = await requestedTileUrl(wmts);
      expect(url).toContain("/2024-01-02T00:00:00Z/");
      expect(url).not.toContain("2024-01-05T00:00:00Z");
    });
  });

  describe("feature picking", function () {
    const featureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [0, 0] },
          properties: { soil_moisture: 0.42 }
        }
      ]
    };

    /** Runs a pick through Cesium and returns the decoded GetFeatureInfo URL plus the features. */
    async function pick(wmts: WebMapTileServiceCatalogItem) {
      const fetchJson = spyOn(Resource.prototype, "fetchJson").and.returnValue(
        Promise.resolve(featureCollection)
      );
      const features = await currentProvider(wmts)!.pickFeatures(0, 0, 0, 0, 0);
      const resource = fetchJson.calls.mostRecent().object as Resource;
      return { url: decodeURIComponent(String(resource)), features };
    }

    it("requests the advertised RESTful FeatureInfo template with pixel and time filled in", async function () {
      runInAction(() => {
        wmts.setTrait(
          "definition",
          "url",
          "test/WMTS/tern-landscapes-time.xml"
        );
        wmts.setTrait("definition", "layer", "tern_soil_moisture_daily");
        wmts.setTrait("definition", "currentTime", "2024-01-03T00:00:00Z");
      });
      await wmts.loadMapItems();

      const { url, features } = await pick(wmts);
      expect(url).toContain(
        "/tern_soil_moisture_daily/default/2024-01-03T00:00:00Z/"
      );
      expect(url).toMatch(/\/\d+\/\d+\?format=application\/json$/);
      expect(url).not.toContain("{");
      expect(features?.length).toBe(1);
      expect(features?.[0].properties).toEqual({ soil_moisture: 0.42 });
    });

    it("sends a KVP GetFeatureInfo request with the layer's InfoFormat and the selected time", async function () {
      runInAction(() => {
        wmts.setTrait(
          "definition",
          "url",
          "test/WMTS/with_operation_metadata.xml"
        );
        wmts.setTrait(
          "definition",
          "layer",
          "NWSHELF_ANALYSISFORECAST_PHY_004_013/cmems_mod_nws_phy_anfc_0.027deg-3D_PT1H-m_202309/vo"
        );
        wmts.setTrait("definition", "currentTime", "2023-08-01T00:00:00Z");
      });
      await wmts.loadMapItems();

      const { url, features } = await pick(wmts);
      const query = new URL(url).searchParams;
      expect(query.get("request")).toBe("GetFeatureInfo");
      expect(query.get("infoformat")).toBe("application/json");
      expect(query.get("Time")).toBe("2023-08-01T00:00:00Z");
      expect(query.get("i")).toMatch(/^\d+$/);
      expect(query.get("j")).toMatch(/^\d+$/);
      expect(features?.length).toBe(1);
    });

    it("does not pick on a layer that advertises no feature info (NASA GIBS)", async function () {
      // GIBS has neither <InfoFormat> nor a FeatureInfo ResourceURL, so Cesium
      // would otherwise send GetFeatureInfo to the tile template (a .png).
      runInAction(() => {
        wmts.setTrait("definition", "url", "test/WMTS/nasa-gibs-time.xml");
        wmts.setTrait(
          "definition",
          "layer",
          "MODIS_Terra_CorrectedReflectance_TrueColor"
        );
      });
      await wmts.loadMapItems();

      expect(wmts.allowFeaturePicking).toBe(true);
      expect(wmts.supportsFeatureInfo).toBe(false);
      expect(currentProvider(wmts)?.enablePickFeatures).toBe(false);
    });

    it("picks such a layer once getFeatureInfoUrl is configured", async function () {
      runInAction(() => {
        wmts.setTrait("definition", "url", "test/WMTS/nasa-gibs-time.xml");
        wmts.setTrait(
          "definition",
          "layer",
          "MODIS_Terra_CorrectedReflectance_TrueColor"
        );
        wmts.setTrait(
          "definition",
          "getFeatureInfoUrl",
          "https://gibs.example/info/{TileMatrix}/{TileRow}/{TileCol}/{i}/{j}"
        );
      });
      await wmts.loadMapItems();

      expect(currentProvider(wmts)?.enablePickFeatures).toBe(true);
    });

    it("uses the getFeatureInfoUrl trait over the advertised template", async function () {
      runInAction(() => {
        wmts.setTrait(
          "definition",
          "url",
          "test/WMTS/tern-landscapes-time.xml"
        );
        wmts.setTrait("definition", "layer", "tern_soil_moisture_daily");
        wmts.setTrait(
          "definition",
          "getFeatureInfoUrl",
          "https://custom.example/info/{TileMatrix}/{TileRow}/{TileCol}/{i}/{j}"
        );
      });
      await wmts.loadMapItems();

      const { url } = await pick(wmts);
      expect(url).toMatch(
        /^https:\/\/custom\.example\/info\/\d+\/\d+\/\d+\/\d+\/\d+$/
      );
    });
  });
});
