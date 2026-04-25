import i18next from "i18next";
import { autorun, runInAction } from "mobx";
import WebMapTileServiceCatalogItem from "../../../../lib/Models/Catalog/Ows/WebMapTileServiceCatalogItem";
import Terria from "../../../../lib/Models/Terria";

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
  // U6-U10 (REST {Time} substitution, KVP TIME param, provider rebuild on time
  // change, etc.) are gated on issue I7 — the imagery-provider-per-time
  // refactor — and intentionally NOT shipped here. They land in the Week 8-10
  // pass after I7 is merged. Do not silently downgrade those to xit/pending.
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
});
