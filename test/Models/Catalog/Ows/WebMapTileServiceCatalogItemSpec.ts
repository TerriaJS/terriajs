import i18next from "i18next";
import { autorun, runInAction } from "mobx";
import { ImageryParts } from "../../../../lib/ModelMixins/MappableMixin";
import WebMapTileServiceCatalogItem from "../../../../lib/Models/Catalog/Ows/WebMapTileServiceCatalogItem";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import createStratumInstance from "../../../../lib/Models/Definition/createStratumInstance";
import Terria from "../../../../lib/Models/Terria";
import { WebMapTileServiceTimeTraits } from "../../../../lib/Traits/TraitsClasses/WebMapTileServiceCatalogItemTraits";

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
            i18next.t("models.webMapTileServiceCatalogItem.dataDescription")
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

    expect(wmts.imageryProvider?.url).toBe(
      "http://wmts.marine.copernicus.eu/teroWmts?service=WMTS&version=1.0.0&request=GetTile"
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

    it("falls back to the most recent <Value> when no <Default> is supplied", async function () {
      runInAction(() => {
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

      // Per upstream issue #7742 acceptance criteria ("otherwise latest
      // discrete time"), absence of <Default> must yield the chronologically
      // last <Value>, not undefined. This is intentional WMTS divergence
      // from WMS — see the comment block on `currentTime` in the stratum.
      expect(wmts.currentTime).toBe("2024-03-15");
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

  // ---------------------------------------------------------------------------
  // Explicit `time` trait override (issue #14).
  //
  // GeoServer's GeoWebCache does NOT advertise <Dimension> in GetCapabilities
  // even when the underlying layer has time metadata. Catalog JSON authors
  // must be able to declare the time set explicitly. The override stratum
  // (TimeOverrideStratum) translates the `time` trait into discreteTimes /
  // currentTime at higher priority than GetCapabilitiesStratum. When unset,
  // the stratum returns undefined for everything and existing GetCapabilities-
  // driven behaviour is preserved (regression spec below).
  // ---------------------------------------------------------------------------
  describe("explicit time override (issue #14)", function () {
    it("uses time.values verbatim as discreteTimes, sorted ascending", function () {
      // Path 1: explicit `values` list. We deliberately supply them out of
      // order to lock in the documented contract that the stratum sorts
      // ascending — UI timeline scrubbing relies on monotonically-increasing
      // discrete times.
      runInAction(() => {
        wmts.setTrait(
          CommonStrata.user,
          "time",
          createStratumInstance(WebMapTileServiceTimeTraits, {
            values: [
              "2024-01-03T00:00:00Z",
              "2024-01-01T00:00:00Z",
              "2024-01-02T00:00:00Z"
            ]
          })
        );
      });

      // No GetCapabilities load is performed — the override stratum produces
      // discreteTimes synchronously off the trait.
      expect(wmts.discreteTimes).toBeDefined();
      expect(wmts.discreteTimes!.length).toBe(3);
      expect(wmts.discreteTimes![0].time).toBe("2024-01-01T00:00:00Z");
      expect(wmts.discreteTimes![1].time).toBe("2024-01-02T00:00:00Z");
      expect(wmts.discreteTimes![2].time).toBe("2024-01-03T00:00:00Z");
    });

    it("expands time.start/stop/period via createDiscreteTimesFromIsoSegments", function () {
      // Path 2: ISO range. Mirrors the GetCapabilities range path
      // (createDiscreteTimesFromIsoSegments) but driven from catalog JSON.
      // P1D over 4 days = 5 inclusive instants (Jan 1, 2, 3, 4, 5).
      runInAction(() => {
        wmts.setTrait(
          CommonStrata.user,
          "time",
          createStratumInstance(WebMapTileServiceTimeTraits, {
            start: "2024-01-01T00:00:00Z",
            stop: "2024-01-05T00:00:00Z",
            period: "P1D"
          })
        );
      });

      expect(wmts.discreteTimes).toBeDefined();
      expect(wmts.discreteTimes!.length).toBe(5);
      expect(wmts.discreteTimes![0].time).toContain("2024-01-01");
      expect(wmts.discreteTimes![4].time).toContain("2024-01-05");
    });

    it("selects time.defaultValue as currentTime when set", function () {
      // currentTime priority: explicit defaultValue > most-recent discrete
      // time > undefined. The most-recent value here is 2024-01-03 — asserting
      // currentTime resolves to 2024-01-02 proves defaultValue takes precedence
      // over the recency fallback.
      runInAction(() => {
        wmts.setTrait(
          CommonStrata.user,
          "time",
          createStratumInstance(WebMapTileServiceTimeTraits, {
            values: [
              "2024-01-01T00:00:00Z",
              "2024-01-02T00:00:00Z",
              "2024-01-03T00:00:00Z"
            ],
            defaultValue: "2024-01-02T00:00:00Z"
          })
        );
      });

      expect(wmts.currentTime).toBe("2024-01-02T00:00:00Z");
    });

    it("falls through to GetCapabilities when the time trait is absent (regression)", async function () {
      // Regression: with no `time` trait set, the override stratum's getters
      // return undefined and GetCapabilitiesStratum drives discreteTimes /
      // currentTime — i.e., existing behaviour is preserved. This is the
      // critical "do no harm" assertion: if this spec fails, every existing
      // WMTS catalog item with a server-advertised <Dimension> is broken.
      runInAction(() => {
        wmts.setTrait(
          "definition",
          "url",
          "test/WMTS/tern-landscapes-time.xml"
        );
        wmts.setTrait("definition", "layer", "tern_soil_moisture_daily");
      });

      await wmts.loadMetadata();

      // The TERN fixture advertises a daily P1D range over 5 days
      // (2024-01-01..2024-01-05) — same fixture used by the GetCapabilities
      // range spec above. 5 discrete times must come through unchanged.
      // Note: TerriaJS object traits always materialize a wrapper model for
      // property access — `wmts.time` is not `undefined` even when no stratum
      // has set values. The meaningful regression check is on the unset inner
      // fields plus the discreteTimes pass-through from GetCapabilities.
      expect(wmts.time?.values).toBeUndefined();
      expect(wmts.time?.start).toBeUndefined();
      expect(wmts.time?.stop).toBeUndefined();
      expect(wmts.time?.period).toBeUndefined();
      expect(wmts.time?.defaultValue).toBeUndefined();
      expect(wmts.discreteTimes).toBeDefined();
      expect(wmts.discreteTimes!.length).toBe(5);
      expect(wmts.discreteTimes![0].time).toContain("2024-01-01");
      expect(wmts.discreteTimes![4].time).toContain("2024-01-05");
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
      expect(wmts.imageryProvider).toBeDefined();
      expect(wmts.imageryProvider!.url).toContain("2024-01-05T00:00:00Z");
      expect(wmts.imageryProvider!.url).not.toContain("{time}");
      expect(wmts.imageryProvider!.url).not.toContain("{Time}");
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

      // The GIBS fixture's ResourceURL template does NOT contain a {Time}
      // placeholder — Cesium's KVP-mode tile fetch is what consumes the
      // `dimensions: { Time }` constructor option (it appends &TIME=...
      // to the GetTile request). We assert the dimensions option round-
      // trips through the provider so the KVP code path is exercised
      // independently of REST {Time} substitution. <Default> is 2024-03-13.
      expect(wmts.imageryProvider).toBeDefined();
      expect(wmts.imageryProvider!.dimensions).toEqual({ Time: "2024-03-13" });
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
      expect(wmts.imageryProvider).toBeDefined();
      expect(wmts.imageryProvider!.url).toContain("2024-01-05T00:00:00Z");
      expect(wmts.imageryProvider!.url).not.toContain("{Time}");
      expect(wmts.imageryProvider!.url).not.toContain("{time}");
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
      const providerAtDefault = wmts.imageryProvider;
      expect(providerAtDefault).toBeDefined();
      expect(providerAtDefault!.url).toContain("2024-01-05T00:00:00Z");

      // Flip currentTime to an earlier discrete instant. The
      // `createTransformerAllowUndefined` cache means the provider is keyed
      // by the time string — a different time MUST produce a different
      // provider instance with a different substituted URL.
      runInAction(() => {
        wmts.setTrait("definition", "currentTime", "2024-01-02T00:00:00Z");
      });

      const providerAtNewTime = wmts.imageryProvider;
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
