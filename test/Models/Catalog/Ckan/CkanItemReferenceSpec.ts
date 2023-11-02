import i18next from "i18next";
import { runInAction } from "mobx";
import CkanItemReference, {
  CkanDatasetStratum
} from "../../../../lib/Models/Catalog/Ckan/CkanItemReference";
import WebMapServiceCatalogItem from "../../../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import Terria from "../../../../lib/Models/Terria";
import WebMapServiceCatalogGroup from "../../../../lib/Models/Catalog/Ows/WebMapServiceCatalogGroup";

const taxationStatisticsPackage = require("../../../../wwwroot/test/CKAN/taxation-statistics-package.json");
const taxationStatisticsWmsResource = require("../../../../wwwroot/test/CKAN/taxation-statistics-wms-resource.json");
const vicWmsLayerResource = require("../../../../wwwroot/test/CKAN/vic-wms-layer-resource.json");
const wmsNoLayerResource = require("../../../../wwwroot/test/CKAN/wms-no-layer-resource.json");

describe("CkanItemReference", function () {
  let terria: Terria;
  let ckanItemReference: CkanItemReference;
  let ckanDatasetStratum: CkanDatasetStratum;
  let ckanItemTarget: any;

  beforeEach(async function () {
    terria = new Terria({
      baseUrl: "./"
    });
    ckanItemReference = new CkanItemReference("test", terria);

    jasmine.Ajax.install();
    // Fail and log requests by default.
    jasmine.Ajax.stubRequest(/.*/).andCallFunction((request) => {
      console.dir(request);
      request.respondWith({ status: 404 });
    });

    jasmine.Ajax.stubRequest(
      "https://example.com/api/3/action/package_show?id=tax-stats-package"
    ).andReturn({ responseText: JSON.stringify(taxationStatisticsPackage) });

    jasmine.Ajax.stubRequest(
      "https://example.com/api/3/action/resource_show?id=tax-stats-wms-resource"
    ).andReturn({
      responseText: JSON.stringify(taxationStatisticsWmsResource)
    });

    jasmine.Ajax.stubRequest(
      "https://example.com/api/3/action/resource_show?id=wms-no-layers-resource"
    ).andReturn({
      responseText: JSON.stringify(wmsNoLayerResource)
    });

    jasmine.Ajax.stubRequest(
      "https://example.com/api/3/action/resource_show?id=vic-wms-resource"
    ).andReturn({
      responseText: JSON.stringify(vicWmsLayerResource)
    });
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it("has a type and typeName", function () {
    expect(ckanItemReference.type).toBe("ckan-item");
    expect(ckanItemReference.typeName).toBe(i18next.t("models.ckan.name"));
  });

  describe("Can load an item by datasetId - ", function () {
    beforeEach(async function () {
      runInAction(() => {
        ckanItemReference.setTrait("definition", "url", "https://example.com");
        ckanItemReference.setTrait("definition", "name", "Taxation Statistics");
        ckanItemReference.setTrait(
          "definition",
          "datasetId",
          "tax-stats-package"
        );
      });
      (await ckanItemReference.loadReference()).throwIfError();
      ckanDatasetStratum = <CkanDatasetStratum>(
        ckanItemReference.strata.get(CkanDatasetStratum.stratumName)
      );
      ckanItemTarget = ckanItemReference.target;
    });

    it("properly creates item", function () {
      // when creating a single item directly name is retained from the definition stratum
      expect(ckanItemTarget.name).toBe("Taxation Statistics");

      expect(ckanItemReference._ckanResource).toBeDefined();
      expect(ckanItemReference._ckanDataset).toBeDefined();
      expect(ckanItemReference._ckanCatalogGroup).toBe(undefined);

      expect(ckanItemTarget).toBeDefined();
      expect(ckanItemTarget instanceof WebMapServiceCatalogItem).toBe(true);
      expect(ckanItemTarget.url).toBe(
        "http://data.gov.au/geoserver/taxation-statistics-2011-12/wms?request=GetCapabilities"
      );

      expect(ckanItemTarget.rectangle.west).toBe(96.816941408);
      expect(ckanItemTarget.rectangle.south).toBe(-43.598215003);
      expect(ckanItemTarget.rectangle.east).toBe(159.109219008);
      expect(ckanItemTarget.rectangle.north).toBe(-9.142175977);

      const licenceInfo = ckanItemTarget.info.filter(
        (i: any) => i.name === i18next.t("models.ckan.licence")
      )[0];
      expect(licenceInfo.content).toBe(
        "[Creative Commons Attribution 3.0 Australia](http://creativecommons.org/licenses/by/3.0/au/)"
      );

      const contactInfo = ckanItemTarget.info.filter(
        (i: any) => i.name === i18next.t("models.ckan.contact_point")
      )[0];
      expect(contactInfo.content).toBe("taxstats@ato.gov.au");

      const datasetInfo = ckanItemTarget.info.filter(
        (i: any) => i.name === i18next.t("models.ckan.datasetDescription")
      )[0];
      expect(datasetInfo.content).toBe(
        "Taxation statistics: an overview of the income and tax status of Australian individuals, companies, partnerships, trusts and funds for 2011-12. "
      );

      const authorInfo = ckanItemTarget.info.filter(
        (i: any) => i.name === i18next.t("models.ckan.author")
      )[0];
      expect(authorInfo.content).toBe("Australian Taxation Office");

      const createdInfo = ckanItemTarget.info.filter(
        (i: any) => i.name === i18next.t("models.ckan.metadata_created")
      )[0];
      expect(createdInfo.content).toBe("2014-04-24");

      const modifiedInfo = ckanItemTarget.info.filter(
        (i: any) => i.name === i18next.t("models.ckan.metadata_modified")
      )[0];
      expect(modifiedInfo.content).toBe("2015-08-25");

      const updateInfo = ckanItemTarget.info.filter(
        (i: any) => i.name === i18next.t("models.ckan.update_freq")
      )[0];
      expect(updateInfo.content).toBe("daily");

      const custodianInfo = ckanItemTarget.info.filter(
        (i: any) => i.name === i18next.t("models.ckan.datasetCustodian")
      )[0];
      expect(custodianInfo.content).toBe("Australian Taxation Office");
    });
  });

  describe("Can load an item by resourceId - ", function () {
    beforeEach(async function () {
      runInAction(() => {
        ckanItemReference.setTrait("definition", "url", "https://example.com");
        ckanItemReference.setTrait("definition", "name", "Taxation Statistics");
      });
    });

    it("properly creates item", async function () {
      ckanItemReference.setTrait(
        "definition",
        "resourceId",
        "tax-stats-wms-resource"
      );
      await ckanItemReference.loadReference();
      ckanDatasetStratum = <CkanDatasetStratum>(
        ckanItemReference.strata.get(CkanDatasetStratum.stratumName)
      );
      ckanItemTarget = ckanItemReference.target;

      expect(ckanItemReference._ckanResource).toBeDefined();
      expect(ckanItemReference._ckanDataset).toBe(undefined);
      expect(ckanItemReference._ckanCatalogGroup).toBe(undefined);
      // when creating a single item directly name is retained from the definition stratum
      expect(ckanItemTarget.name).toBe("Taxation Statistics");

      expect(ckanItemTarget).toBeDefined();
      expect(ckanItemTarget instanceof WebMapServiceCatalogItem).toBe(true);
      expect(ckanItemTarget.url).toBe(
        "http://data.gov.au/geoserver/taxation-statistics-2011-12/wms?request=GetCapabilities"
      );
      expect(ckanItemTarget.rectangle.west).toBe(undefined);
      expect(ckanItemTarget.info.length).toBe(0);
      expect(ckanItemTarget.layers).toBe(
        "95d9e550_8b36_4273_8df7_2b76c140e73a"
      );
    });

    it("creates WMS group instead of WMS item if no LAYERS", async function () {
      ckanItemReference.setTrait(
        "definition",
        "resourceId",
        "wms-no-layers-resource"
      );
      await ckanItemReference.loadReference();
      ckanDatasetStratum = <CkanDatasetStratum>(
        ckanItemReference.strata.get(CkanDatasetStratum.stratumName)
      );
      ckanItemTarget = ckanItemReference.target;

      expect(ckanItemReference._ckanResource).toBeDefined();
      expect(ckanItemReference._ckanDataset).toBe(undefined);
      expect(ckanItemReference._ckanCatalogGroup).toBe(undefined);
      // when creating a single item directly name is retained from the definition stratum
      expect(ckanItemTarget.name).toBe("Taxation Statistics");

      expect(ckanItemTarget).toBeDefined();
      expect(ckanItemTarget instanceof WebMapServiceCatalogGroup).toBe(true);
      expect(ckanItemTarget.url).toBe(
        "http://data.gov.au/geoserver/taxation-statistics-2011-12/wms?request=GetCapabilities"
      );
      expect(ckanItemTarget.info.length).toBe(0);

      console.log(ckanItemTarget);
    });
  });

  describe("Can load a different item by resourceId - ", function () {
    beforeEach(async function () {
      runInAction(() => {
        ckanItemReference.setTrait("definition", "url", "https://example.com");
        ckanItemReference.setTrait(
          "definition",
          "name",
          "EPA Victoria Environmental Audit Reports"
        );
        ckanItemReference.setTrait(
          "definition",
          "resourceId",
          "vic-wms-resource"
        );
      });
      await ckanItemReference.loadReference();
      ckanDatasetStratum = <CkanDatasetStratum>(
        ckanItemReference.strata.get(CkanDatasetStratum.stratumName)
      );
      ckanItemTarget = ckanItemReference.target;
    });
    it("uses LAYERS from url query string for WMS item", function () {
      expect(ckanItemReference._ckanResource).toBeDefined();
      expect(ckanItemReference._ckanDataset).toBe(undefined);
      expect(ckanItemReference._ckanCatalogGroup).toBe(undefined);
      // when creating a single item directly name is retained from the definition stratum
      expect(ckanItemTarget.name).toBe(
        "EPA Victoria Environmental Audit Reports"
      );

      expect(ckanItemTarget).toBeDefined();
      if (!(ckanItemTarget instanceof WebMapServiceCatalogItem))
        throw new Error(
          "Expected ckanItemTarget to be a WebMapServiceCatalogItem"
        );
      expect(ckanItemTarget.url).toBe(
        "http://services.land.vic.gov.au/catalogue/publicproxy/guest/dv_geoserver/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&WIDTH=512&HEIGHT=512&LAYERS=ENVIRONPROTECT_ENVIRO_AUDIT_LOC_POINT&STYLES=&FORMAT=image%2Fpng&SRS=EPSG%3A4283&BBOX=141%2C-39%2C150%2C-34"
      );
      expect(ckanItemTarget.rectangle.west).toBe(undefined);
      expect(ckanItemTarget.info.length).toBe(0);
      expect(ckanItemTarget.layers).toBe(
        "ENVIRONPROTECT_ENVIRO_AUDIT_LOC_POINT"
      );
    });
  });

  describe("Rejected if there is no datasetId or resourceId - ", function () {
    beforeEach(async function () {
      runInAction(() => {
        ckanItemReference.setTrait("definition", "url", "https://example.com");
        ckanItemReference.setTrait("definition", "name", "Taxation Statistics");
      });
      await ckanItemReference.loadReference();
    });

    it("No target can be created", function () {
      expect(ckanItemReference.target).toBe(undefined);
    });
  });
});
