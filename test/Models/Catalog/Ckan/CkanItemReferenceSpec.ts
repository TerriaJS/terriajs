import { configure, runInAction } from "mobx";
import _loadWithXhr from "../../../../lib/Core/loadWithXhr";
import Terria from "../../../../lib/Models/Terria";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import i18next from "i18next";
import CkanItemReference, {
  CkanDatasetStratum
} from "../../../../lib/Models/Catalog/Ckan/CkanItemReference";
import WebMapServiceCatalogItem from "../../../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import InfoSectionTraits from "../../../../lib/Traits/TraitsClasses/CatalogMemberTraits";

configure({
  enforceActions: "observed",
  computedRequiresReaction: true
});

interface ExtendedLoadWithXhr {
  (): any;
  load: { (...args: any[]): any; calls: any };
}

const loadWithXhr: ExtendedLoadWithXhr = <any>_loadWithXhr;

describe("CkanItemReference", function() {
  const ckanServerUrl = "http://data.gov.au";
  let terria: Terria;
  let ckanItemReference: CkanItemReference;
  let ckanDatasetStratum: CkanDatasetStratum;
  let ckanItemTarget: any;

  beforeEach(async function() {
    terria = new Terria({
      baseUrl: "./"
    });
    ckanItemReference = new CkanItemReference("test", terria);

    const realLoadWithXhr = loadWithXhr.load;
    // We replace calls to real servers with pre-captured JSON files so our testing is isolated, but reflects real data.
    spyOn(loadWithXhr, "load").and.callFake(function(...args: any[]) {
      if (args[0].indexOf("somedataset") > -1)
        args[0] = "test/CKAN/taxation-statistics-package.json";
      if (args[0].indexOf("someresource") > -1)
        args[0] = "test/CKAN/taxation-statistics-wms-resource.json";
      return realLoadWithXhr(...args);
    });
  });

  it("has a type and typeName", function() {
    expect(ckanItemReference.type).toBe("ckan-item");
    expect(ckanItemReference.typeName).toBe(i18next.t("models.ckan.name"));
  });

  describe("Can load an item by datasetId - ", function() {
    beforeEach(async function() {
      runInAction(() => {
        ckanItemReference.setTrait("definition", "url", "somedataset");
        ckanItemReference.setTrait("definition", "name", "Taxation Statistics");
        ckanItemReference.setTrait("definition", "datasetId", "1234");
      });
      await ckanItemReference.loadReference();
      ckanDatasetStratum = <CkanDatasetStratum>(
        ckanItemReference.strata.get(CkanDatasetStratum.stratumName)
      );
      ckanItemTarget = ckanItemReference.target;
    });

    it("properly creates item", function() {
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

  describe("Can load an item by resourceId - ", function() {
    beforeEach(async function() {
      runInAction(() => {
        ckanItemReference.setTrait("definition", "url", "someresource");
        ckanItemReference.setTrait("definition", "name", "Taxation Statistics");
        ckanItemReference.setTrait("definition", "resourceId", "1234");
      });
      await ckanItemReference.loadReference();
      ckanDatasetStratum = <CkanDatasetStratum>(
        ckanItemReference.strata.get(CkanDatasetStratum.stratumName)
      );
      ckanItemTarget = ckanItemReference.target;
    });

    it("properly creates item", function() {
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
    });
  });

  describe("Rejected if there is no datasetId or resourceId - ", function() {
    beforeEach(async function() {
      runInAction(() => {
        ckanItemReference.setTrait("definition", "url", "someresource");
        ckanItemReference.setTrait("definition", "name", "Taxation Statistics");
      });
      await ckanItemReference.loadReference();
    });

    it("No target can be created", function() {
      expect(ckanItemReference.target).toBe(undefined);
    });
  });
});
