import i18next from "i18next";
import { autorun, runInAction } from "mobx";
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

  // ---------------------------------------------------------------------------
  // Time dimension parsing.
  //
  // Specs in this block correspond to plan items U1-U5 (Verification > Phase 2).
  // U6-U8 (REST {Time} substitution, KVP TIME dimension on the imagery
  // provider, provider rebuild on currentTime change) live in the sibling
  // `imagery provider per time` describe block below — they exercise the I7
  // imagery-provider-per-time refactor (`_createImageryProvider(time)`),
  // not the capabilities-parsing layer.
  // ---------------------------------------------------------------------------
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

      // Discriminating assertion: the fixture's <Default>2024-03-13</Default>
      // is NOT the last <Value> (which is 2024-03-15). This assertion only
      // passes when the <Default> branch fires; it FAILS if the
      // last-element fallback runs instead.
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

      // The <Value> "2024-01-01T00:00:00Z/2024-01-05T00:00:00Z" has only two
      // slash segments — period is undefined. createDiscreteTimesFromIsoSegments
      // picks a default duration based on the span (see createDiscreteTimes.ts
      // lines 30-67). A 4-day (96-hour) span falls into the `1000 * hour`
      // bucket -> 1-hour duration -> 97 inclusive hourly instants
      // (00:00..96:00). The point of this spec is to prove the helper
      // handles `period=undefined` gracefully end-to-end; the exact count
      // is asserted to lock in the helper's bucket-selection contract.
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
      expect(currentProvider(wmts)?.url).toContain("2023-01-02");

      runInAction(() => {
        wmts.setTrait(CommonStrata.user, "currentTime", "2023-01-03");
      });
      expect(currentProvider(wmts)?.url).toContain("2023-01-03");
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

  // ---------------------------------------------------------------------------
  // Imagery provider per time (issue I7).
  //
  // These specs exercise `_createImageryProvider(time)` — the per-time provider
  // factory introduced by the I7 refactor. Two propagation paths are covered:
  //
  //   1. REST `{Time}`/`{time}` placeholder substitution into `imageryProvider.url`
  //      (TERN-style ResourceURL templates).
  //   2. `dimensions: { Time }` constructor option on the imagery provider,
  //      which Cesium routes to `&TIME=` query param appends on KVP GetTile
  //      and to `setTemplateValues` on REST. The dimensions option is set
  //      whenever a time is selected, regardless of REST/KVP encoding —
  //      asserting it on the GIBS fixture (REST template lacking `{Time}`)
  //      proves the KVP-bound code path fires independently of substitution.
  //
  // U6-U8 from the plan. U9-U10 (cache hit on second-pass scrub, no-time
  // layers behave unchanged) are integration-level and land in I9/I14.
  // ---------------------------------------------------------------------------
  describe("imagery provider per time", function () {
    it("substitutes {time} in the REST ResourceURL with the selected currentTime (U6)", async function () {
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
      // ResourceURL template contains a `{time}` placeholder. After
      // _createImageryProvider runs, the provider's url MUST have the
      // placeholder substituted with the default-selected time.
      // Discriminating assertion: a literal `{time}` in the URL would prove
      // the substitution path didn't fire.
      expect(currentProvider(wmts)?.url).toContain("2024-01-05T00:00:00Z");
      expect(currentProvider(wmts)?.url).not.toContain("{time}");
      expect(currentProvider(wmts)?.url).not.toContain("{Time}");
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

      const url = currentProvider(wmts)?.url;
      expect(url).toContain(
        "/MODIS_Terra_CorrectedReflectance_TrueColor/default/2024-03-14/{TileMatrixSet}/"
      );
      expect(url).not.toContain("/default/default/");
    });

    it("passes the selected time as a Time dimension on the imagery provider (U7)", async function () {
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

    it("substitutes uppercase {Time} in the REST ResourceURL (U6b)", async function () {
      runInAction(() => {
        wmts.setTrait(
          "definition",
          "url",
          "test/WMTS/tern-landscapes-time-uppercase.xml"
        );
        wmts.setTrait("definition", "layer", "tern_soil_moisture_daily");
      });

      await wmts.loadMapItems();

      // The uppercase fixture's ResourceURL template literally contains
      // `{Time}` (capital T — Cesium / NASA GIBS convention). The
      // implementation regex `/\{time\}/gi` carries the `i` flag specifically
      // to handle this case. Positive assertion: the timestamp appears
      // where `{Time}` was. Negative assertion: no leftover placeholder
      // in either case. Together these prove the case-insensitive substitution
      // path actually fires (not just the lowercase one tested in U6).
      expect(currentProvider(wmts)?.url).toContain("2024-01-05T00:00:00Z");
      expect(currentProvider(wmts)?.url).not.toContain("{Time}");
      expect(currentProvider(wmts)?.url).not.toContain("{time}");
    });

    it("propagates allowFeaturePicking onto _currentImageryParts and disables it on _nextImageryParts (U6c)", async function () {
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
        // Force a non-default `currentTime` so a `nextDiscreteTimeTag` exists
        // and `_nextImageryParts` resolves.
        wmts.setTrait("definition", "currentTime", "2024-01-02T00:00:00Z");
      });

      // mapItems[0] = current, mapItems[1] = next during cross-fade.
      // Mirror of WMS spec at WebMapServiceCatalogItemSpec.ts:720-735. Cesium's
      // WMTS provider has no real picking implementation today; this assertion
      // verifies the plumbing matches WMS shape so upstream parity holds.
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

      const loadImage = spyOn(ImageryProvider, "loadImage").and.returnValue(
        Promise.resolve(new Image())
      );
      const requestedUrl = () =>
        new URL(String(loadImage.calls.mostRecent().args[1]));
      await currentProvider(wmts)!.requestImage(0, 0, 0);

      const query = requestedUrl().searchParams;
      expect(query.get("request")).toBe("GetTile");
      expect(query.get("Time")).toBe("2023-08-01T00:00:00Z");

      // Selecting another time must reach the next request too.
      runInAction(() => {
        wmts.setTrait(CommonStrata.user, "currentTime", "2023-08-02T00:00:00Z");
      });
      await currentProvider(wmts)!.requestImage(0, 0, 0);
      expect(requestedUrl().searchParams.get("Time")).toBe(
        "2023-08-02T00:00:00Z"
      );
    });

    it("rebuilds the imagery provider when currentTime changes (U8)", async function () {
      runInAction(() => {
        wmts.setTrait(
          "definition",
          "url",
          "test/WMTS/tern-landscapes-time.xml"
        );
        wmts.setTrait("definition", "layer", "tern_soil_moisture_daily");
      });

      await wmts.loadMapItems();

      // Snapshot the provider at the default time.
      const providerAtDefault = currentProvider(wmts);
      expect(providerAtDefault).toBeDefined();
      expect(providerAtDefault!.url).toContain("2024-01-05T00:00:00Z");

      // Flip currentTime to an earlier discrete instant. The
      // `createTransformerAllowUndefined` cache means the provider is keyed
      // by the time string — a different time MUST produce a different
      // provider instance with a different substituted URL.
      runInAction(() => {
        wmts.setTrait("definition", "currentTime", "2024-01-02T00:00:00Z");
      });

      const providerAtNewTime = currentProvider(wmts);
      expect(providerAtNewTime).toBeDefined();
      // Discriminating assertion #1: the new URL reflects the new time.
      expect(providerAtNewTime!.url).toContain("2024-01-02T00:00:00Z");
      expect(providerAtNewTime!.url).not.toContain("2024-01-05T00:00:00Z");
      // Discriminating assertion #2: it is a *different* provider instance.
      // If the transformer returned the cached default-time provider, this
      // would fail and prove the per-time keying is broken.
      expect(providerAtNewTime).not.toBe(providerAtDefault);
    });
  });
});
