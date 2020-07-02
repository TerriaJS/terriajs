import { configure, runInAction } from "mobx";
import _loadWithXhr from "../../lib/Core/loadWithXhr";
import Terria from "../../lib/Models/Terria";
import CommonStrata from "../../lib/Models/CommonStrata";
import i18next from "i18next";
import ArcGisPortalItemReference, {
  ArcGisPortalItemStratum
} from "../../lib/Models/ArcGisPortalItemReference";
import ArcGisFeatureServerCatalogItem from "../../lib/Models/ArcGisFeatureServerCatalogItem";
import InfoSectionTraits from "../../lib/Traits/CatalogMemberTraits";

configure({
  enforceActions: "observed",
  computedRequiresReaction: true
});

interface ExtendedLoadWithXhr {
  (): any;
  load: { (...args: any[]): any; calls: any };
}

const loadWithXhr: ExtendedLoadWithXhr = <any>_loadWithXhr;

describe("ArcGisPortalItemReference", function() {
  let terria: Terria;
  let arcGisPortalItemReference: ArcGisPortalItemReference;
  let arcGisPortalItemStratum: ArcGisPortalItemStratum;
  let portalItemTarget: any;

  beforeEach(async function() {
    terria = new Terria({
      baseUrl: "./"
    });
    arcGisPortalItemReference = new ArcGisPortalItemReference("portaltest", terria);

    const realLoadWithXhr = loadWithXhr.load;
    // We replace calls to real servers with pre-captured JSON files so our testing is isolated, but reflects real data.
    spyOn(loadWithXhr, "load").and.callFake(function(...args: any[]) {
      if (args[0].indexOf('/data') > -1) args[0] = "test/ArcGisPortal/item-data.json"
      else args[0] = "test/ArcGisPortal/item.json";
      return realLoadWithXhr(...args);
    });
  });

  it("has a type and typeName", function() {
    expect(arcGisPortalItemReference.type).toBe("arcgis-portal-item");
    expect(arcGisPortalItemReference.typeName).toBe("ArcGIS Portal Item");
  });

  describe("Can load an item by datasetId - ", function() {
    beforeEach(async function() {
      runInAction(() => {
        arcGisPortalItemReference.setTrait("definition", "url", "https://portal.spatial.nsw.gov.au/portal");
        arcGisPortalItemReference.setTrait("definition", "name", "Road Segments");
        arcGisPortalItemReference.setTrait("definition", "itemId", "66fabd8c23074ecc85883e0086419adc");
      });
      await arcGisPortalItemReference.loadReference();

      arcGisPortalItemStratum = <ArcGisPortalItemStratum>(
        arcGisPortalItemReference.strata.get(ArcGisPortalItemStratum.stratumName)
      );

      portalItemTarget = arcGisPortalItemReference.target
    });

    it("properly creates item", function() {
      // when creating a single item directly name is retained from the definition stratum
      expect(arcGisPortalItemReference.name).toBe("Road Segments");

      expect(arcGisPortalItemReference._arcgisItem).toBeDefined();
      expect(arcGisPortalItemReference._arcgisPortalCatalogGroup).toBe(undefined);

      expect(arcGisPortalItemReference).toBeDefined();
      expect(portalItemTarget instanceof ArcGisFeatureServerCatalogItem).toBe(true);
      expect(portalItemTarget.url).toBe(
        "https://portal.spatial.nsw.gov.au/server/rest/services/NSW_Transport_Theme/FeatureServer"
      );
    })
  //     expect(ckanItemTarget.rectangle.west).toBe(96.816941408);
  //     expect(ckanItemTarget.rectangle.south).toBe(-43.598215003);
  //     expect(ckanItemTarget.rectangle.east).toBe(159.109219008);
  //     expect(ckanItemTarget.rectangle.north).toBe(-9.142175977);

  //     const licenceInfo = ckanItemTarget.info.filter(
  //       (i: any) => i.name === "Licence"
  //     )[0];
  //     expect(licenceInfo.content).toBe(
  //       "[Creative Commons Attribution 3.0 Australia](http://creativecommons.org/licenses/by/3.0/au/)"
  //     );

  //     const contactInfo = ckanItemTarget.info.filter(
  //       (i: any) => i.name === "Contact"
  //     )[0];
  //     expect(contactInfo.content).toBe("taxstats@ato.gov.au");

  //     const datasetInfo = ckanItemTarget.info.filter(
  //       (i: any) => i.name === "Dataset Description"
  //     )[0];
  //     expect(datasetInfo.content).toBe(
  //       "Taxation statistics: an overview of the income and tax status of Australian individuals, companies, partnerships, trusts and funds for 2011-12. "
  //     );

  //     const authorInfo = ckanItemTarget.info.filter(
  //       (i: any) => i.name === "Author"
  //     )[0];
  //     expect(authorInfo.content).toBe("Australian Taxation Office");

  //     const createdInfo = ckanItemTarget.info.filter(
  //       (i: any) => i.name === "Created"
  //     )[0];
  //     expect(createdInfo.content).toBe("2014-04-24");

  //     const modifiedInfo = ckanItemTarget.info.filter(
  //       (i: any) => i.name === "Modified"
  //     )[0];
  //     expect(modifiedInfo.content).toBe("2015-08-25");

  //     const updateInfo = ckanItemTarget.info.filter(
  //       (i: any) => i.name === "Update Frequency"
  //     )[0];
  //     expect(updateInfo.content).toBe("daily");

  //     const custodianInfo = ckanItemTarget.info.filter(
  //       (i: any) => i.name === "Dataset Custodian"
  //     )[0];
  //     expect(custodianInfo.content).toBe("Australian Taxation Office");
  //   });
  });

  // describe("Can load an item by resourceId - ", function() {
  //   beforeEach(async function() {
  //     runInAction(() => {
  //       ckanItemReference.setTrait("definition", "url", "someresource");
  //       ckanItemReference.setTrait("definition", "name", "Taxation Statistics");
  //       ckanItemReference.setTrait("definition", "resourceId", "1234");
  //     });
  //     await ckanItemReference.loadReference();
  //     ckanDatasetStratum = <CkanDatasetStratum>(
  //       ckanItemReference.strata.get(CkanDatasetStratum.stratumName)
  //     );
  //     ckanItemTarget = ckanItemReference.target;
  //   });

  //   it("properly creates item", function() {
  //     expect(ckanItemReference._ckanResource).toBeDefined();
  //     expect(ckanItemReference._ckanDataset).toBe(undefined);
  //     expect(ckanItemReference._ckanCatalogGroup).toBe(undefined);
  //     // when creating a single item directly name is retained from the definition stratum
  //     expect(ckanItemTarget.name).toBe("Taxation Statistics");

  //     expect(ckanItemTarget).toBeDefined();
  //     expect(ckanItemTarget instanceof WebMapServiceCatalogItem).toBe(true);
  //     expect(ckanItemTarget.url).toBe(
  //       "http://data.gov.au/geoserver/taxation-statistics-2011-12/wms?request=GetCapabilities"
  //     );
  //     expect(ckanItemTarget.rectangle.west).toBe(undefined);
  //     expect(ckanItemTarget.info.length).toBe(0);
  //   });
  // });

  // describe("Rejected if there is no datasetId or resourceId - ", function() {
  //   beforeEach(async function() {
  //     runInAction(() => {
  //       ckanItemReference.setTrait("definition", "url", "someresource");
  //       ckanItemReference.setTrait("definition", "name", "Taxation Statistics");
  //     });
  //     await ckanItemReference.loadReference();
  //   });

  //   it("No target can be created", function() {
  //     expect(ckanItemReference.target).toBe(undefined);
  //   });
  // });
});
