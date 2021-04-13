import { runInAction } from "mobx";
import createStratumInstance from "../../lib/Models/createStratumInstance";
import SdmxJsonCatalogItem from "../../lib/Models/SdmxJson/SdmxJsonCatalogItem";
import Terria from "../../lib/Models/Terria";
import { ModelOverrideTraits } from "../../lib/Traits/SdmxCommonTraits";

const regionMapping = JSON.stringify(
  require("../../wwwroot/data/regionMapping.json")
);

const dataflowNoRegionData = require("raw-loader!../../wwwroot/test/SDMX-JSON/data-noregion.csv");
const dataflowRegionData = require("raw-loader!../../wwwroot/test/SDMX-JSON/data-region.csv");

const dataflowNoRegion = JSON.stringify(
  require("../../wwwroot/test/SDMX-JSON/dataflow-noregion.json")
);

const dataflowRegion = JSON.stringify(
  require("../../wwwroot/test/SDMX-JSON/dataflow-region.json")
);

describe("SdmxJsonCatalogItem", function() {
  let terria: Terria;
  let sdmxItem: SdmxJsonCatalogItem;

  beforeEach(function() {
    jasmine.Ajax.install();

    jasmine.Ajax.stubRequest(
      "build/TerriaJS/data/regionMapping.json"
    ).andReturn({ responseText: regionMapping });

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

    terria = new Terria();
    sdmxItem = new SdmxJsonCatalogItem("test", terria, undefined);
    runInAction(() => {
      sdmxItem.setTrait("definition", "url", "http://www.example.com");
      sdmxItem.setTrait("definition", "agencyId", "SPC");
    });
  });

  afterEach(function() {
    jasmine.Ajax.uninstall();
  });

  it("has a type", function() {
    expect(sdmxItem.type).toBe("sdmx-json");
  });

  it("loadsDataflow-timeseries", async function() {
    runInAction(() => {
      sdmxItem.setTrait("definition", "agencyId", "SPC");
      sdmxItem.setTrait("definition", "dataflowId", "DF_COMMODITY_PRICES");
    });

    await sdmxItem.loadMapItems();

    expect(sdmxItem.description).toBe(
      "Nominal prices in USD for selected key international commodity prices relevant to Pacific Island Countries and Territories, extracted from World bank Commodity Prices (« pink sheets ») and from FAO GLOBEFISH European Fish Price Report."
    );

    expect(sdmxItem.columns.filter(col => col.type === "region").length).toBe(
      0
    );
    expect(sdmxItem.columns.filter(col => col.type === "time").length).toBe(1);
    expect(sdmxItem.columns.filter(col => col.type === "time")[0]?.name).toBe(
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
  });

  it("loadsDataflow-region-conceptoverride", async function() {
    runInAction(() => {
      sdmxItem.setTrait("definition", "dataflowId", "DF_CPI");
      sdmxItem.setTrait("definition", "modelOverrides", [
        createStratumInstance(ModelOverrideTraits, {
          id:
            "urn:sdmx:org.sdmx.infomodel.conceptscheme.Concept=SPC:CS_COMMON(2.0).GEO_PICT",
          type: "region",
          regionType: "CNT2"
        })
      ]);
    });

    await sdmxItem.loadMapItems();

    expect(sdmxItem.description).toBe(
      "Inflation rates for the Pacific island countries and territories per year."
    );

    expect(sdmxItem.columns.filter(col => col.type === "region").length).toBe(
      1
    );
    expect(sdmxItem.columns.filter(col => col.type === "region")[0].name).toBe(
      "GEO_PICT"
    );
    expect(sdmxItem.activeTableStyle.regionColumn).toBeDefined();
    expect(sdmxItem.activeTableStyle.regionColumn?.regionType).toBeTruthy(
      "CNT2"
    );
    expect(
      sdmxItem.selectableDimensions.find(dim => dim.id === "GEO_PICT")?.disable
    ).toBeTruthy();

    expect(sdmxItem.columns.filter(col => col.type === "time").length).toBe(1);
    expect(sdmxItem.columns.filter(col => col.type === "time")[0]?.name).toBe(
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
});
