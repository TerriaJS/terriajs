import { runInAction } from "mobx";
import SdmxJsonCatalogItem from "../../../../lib/Models/Catalog/SdmxJson/SdmxJsonCatalogItem";
import createStratumInstance from "../../../../lib/Models/Definition/createStratumInstance";
import Terria from "../../../../lib/Models/Terria";
import TableColumnType from "../../../../lib/Table/TableColumnType";
import { ModelOverrideTraits } from "../../../../lib/Traits/TraitsClasses/SdmxCommonTraits";

const regionMapping = JSON.stringify(
  require("../../../../wwwroot/data/regionMapping.json")
);

const steCodes = JSON.stringify(
  require("../../../../wwwroot/data/regionids/region_map-STE_2016_AUST_STE_CODE16.json")
);

const isoCodes = JSON.stringify(
  require("../../../../wwwroot/data/regionids/region_map-FID_TM_WORLD_BORDERS_ISO2.json")
);

const dataflowNoRegionData = require("raw-loader!../../../../wwwroot/test/SDMX-JSON/data-noregion.csv");
const dataflowRegionData = require("raw-loader!../../../../wwwroot/test/SDMX-JSON/data-region.csv");
const dataflowRegionTimeData = require("raw-loader!../../../../wwwroot/test/SDMX-JSON/data-region-time.csv");
const dataflowSingleRegionTimeData = require("raw-loader!../../../../wwwroot/test/SDMX-JSON/data-single-region-time.csv");

const dataflowNoRegion = JSON.stringify(
  require("../../../../wwwroot/test/SDMX-JSON/dataflow-noregion.json")
);

const dataflowRegion = JSON.stringify(
  require("../../../../wwwroot/test/SDMX-JSON/dataflow-region.json")
);

const dataflowRegionTime = JSON.stringify(
  require("../../../../wwwroot/test/SDMX-JSON/dataflow-region-time.json")
);

describe("SdmxJsonCatalogItem", function () {
  let terria: Terria;
  let sdmxItem: SdmxJsonCatalogItem;

  beforeEach(async function () {
    jasmine.Ajax.install();

    jasmine.Ajax.stubRequest(
      "build/TerriaJS/data/regionMapping.json"
    ).andReturn({ responseText: regionMapping });

    jasmine.Ajax.stubRequest(
      "https://tiles.terria.io/region-mapping/regionids/region_map-STE_2016_AUST_STE_CODE16.json"
    ).andReturn({ responseText: steCodes });

    jasmine.Ajax.stubRequest(
      "https://tiles.terria.io/region-mapping/regionids/region_map-FID_TM_WORLD_BORDERS_ISO2.json"
    ).andReturn({ responseText: isoCodes });

    jasmine.Ajax.stubRequest(
      "http://www.example.com/dataflow/SPC/DF_COMMODITY_PRICES?references=all"
    ).andReturn({ responseText: dataflowNoRegion });

    jasmine.Ajax.stubRequest(
      "http://www.example.com/dataflow/SPC/DF_CPI?references=all"
    ).andReturn({ responseText: dataflowRegion });

    jasmine.Ajax.stubRequest(
      "http://www.example.com/data/DF_COMMODITY_PRICES/A.COCOA.COMPRICE"
    ).andReturn({ responseText: dataflowNoRegionData });

    jasmine.Ajax.stubRequest(
      "http://www.example.com/data/DF_CPI/A..INF._T"
    ).andReturn({ responseText: dataflowRegionData });

    jasmine.Ajax.stubRequest(
      "http://www.example.com/dataflow/ABS/RT?references=all"
    ).andReturn({ responseText: dataflowRegionTime });

    jasmine.Ajax.stubRequest(
      "http://www.example.com/data/RT/M1.20.10..M"
    ).andReturn({ responseText: dataflowRegionTimeData });

    terria = new Terria();
    sdmxItem = new SdmxJsonCatalogItem("test", terria, undefined);
    sdmxItem.setTrait("definition", "url", "http://www.example.com");

    await sdmxItem.loadRegionProviderList();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it("has a type", function () {
    expect(sdmxItem.type).toBe("sdmx-json");
  });

  it("loadsDataflow-timeseries", async function () {
    runInAction(() => {
      sdmxItem.setTrait("definition", "agencyId", "SPC");
      sdmxItem.setTrait("definition", "dataflowId", "DF_COMMODITY_PRICES");
    });

    await sdmxItem.loadMapItems();
    expect(sdmxItem.mapItems.length).toBe(0);

    expect(sdmxItem.description).toBe(
      "Nominal prices in USD for selected key international commodity prices relevant to Pacific Island Countries and Territories, extracted from World bank Commodity Prices (« pink sheets ») and from FAO GLOBEFISH European Fish Price Report."
    );

    expect(sdmxItem.columns.filter((col) => col.type === "region").length).toBe(
      0
    );
    expect(sdmxItem.columns.filter((col) => col.type === "time").length).toBe(
      1
    );
    expect(sdmxItem.columns.filter((col) => col.type === "time")[0]?.name).toBe(
      "TIME_PERIOD"
    );
    expect(sdmxItem.activeStyle).toBe("OBS_VALUE");

    expect(sdmxItem.dimensions.length).toBe(3);
    expect(sdmxItem.dimensions[0].name).toBe("Frequency");
    expect(sdmxItem.dimensions[1].name).toBe("Commodity");
    expect(sdmxItem.dimensions[1].options.length).toBe(28);
    expect(sdmxItem.dimensions[2].name).toBe("Indicator");

    expect(sdmxItem.columns.length).toBe(8);
    expect(sdmxItem.columns[0].name).toBe("OBS_VALUE");

    expect(sdmxItem.columns.map((col) => col.type)).toEqual([
      "scalar",
      "hidden",
      "hidden",
      "hidden",
      "time",
      "hidden",
      "hidden",
      "hidden"
    ]);
  });

  it("loadsDataflow-region-conceptoverride", async function () {
    runInAction(() => {
      sdmxItem.setTrait("definition", "agencyId", "SPC");
      sdmxItem.setTrait("definition", "dataflowId", "DF_CPI");
      sdmxItem.setTrait("definition", "modelOverrides", [
        createStratumInstance(ModelOverrideTraits, {
          id: "urn:sdmx:org.sdmx.infomodel.conceptscheme.Concept=SPC:CS_COMMON(2.0).GEO_PICT",
          type: "region",
          regionType: "CNT2"
        })
      ]);
    });

    await sdmxItem.loadMapItems();
    await sdmxItem.regionProviderLists?.[0]
      ?.getRegionProvider("CNT2")
      ?.loadRegionIDs();

    expect(sdmxItem.mapItems.length).toBe(1);

    expect(sdmxItem.description).toBe(
      "Inflation rates for the Pacific island countries and territories per year."
    );

    expect(sdmxItem.columns.filter((col) => col.type === "region").length).toBe(
      1
    );
    expect(
      sdmxItem.columns.filter((col) => col.type === "region")[0].name
    ).toBe("GEO_PICT");
    expect(sdmxItem.activeTableStyle.regionColumn).toBeDefined();
    expect(sdmxItem.activeTableStyle.regionColumn?.regionType).toBeTruthy(
      "CNT2"
    );
    expect(
      sdmxItem.selectableDimensions.find((dim) => dim.id === "GEO_PICT")
        ?.disable
    ).toBeTruthy();

    expect(sdmxItem.columns.filter((col) => col.type === "time").length).toBe(
      1
    );
    expect(sdmxItem.columns.filter((col) => col.type === "time")[0]?.name).toBe(
      "TIME_PERIOD"
    );
    expect(sdmxItem.activeStyle).toBe("OBS_VALUE");

    expect(sdmxItem.dimensions.length).toBe(4);
    expect(sdmxItem.dimensions[0].name).toBe("Frequency");
    expect(sdmxItem.dimensions[1].name).toBe(
      "Pacific Island Countries and territories"
    );
    expect(sdmxItem.dimensions[2].name).toBe("Indicator");
    expect(sdmxItem.dimensions[3].name).toBe("Commodity");

    expect(sdmxItem.columns.length).toBe(11);
    expect(sdmxItem.columns[0].name).toBe("OBS_VALUE");
  });

  it("loadsDataflow-region-metadataUrls", async function () {
    runInAction(() => {
      sdmxItem.setTrait("definition", "agencyId", "SPC");
      sdmxItem.setTrait("definition", "dataflowId", "DF_CPI");
      sdmxItem.setTrait("definition", "modelOverrides", [
        createStratumInstance(ModelOverrideTraits, {
          id: "urn:sdmx:org.sdmx.infomodel.conceptscheme.Concept=SPC:CS_COMMON(2.0).GEO_PICT",
          type: "region",
          regionType: "CNT2"
        })
      ]);
    });

    await sdmxItem.loadMapItems();
    await sdmxItem.regionProviderLists?.[0]
      ?.getRegionProvider("CNT2")
      ?.loadRegionIDs();

    expect(sdmxItem.metadataUrls.length).toBe(1);
    expect(sdmxItem.metadataUrls[0].title).toBe("Metadata");
    expect(sdmxItem.metadataUrls[0].url).toBe(
      "http://purl.org/spc/digilib/doc/a2vsj"
    );
  });

  it("uses SDMX common concepts", async function () {
    runInAction(() => {
      sdmxItem.setTrait("definition", "agencyId", "ABS");
      sdmxItem.setTrait("definition", "dataflowId", "RT");
      sdmxItem.setTrait("definition", "modelOverrides", [
        createStratumInstance(ModelOverrideTraits, {
          id: "urn:sdmx:org.sdmx.infomodel.codelist.Codelist=ABS:CL_STATE(1.0.0)",
          type: "region",
          regionType: "STE_2016"
        })
      ]);
    });

    await sdmxItem.regionProviderLists?.[0]
      ?.getRegionProvider("STE_2016")
      ?.loadRegionIDs();

    await sdmxItem.loadMapItems();

    expect(sdmxItem.mapItems.length).toBe(1);

    expect(sdmxItem.columns.filter((col) => col.type === "region").length).toBe(
      1
    );
    expect(
      sdmxItem.columns.filter((col) => col.type === "region")[0].name
    ).toBe("REGION");
    expect(sdmxItem.activeTableStyle.regionColumn).toBeDefined();
    expect(sdmxItem.activeTableStyle.regionColumn?.regionType).toBeTruthy(
      "STE_2016"
    );

    expect(sdmxItem.activeStyle).toBe("OBS_VALUE");
    const primaryCol = sdmxItem.columns.find((col) => col.name === "OBS_VALUE");

    expect(primaryCol).toBeDefined();
    expect(primaryCol?.transformation.expression).toBe("x*(10^UNIT_MULT)");
    expect(primaryCol?.transformation.dependencies[0]).toBe("UNIT_MULT");
    expect(sdmxItem.activeTableStyle.colorTraits.legend.title).toBe(
      "Australian Dollars (Monthly)"
    );
  });

  it("handles single region gracefully", async function () {
    jasmine.Ajax.stubRequest(
      "http://www.example.com/data/RT/M1.20.10..M"
    ).andReturn({ responseText: dataflowSingleRegionTimeData });

    runInAction(() => {
      sdmxItem.setTrait("definition", "agencyId", "ABS");
      sdmxItem.setTrait("definition", "dataflowId", "RT");
      sdmxItem.setTrait("definition", "modelOverrides", [
        createStratumInstance(ModelOverrideTraits, {
          id: "urn:sdmx:org.sdmx.infomodel.codelist.Codelist=ABS:CL_STATE(1.0.0)",
          type: "region",
          regionType: "STE_2016"
        })
      ]);
    });

    await sdmxItem.regionProviderLists?.[0]
      ?.getRegionProvider("STE_2016")
      ?.loadRegionIDs();

    await sdmxItem.loadMapItems();

    expect(sdmxItem.mapItems.length).toBe(0);

    expect(sdmxItem.activeTableStyle.regionColumn).toBeUndefined();

    const regionCol = sdmxItem.tableColumns.filter(
      (col) => col.type === TableColumnType.region
    )[0];

    expect(regionCol).toBeDefined();
    expect(regionCol.valuesAsRegions.uniqueRegionIds.length).toBe(1);

    expect(sdmxItem.chartItems.length).toBe(1);
    expect(sdmxItem.chartItems[0].name).toBe(
      "Australian Capital Territory - Australian Dollars (Monthly)"
    );
  });
});
