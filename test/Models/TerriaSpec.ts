import Terria from "../../lib/Models/Terria";
import updateModelFromJson from "../../lib/Models/updateModelFromJson";
import CommonStrata from "../../lib/Models/CommonStrata";
import ViewState from "../../lib/ReactViewModels/ViewState";
import { buildShareLink } from "../../lib/ReactViews/Map/Panels/SharePanel/BuildShareLink";
import WebMapServiceCatalogItem from "../../lib/Models/WebMapServiceCatalogItem";
import WebMapServiceCatalogGroup from "../../lib/Models/WebMapServiceCatalogGroup";
import CatalogMemberFactory from "../../lib/Models/CatalogMemberFactory";
import openGroup from "../../lib/Models/openGroup";
import { BaseModel } from "../../lib/Models/Model";
import { runInAction } from "mobx";
import ImagerySplitDirection from "terriajs-cesium/Source/Scene/ImagerySplitDirection";

describe("Terria", function() {
  let terria: Terria;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
  });

  describe("updateApplicationUrl", function() {
    let newTerria: Terria;
    let viewState: ViewState;

    beforeEach(function() {
      newTerria = new Terria({ baseUrl: "./" });
      viewState = new ViewState({
        terria: terria,
        catalogSearchProvider: null,
        locationSearchProviders: []
      });

      CatalogMemberFactory.register(
        WebMapServiceCatalogItem.type,
        WebMapServiceCatalogItem
      );
      CatalogMemberFactory.register(
        WebMapServiceCatalogGroup.type,
        WebMapServiceCatalogGroup
      );
      updateModelFromJson(
        terria.catalog.userAddedDataGroup,
        CommonStrata.user,
        {
          members: [
            {
              id: "itemABC",
              name: "abc",
              type: "wms",
              url: "test/WMS/single_metadata_url.xml"
            },
            {
              id: "groupABC",
              name: "xyz",
              type: "wms-group",
              url: "test/WMS/single_metadata_url.xml"
            }
          ]
        }
      );
      updateModelFromJson(terria.catalog.group, CommonStrata.user, {
        members: [
          {
            id: "itemDEF",
            name: "def",
            type: "wms",
            url: "test/WMS/single_metadata_url.xml"
          }
        ]
      });
    });

    it("initializes user added data group with shared items", function(done) {
      expect(newTerria.catalog.userAddedDataGroup.members).not.toContain(
        "itemABC"
      );
      expect(newTerria.catalog.userAddedDataGroup.members).not.toContain(
        "groupABC"
      );

      const shareLink = buildShareLink(terria, viewState);
      newTerria.updateApplicationUrl(shareLink).then(() => {
        expect(newTerria.catalog.userAddedDataGroup.members).toContain(
          "itemABC"
        );
        expect(newTerria.catalog.userAddedDataGroup.members).toContain(
          "groupABC"
        );

        done();
      });
    });

    it("initializes workbench with shared workbench items", function(done) {
      const model1 = <WebMapServiceCatalogItem>(
        terria.getModelById(BaseModel, "itemABC")
      );
      const model2 = <WebMapServiceCatalogItem>(
        terria.getModelById(BaseModel, "itemDEF")
      );
      terria.workbench.add(model1);
      terria.workbench.add(model2);
      expect(terria.workbench.itemIds).toContain("itemABC");
      expect(terria.workbench.itemIds).toContain("itemDEF");
      expect(newTerria.workbench.itemIds).toEqual([]);

      const shareLink = buildShareLink(terria, viewState);
      newTerria.updateApplicationUrl(shareLink).then(() => {
        expect(newTerria.workbench.itemIds).toEqual(terria.workbench.itemIds);
        done();
      });
    });

    it("initializes splitter correctly", function(done) {
      const model1 = <WebMapServiceCatalogItem>(
        terria.getModelById(BaseModel, "itemABC")
      );
      terria.workbench.add(model1);

      runInAction(() => {
        terria.showSplitter = true;
        terria.splitPosition = 0.7;
        model1.setTrait(
          CommonStrata.user,
          "splitDirection",
          ImagerySplitDirection.RIGHT
        );
      });

      const shareLink = buildShareLink(terria, viewState);
      newTerria.updateApplicationUrl(shareLink).then(() => {
        expect(newTerria.showSplitter).toEqual(true);
        expect(newTerria.splitPosition).toEqual(0.7);
        expect(newTerria.workbench.itemIds).toEqual(["itemABC"]);

        const newModel1 = <WebMapServiceCatalogItem>(
          newTerria.getModelById(BaseModel, "itemABC")
        );
        expect(newModel1).toBeDefined();
        expect(newModel1.splitDirection).toEqual(<any>(
          ImagerySplitDirection.RIGHT
        ));

        done();
      });
    });

    it("opens and loads members of shared open groups", function(done) {
      const group = <WebMapServiceCatalogGroup>(
        terria.getModelById(BaseModel, "groupABC")
      );
      openGroup(group)
        .then(() => {
          expect(group.isOpen).toBe(true);
          expect(group.members.length).toBeGreaterThan(0);
          return buildShareLink(terria, viewState);
        })
        .then(shareLink => newTerria.updateApplicationUrl(shareLink))
        .then(() => {
          const newGroup = <WebMapServiceCatalogGroup>(
            newTerria.getModelById(BaseModel, "groupABC")
          );
          expect(newGroup.isOpen).toBe(true);
          expect(newGroup.members).toEqual(group.members);
          done();
        });
    });
  });

  it("initializes proxy with parameters from config file", function(done) {
    terria
      .start({
        configUrl: "test/init/configProxy.json"
      })
      .then(function() {
        expect(terria.corsProxy.baseProxyUrl).toBe("/myproxy/");
        expect(terria.corsProxy.proxyDomains).toEqual([
          "example.com",
          "csiro.au"
        ]);
        done();
      })
      .catch(error => {
        done.fail();
      });
  });

  //   it("tells us there's a time enabled WMS with `checkNowViewingForTimeWms()`", function(done) {
  //     terria
  //       .start({
  //         configUrl: "test/init/configProxy.json"
  //       })
  //       .then(function() {
  //         expect(terria.checkNowViewingForTimeWms()).toEqual(false);
  //       })
  //       .then(function() {
  //         const wmsItem = new WebMapServiceCatalogItem(terria);
  //         wmsItem.updateFromJson({
  //           url: "http://example.com",
  //           metadataUrl: "test/WMS/comma_sep_datetimes_inherited.xml",
  //           layers: "13_intervals",
  //           dataUrl: "" // to prevent a DescribeLayer request
  //         });
  //         wmsItem
  //           .load()
  //           .then(function() {
  //             terria.nowViewing.add(wmsItem);
  //             expect(terria.checkNowViewingForTimeWms()).toEqual(true);
  //           })
  //           .then(done)
  //           .otherwise(done.fail);
  //       })
  //       .otherwise(done.fail);
  //   });
});
