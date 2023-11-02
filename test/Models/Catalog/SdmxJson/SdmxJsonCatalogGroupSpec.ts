import { runInAction } from "mobx";
import Terria from "../../../../lib/Models/Terria";
import SdmxCatalogGroup from "../../../../lib/Models/Catalog/SdmxJson/SdmxJsonCatalogGroup";
import CatalogGroup from "../../../../lib/Models/Catalog/CatalogGroup";
import SdmxJsonCatalogItem from "../../../../lib/Models/Catalog/SdmxJson/SdmxJsonCatalogItem";

const agencyScheme = JSON.stringify(
  require("../../../../wwwroot/test/SDMX-JSON/agency-scheme.json")
);

const categoryScheme = JSON.stringify(
  require("../../../../wwwroot/test/SDMX-JSON/category-scheme.json")
);

const dataflowNoRegion = JSON.stringify(
  require("../../../../wwwroot/test/SDMX-JSON/dataflow-noregion.json")
);

const dataflowRegion = JSON.stringify(
  require("../../../../wwwroot/test/SDMX-JSON/dataflow-region.json")
);

describe("SdmxCatalogGroup", function () {
  let terria: Terria;
  let sdmxGroup: SdmxCatalogGroup;

  beforeEach(function () {
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest("http://www.example.com/agencyscheme/").andReturn({
      responseText: agencyScheme
    });
    jasmine.Ajax.stubRequest(
      "http://www.example.com/categoryscheme?references=parentsandsiblings"
    ).andReturn({ responseText: categoryScheme });

    jasmine.Ajax.stubRequest(
      "http://www.example.com/dataflow/SPC/DF_COMMODITY_PRICES?references=all"
    ).andReturn({ responseText: dataflowNoRegion });

    jasmine.Ajax.stubRequest(
      "http://www.example.com/dataflow/SPC/DF_CPI?references=all"
    ).andReturn({ responseText: dataflowRegion });

    terria = new Terria();
    sdmxGroup = new SdmxCatalogGroup("test", terria);
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it("has a type", function () {
    expect(sdmxGroup.type).toBe("sdmx-group");
  });

  describe("after loading agency + category schemes", function () {
    beforeEach(async function () {
      runInAction(() => {
        sdmxGroup.setTrait("definition", "url", "http://www.example.com");
      });
    });

    it("loadsNestedMembers", async function () {
      await sdmxGroup.loadMembers();
      const agency = sdmxGroup.memberModels;
      expect(agency.length).toEqual(2);
      const categoryScheme = agency[0] as CatalogGroup;
      expect(categoryScheme.memberModels.length).toEqual(3);
      const category = categoryScheme.memberModels[0] as CatalogGroup;
      expect(category.memberModels.length).toEqual(6);

      const dataflowNoRegion = category.memberModels[0] as SdmxJsonCatalogItem;
      const dataflowRegion = category.memberModels[1] as SdmxJsonCatalogItem;

      expect(dataflowNoRegion.name).toBe(
        "Selected International Commodity Prices"
      );
      expect(dataflowRegion.name).toBe("Inflation rates");
    });

    it("loadsDataflow-timeseries", async function () {
      await sdmxGroup.loadMembers();
      const agency = sdmxGroup.memberModels;
      const categoryScheme = agency[0] as CatalogGroup;
      const category = categoryScheme.memberModels[0] as CatalogGroup;

      const dataflowNoRegion = category.memberModels[0] as SdmxJsonCatalogItem;
      await dataflowNoRegion.loadMetadata();

      expect(dataflowNoRegion.description).toBe(
        "Nominal prices in USD for selected key international commodity prices relevant to Pacific Island Countries and Territories, extracted from World bank Commodity Prices (« pink sheets ») and from FAO GLOBEFISH European Fish Price Report."
      );
      expect(
        dataflowNoRegion.columns.filter((col) => col.type === "region").length
      ).toBe(0);
      expect(
        dataflowNoRegion.columns.filter((col) => col.type === "time").length
      ).toBe(1);
      expect(
        dataflowNoRegion.columns.filter((col) => col.type === "time")[0]?.name
      ).toBe("TIME_PERIOD");
      expect(dataflowNoRegion.activeStyle).toBe("OBS_VALUE");

      expect(dataflowNoRegion.dimensions.length).toBe(3);
      expect(dataflowNoRegion.dimensions[0].name).toBe("Frequency");
      expect(dataflowNoRegion.dimensions[1].name).toBe("Commodity");
      expect(dataflowNoRegion.dimensions[1].options.length).toBe(28);
      expect(dataflowNoRegion.dimensions[2].name).toBe("Indicator");

      expect(dataflowNoRegion.columns.length).toBe(8);
      expect(dataflowNoRegion.columns[0].name).toBe("OBS_VALUE");
    });

    it("loadsDataflow-region", async function () {
      await sdmxGroup.loadMembers();
      const agency = sdmxGroup.memberModels;
      const categoryScheme = agency[0] as CatalogGroup;
      const category = categoryScheme.memberModels[0] as CatalogGroup;

      const dataflowRegion = category.memberModels[1] as SdmxJsonCatalogItem;
      await dataflowRegion.loadMetadata();

      expect(dataflowRegion.description).toBe(
        "Inflation rates for the Pacific island countries and territories per year."
      );
      // No concept override - so expect 0 region dimensions
      expect(
        dataflowRegion.columns.filter((col) => col.type === "region").length
      ).toBe(0);
      expect(
        dataflowRegion.columns.filter((col) => col.type === "time").length
      ).toBe(1);
      expect(
        dataflowRegion.columns.filter((col) => col.type === "time")[0]?.name
      ).toBe("TIME_PERIOD");
      expect(dataflowRegion.activeStyle).toBe("OBS_VALUE");

      expect(dataflowRegion.dimensions.length).toBe(4);
      expect(dataflowRegion.dimensions[0].name).toBe("Frequency");
      expect(dataflowRegion.dimensions[1].name).toBe(
        "Pacific Island Countries and territories"
      );
      expect(dataflowRegion.dimensions[2].name).toBe("Indicator");
      expect(dataflowRegion.dimensions[3].name).toBe("Commodity");

      expect(dataflowRegion.columns.length).toBe(11);
      expect(dataflowRegion.columns[0].name).toBe("OBS_VALUE");
    });
  });
});
