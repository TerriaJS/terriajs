import i18next from "i18next";
import { runInAction } from "mobx";
import CatalogMemberMixin from "../../../../lib/ModelMixins/CatalogMemberMixin";
import Terria from "../../../../lib/Models/Terria";
import WebFeatureServiceCatalogGroup from "../../../../lib/Models/Catalog/Ows/WebFeatureServiceCatalogGroup";

describe("WebFeatureServiceCatalogGroup", function() {
  let terria: Terria;
  let wfs: WebFeatureServiceCatalogGroup;

  beforeEach(function() {
    terria = new Terria();
    wfs = new WebFeatureServiceCatalogGroup("test", terria);
  });

  it("has a type", function() {
    expect(wfs.type).toBe("wfs-group");
  });

  it("derives getCapabilitiesUrl from url if getCapabilitiesUrl is not specified", function() {
    wfs.setTrait("definition", "url", "http://www.example.com");
    expect(wfs.getCapabilitiesUrl).toBeDefined();
    expect(wfs.url).toBeDefined();
    expect(
      wfs.getCapabilitiesUrl &&
        wfs.getCapabilitiesUrl.indexOf(wfs.url || "undefined") === 0
    ).toBe(true);
  });

  describe("after loading capabilities", function() {
    beforeEach(async function() {
      runInAction(() => {
        wfs.setTrait("definition", "url", "test/WFS/getCapabilities.xml");
      });
    });

    it("defines name", async function() {
      await wfs.loadMetadata();
      expect(wfs.name).toBe("Geoscience Australia Marine Data");
    });

    it("doesn't override user set name", async function() {
      const userDefinedName = "user defined name";
      runInAction(() => {
        wfs.setTrait("definition", "name", userDefinedName);
      });
      await wfs.loadMetadata();
      expect(wfs.name).toBe(userDefinedName);
    });

    it("defines info", async function() {
      await wfs.loadMetadata();
      const abstract = i18next.t(
        "models.webFeatureServiceCatalogGroup.abstract"
      );
      const accessConstraints = i18next.t(
        "models.webFeatureServiceCatalogGroup.accessConstraints"
      );

      expect(wfs.info.map(({ name }) => name)).toEqual([
        abstract,
        accessConstraints
      ]);

      expect(wfs.info.map(({ content }) => content)).toEqual([
        "This web service contains marine geospatial data held by Geoscience Australia. It includes bathymetry and backscatter gridded data plus derived layers, bathymetry coverage information, bathmetry collection priority and planning areas, marine sediment data and other derived products. It also contains the 150 m and optimal resolution bathymetry, 5 m sidescan sonar (SSS) and synthetic aperture sonar (SAS) data collected during phase 1 and 2 marine surveys conducted by the Governments of Australia, Malaysia and the People's Republic of China for the search of Malaysian Airlines Flight MH370 in the Indian Ocean. This web service allows exploration of the seafloor topography through the compilation of multibeam sonar and other marine datasets acquired.",
        "© Commonwealth of Australia (Geoscience Australia) 2017. This product is released under the Creative Commons Attribution 4.0 International Licence. http://creativecommons.org/licenses/by/4.0/legalcode"
      ]);
    });
  });

  describe("loadNestedMembers", function() {
    beforeEach(async function() {
      runInAction(() => {
        wfs.setTrait("definition", "url", "test/WFS/getCapabilities.xml");
      });
      await wfs.loadMembers();
    });

    it("loads", async function() {
      expect(wfs.members.length).toEqual(6);
      expect(wfs.memberModels.length).toEqual(6);

      const firstModel = wfs.memberModels[0];
      expect(
        CatalogMemberMixin.isMixedInto(firstModel) && firstModel.name
      ).toEqual("AusSeabed Bathymetry Holdings");
    });
  });
});
