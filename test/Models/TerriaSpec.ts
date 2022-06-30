import { action, runInAction, toJS } from "mobx";
import RequestScheduler from "terriajs-cesium/Source/Core/RequestScheduler";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import SplitDirection from "terriajs-cesium/Source/Scene/SplitDirection";
import hashEntity from "../../lib/Core/hashEntity";
import _loadWithXhr from "../../lib/Core/loadWithXhr";
import Result from "../../lib/Core/Result";
import TerriaError from "../../lib/Core/TerriaError";
import PickedFeatures, {
  loadPickedFeaturesFromJson
} from "../../lib/Map/PickedFeatures/PickedFeatures";
import CsvCatalogItem from "../../lib/Models/Catalog/CatalogItems/CsvCatalogItem";
import UrlReference, {
  UrlToCatalogMemberMapping
} from "../../lib/Models/Catalog/CatalogReferences/UrlReference";
import ArcGisFeatureServerCatalogItem from "../../lib/Models/Catalog/Esri/ArcGisFeatureServerCatalogItem";
import ArcGisMapServerCatalogItem from "../../lib/Models/Catalog/Esri/ArcGisMapServerCatalogItem";
import WebMapServiceCatalogGroup from "../../lib/Models/Catalog/Ows/WebMapServiceCatalogGroup";
import WebMapServiceCatalogItem from "../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import Cesium from "../../lib/Models/Cesium";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import { BaseModel } from "../../lib/Models/Definition/Model";
import Feature from "../../lib/Models/Feature";
import { applyInitData } from "../../lib/Models/InitData";
import {
  addInitSourcesFromUrl,
  isInitFromData
} from "../../lib/Models/InitSource";
import Terria from "../../lib/Models/Terria";
import ViewerMode from "../../lib/Models/ViewerMode";
import ViewState from "../../lib/ReactViewModels/ViewState";
import { buildShareLink } from "../../lib/ReactViews/Map/Panels/SharePanel/BuildShareLink";
import SimpleCatalogItem from "../Helpers/SimpleCatalogItem";
import { defaultBaseMaps } from "./../../lib/Models/BaseMaps/defaultBaseMaps";

const mapConfigBasicJson = require("../../wwwroot/test/Magda/map-config-basic.json");
const mapConfigBasicString = JSON.stringify(mapConfigBasicJson);

const mapConfigV7Json = require("../../wwwroot/test/Magda/map-config-v7.json");
const mapConfigV7String = JSON.stringify(mapConfigV7Json);

const mapConfigInlineInitJson = require("../../wwwroot/test/Magda/map-config-inline-init.json");
const mapConfigInlineInitString = JSON.stringify(mapConfigInlineInitJson);

const mapConfigDereferencedJson = require("../../wwwroot/test/Magda/map-config-dereferenced.json");
const mapConfigDereferencedString = JSON.stringify(mapConfigDereferencedJson);

const mapConfigDereferencedNewJson = require("../../wwwroot/test/Magda/map-config-dereferenced-new.json");
const mapConfigDereferencedNewString = JSON.stringify(
  mapConfigDereferencedNewJson
);

// i18nOptions for CI
const i18nOptions = {
  // Skip calling i18next.init in specs
  skipInit: true
};

describe("Terria", function() {
  let terria: Terria;

  beforeEach(function() {
    terria = new Terria({
      appBaseHref: "/",
      baseUrl: "./"
    });
  });

  describe("terria start", function() {
    beforeEach(function() {
      jasmine.Ajax.install();
      // Fail all requests by default.
      jasmine.Ajax.stubRequest(/.*/).andError({});

      jasmine.Ajax.stubRequest(/.*(serverconfig|proxyabledomains).*/).andReturn(
        {
          responseText: JSON.stringify({ foo: "bar" })
        }
      );

      // from `terria.start()`
      jasmine.Ajax.stubRequest("test/Magda/map-config-basic.json").andReturn({
        responseText: mapConfigBasicString
      });

      jasmine.Ajax.stubRequest("test/Magda/map-config-v7.json").andReturn({
        responseText: mapConfigV7String
      });

      // terria's "Magda derived url"
      jasmine.Ajax.stubRequest(
        /.*api\/v0\/registry\/records\/map-config-basic.*/
      ).andReturn({ responseText: mapConfigBasicString });

      // inline init
      jasmine.Ajax.stubRequest(/.*map-config-inline-init.*/).andReturn({
        responseText: mapConfigInlineInitString
      });
      // inline init
      jasmine.Ajax.stubRequest(/.*map-config-dereferenced.*/).andReturn({
        responseText: mapConfigDereferencedString
      });
      jasmine.Ajax.stubRequest(/.*map-config-dereferenced-new.*/).andReturn({
        responseText: mapConfigDereferencedNewString
      });
    });

    afterEach(function() {
      jasmine.Ajax.uninstall();
    });
  });

  describe("addInitSourcesFromUrl", function() {
    describe("test via serialise & load round-trip", function() {
      let newTerria: Terria;
      let viewState: ViewState;

      beforeEach(function() {
        newTerria = new Terria({ appBaseHref: "/", baseUrl: "./" });
        viewState = new ViewState({
          terria: terria,
          catalogSearchProvider: null,
          locationSearchProviders: []
        });

        UrlToCatalogMemberMapping.register(
          s => true,
          WebMapServiceCatalogItem.type,
          true
        );

        terria.catalog.userAddedDataGroup.addMembersFromJson(
          CommonStrata.user,
          [
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
        );

        terria.catalog.group.addMembersFromJson(CommonStrata.user, [
          {
            id: "itemDEF",
            name: "def",
            type: "wms",
            url: "test/WMS/single_metadata_url.xml"
          }
        ]);
      });

      it("initializes user added data group with shared items", async function() {
        expect(newTerria.catalog.userAddedDataGroup.members).not.toContain(
          "itemABC"
        );
        expect(newTerria.catalog.userAddedDataGroup.members).not.toContain(
          "groupABC"
        );

        const shareLink = buildShareLink(terria, viewState);
        await addInitSourcesFromUrl(newTerria, shareLink);
        await newTerria.loadInitSources();
        expect(newTerria.catalog.userAddedDataGroup.members).toContain(
          "itemABC"
        );
        expect(newTerria.catalog.userAddedDataGroup.members).toContain(
          "groupABC"
        );
      });

      it("initializes user added data group with shared UrlReference items", async function() {
        terria.catalog.userAddedDataGroup.addMembersFromJson(
          CommonStrata.user,
          [
            {
              id: "url_test",
              name: "foo",
              type: "url-reference",
              url: "test/WMS/single_metadata_url.xml"
            }
          ]
        );

        const shareLink = buildShareLink(terria, viewState);
        await addInitSourcesFromUrl(newTerria, shareLink);
        await newTerria.loadInitSources();
        expect(newTerria.catalog.userAddedDataGroup.members).toContain(
          "url_test"
        );
        const urlRef = newTerria.getModelById(BaseModel, "url_test");
        expect(urlRef).toBeDefined();
        expect(urlRef instanceof UrlReference).toBe(true);

        if (urlRef instanceof UrlReference) {
          await urlRef.loadReference();
          expect(urlRef.target).toBeDefined();
        }
      });

      it("initializes workbench with shared workbench items", async function() {
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
        await addInitSourcesFromUrl(newTerria, shareLink);
        await newTerria.loadInitSources();
        expect(newTerria.workbench.itemIds).toEqual(terria.workbench.itemIds);
      });

      it("initializes splitter correctly", async function() {
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
            SplitDirection.RIGHT
          );
        });

        const shareLink = buildShareLink(terria, viewState);
        await addInitSourcesFromUrl(newTerria, shareLink);
        await newTerria.loadInitSources();
        expect(newTerria.showSplitter).toEqual(true);
        expect(newTerria.splitPosition).toEqual(0.7);
        expect(newTerria.workbench.itemIds).toEqual(["itemABC"]);

        const newModel1 = <WebMapServiceCatalogItem>(
          newTerria.getModelById(BaseModel, "itemABC")
        );
        expect(newModel1).toBeDefined();
        expect(newModel1.splitDirection).toEqual(<any>SplitDirection.RIGHT);
      });

      it("opens and loads members of shared open groups", async function() {
        const group = <WebMapServiceCatalogGroup>(
          terria.getModelById(BaseModel, "groupABC")
        );
        await viewState.viewCatalogMember(group);
        expect(group.isOpen).toBe(true);
        expect(group.members.length).toBeGreaterThan(0);
        const shareLink = buildShareLink(terria, viewState);
        await addInitSourcesFromUrl(newTerria, shareLink);
        await newTerria.loadInitSources();
        const newGroup = <WebMapServiceCatalogGroup>(
          newTerria.getModelById(BaseModel, "groupABC")
        );
        expect(newGroup.isOpen).toBe(true);
        expect(newGroup.members).toEqual(group.members);
      });
    });

    describe("using story route", function() {
      beforeEach(async function() {
        // These specs must run with a Terria constructed with "appBaseHref": "/"
        // to make the specs work with Karma runner
        terria.updateParameters({
          storyRouteUrlPrefix: "test/stories/TerriaJS%20App/"
        });
      });
      it("sets playStory to 1", async function() {
        await addInitSourcesFromUrl(
          terria,
          new URL("story/my-story", document.baseURI).toString()
        );
        expect(terria.userProperties.get("playStory")).toBe("1");
      });
      it("correctly adds the story share as a datasource", async function() {
        await addInitSourcesFromUrl(
          terria,
          new URL("story/my-story", document.baseURI).toString()
        );
        expect(terria.initSources.length).toBe(1);
        expect(terria.initSources[0].name).toMatch(/my-story/);
        if (!isInitFromData(terria.initSources[0]))
          throw new Error("Expected initSource to be InitData from my-story");

        expect(toJS(terria.initSources[0].data)).toEqual(
          (await (await fetch("test/stories/TerriaJS%20App/my-story")).json())
            .initSources[0]
        );
      });
      it("correctly adds the story share as a datasource when there's a trailing slash on story url", async function() {
        await addInitSourcesFromUrl(
          terria,
          new URL("story/my-story/", document.baseURI).toString()
        );
        expect(terria.initSources.length).toBe(1);
        expect(terria.initSources[0].name).toMatch(/my-story/);
        if (!isInitFromData(terria.initSources[0]))
          throw new Error("Expected initSource to be InitData from my-story");

        expect(toJS(terria.initSources[0].data)).toEqual(
          (await (await fetch("test/stories/TerriaJS%20App/my-story")).json())
            .initSources[0]
        );
      });
    });
  });

  // Test share keys by serialising from one catalog and deserialising with a reorganised catalog
  describe("shareKeys", function() {
    describe("with a JSON catalog", function() {
      let newTerria: Terria;
      let viewState: ViewState;
      beforeEach(async function() {
        // Create a config.json in a URL to pass to Terria.start
        const configUrl = `data:application/json;base64,${btoa(
          JSON.stringify({
            initializationUrls: [],
            parameters: {
              regionMappingDefinitionsUrl: "data/regionMapping.json"
            }
          })
        )}`;
        newTerria = new Terria({ baseUrl: "./" });
        viewState = new ViewState({
          terria: terria,
          catalogSearchProvider: null,
          locationSearchProviders: []
        });

        await Promise.all(
          [terria, newTerria].map(t => t.start({ configUrl, i18nOptions }))
        );

        terria.catalog.group.addMembersFromJson(CommonStrata.definition, [
          {
            name: "Old group",
            type: "group",
            members: [
              {
                name: "Random CSV",
                type: "csv",
                url:
                  "data:text/csv,lon%2Clat%2Cval%2Cdate%0A151%2C-31%2C15%2C2010%0A151%2C-31%2C15%2C2011"
              }
            ]
          }
        ]);

        newTerria.catalog.group.addMembersFromJson(CommonStrata.definition, [
          {
            name: "New group",
            type: "group",
            members: [
              {
                name: "Extra group",
                type: "group",
                members: [
                  {
                    name: "My random CSV",
                    type: "csv",
                    url:
                      "data:text/csv,lon%2Clat%2Cval%2Cdate%0A151%2C-31%2C15%2C2010%0A151%2C-31%2C15%2C2011",
                    shareKeys: ["//Old group/Random CSV"]
                  }
                ]
              }
            ]
          }
        ]);
      });

      it("correctly applies user stratum changes to moved item", async function() {
        const csv = terria.getModelById(
          CsvCatalogItem,
          "//Old group/Random CSV"
        );
        expect(csv).toBeDefined("Can't find csv item in source terria");
        csv?.setTrait(CommonStrata.user, "opacity", 0.5);
        const shareLink = buildShareLink(terria, viewState);
        await addInitSourcesFromUrl(newTerria, shareLink);
        await newTerria.loadInitSources();

        const newCsv = newTerria.getModelById(
          CsvCatalogItem,
          "//New group/Extra group/My random CSV"
        );
        expect(newCsv).toBeDefined(
          "Can't find newCsv item in destination newTerria"
        );
        expect(newCsv?.opacity).toBe(0.5);
      });

      it("correctly adds moved item to workbench and timeline", async function() {
        const csv = terria.getModelById(
          CsvCatalogItem,
          "//Old group/Random CSV"
        );
        expect(csv).toBeDefined("csv not found in source terria");
        if (csv === undefined) return;
        terria.workbench.add(csv);
        terria.timelineStack.addToTop(csv);
        const shareLink = buildShareLink(terria, viewState);
        await addInitSourcesFromUrl(newTerria, shareLink);
        await newTerria.loadInitSources();

        const newCsv = newTerria.getModelById(
          CsvCatalogItem,
          "//New group/Extra group/My random CSV"
        );
        expect(newCsv).toBeDefined("newCsv not found in destination newTerria");
        if (newCsv === undefined) return;
        expect(newTerria.workbench.contains(newCsv)).toBeTruthy(
          "newCsv not found in destination newTerria workbench"
        );
        expect(newTerria.timelineStack.contains(newCsv)).toBeTruthy(
          "newCsv not found in destination newTerria timeline"
        );
      });
    });
  });

  describe("proxyConfiguration", function() {
    beforeEach(function() {
      jasmine.Ajax.install();
      jasmine.Ajax.stubRequest(/.*(test\/init\/configProxy).*/).andReturn({
        responseText: JSON.stringify(
          require("../../wwwroot/test/init/configProxy.json")
        )
      });
      jasmine.Ajax.stubRequest(/.*(serverconfig).*/).andReturn({
        responseText: JSON.stringify(
          require("../../wwwroot/test/init/serverconfig.json")
        )
      });
    });

    afterEach(function() {
      jasmine.Ajax.uninstall();
    });

    it("initializes proxy with parameters from config file", function(done) {
      terria
        .start({
          configUrl: "test/init/configProxy.json",
          i18nOptions
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
  });

  describe("removeModelReferences", function() {
    let model: SimpleCatalogItem;
    beforeEach(function() {
      model = new SimpleCatalogItem("testId", terria);
      terria.addModel(model);
    });

    it("removes the model from workbench", function() {
      terria.workbench.add(model);
      terria.removeModelReferences(model);
      expect(terria.workbench).not.toContain(model);
    });

    it(
      "it removes picked features & selected feature for the model",
      action(function() {
        terria.pickedFeatures = new PickedFeatures();
        const feature = new Feature({});
        terria.selectedFeature = feature;
        feature._catalogItem = model;
        terria.pickedFeatures.features.push(feature);
        terria.removeModelReferences(model);
        expect(terria.pickedFeatures.features.length).toBe(0);
        expect(terria.selectedFeature).toBeUndefined();
      })
    );

    it("unregisters the model from Terria", function() {
      terria.removeModelReferences(model);
      expect(terria.getModelById(BaseModel, "testId")).toBeUndefined();
    });
  });

  //   it("tells us there's a time enabled WMS with `checkNowViewingForTimeWms()`", function(done) {
  //     terria
  //       .start({
  //         configUrl: "test/init/configProxy.json",
  //         i18nOptions
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
  //           .catch(done.fail);
  //       })
  //       .catch(done.fail);
  //   });

  describe("applyInitData", function() {
    describe("when pickedFeatures is not present in initData", function() {
      it("unsets the feature picking state if `canUnsetFeaturePickingState` is `true`", async function() {
        terria.pickedFeatures = new PickedFeatures();
        terria.selectedFeature = new Entity({ name: "selected" }) as Feature;
        await applyInitData(terria, {
          initData: {},
          canUnsetFeaturePickingState: true
        });
        expect(terria.pickedFeatures).toBeUndefined();
        expect(terria.selectedFeature).toBeUndefined();
      });

      it("otherwise, should not unset feature picking state", async function() {
        terria.pickedFeatures = new PickedFeatures();
        terria.selectedFeature = new Entity({ name: "selected" }) as Feature;
        await applyInitData(terria, {
          initData: {}
        });
        expect(terria.pickedFeatures).toBeDefined();
        expect(terria.selectedFeature).toBeDefined();
      });
    });

    describe("Sets workbench contents correctly", function() {
      interface ExtendedLoadWithXhr {
        (): any;
        load: { (...args: any[]): any; calls: any };
      }
      const loadWithXhr: ExtendedLoadWithXhr = <any>_loadWithXhr;
      const mapServerSimpleGroupUrl =
        "http://some.service.gov.au/arcgis/rest/services/mapServerSimpleGroup/MapServer";
      const mapServerWithErrorUrl =
        "http://some.service.gov.au/arcgis/rest/services/mapServerWithError/MapServer";
      const magdaRecordFeatureServerGroupUrl =
        "http://magda.reference.group.service.gov.au";
      const magdaRecordDerefencedToWmsUrl =
        "http://magda.references.wms.gov.au";

      const mapServerGroupModel = {
        type: "esri-mapServer-group",
        name: "A simple map server group",
        url: mapServerSimpleGroupUrl,
        id: "a-test-server-group"
      };

      const magdaRecordDerefencedToFeatureServerGroup = {
        type: "magda",
        name: "A magda record derefenced to a simple feature server group",
        url: magdaRecordFeatureServerGroupUrl,
        recordId: "magda-record-id-dereferenced-to-feature-server-group",
        id: "a-test-magda-record"
      };

      const magdaRecordDerefencedToWms = {
        type: "magda",
        name: "A magda record derefenced to wms",
        url: magdaRecordDerefencedToWmsUrl,
        recordId: "magda-record-id-dereferenced-to-wms",
        id: "another-test-magda-record"
      };

      const mapServerModelWithError = {
        type: "esri-mapServer-group",
        name: "A map server with error",
        url: mapServerWithErrorUrl,
        id: "a-test-server-with-error"
      };

      const theOrderedItemsIds = [
        "a-test-server-group/0",
        "a-test-magda-record/0",
        "another-test-magda-record"
      ];

      let loadMapItemsWms: any = undefined;
      let loadMapItemsArcGisMap: any = undefined;
      let loadMapItemsArcGisFeature: any = undefined;
      beforeEach(function() {
        const realLoadWithXhr = loadWithXhr.load;
        spyOn(loadWithXhr, "load").and.callFake(function(...args: any[]) {
          const url = args[0];

          if (
            url.match("mapServerSimpleGroup") &&
            url.indexOf("MapServer?f=json") !== -1
          ) {
            args[0] =
              "test/Terria/applyInitData/MapServer/mapServerSimpleGroup.json";
          } else if (
            url.match("mapServerWithError") &&
            url.indexOf("MapServer?f=json") !== -1
          ) {
            args[0] =
              "test/Terria/applyInitData/MapServer/mapServerWithError.json";
          } else if (
            url.match("magda-record-id-dereferenced-to-feature-server-group")
          ) {
            args[0] =
              "test/Terria/applyInitData/MagdaReference/group_record.json";
          } else if (url.match("magda-record-id-dereferenced-to-wms")) {
            args[0] =
              "test/Terria/applyInitData/MagdaReference/wms_record.json";
          } else if (
            url.match("services2.arcgis.com") &&
            url.indexOf("FeatureServer?f=json") !== -1
          ) {
            args[0] =
              "test/Terria/applyInitData/FeatureServer/esri_feature_server.json";
          } else if (
            url.match("mapprod1.environment.nsw.gov.au") &&
            url.indexOf("request=GetCapabilities") !== -1
          ) {
            args[0] = "test/Terria/applyInitData/WmsServer/capabilities.xml";
          }

          const result = realLoadWithXhr(...args);
          return result;
        });

        // Do not call through.
        loadMapItemsArcGisMap = spyOn(
          ArcGisMapServerCatalogItem.prototype,
          "loadMapItems"
        ).and.returnValue(Result.none());
        loadMapItemsArcGisFeature = spyOn(
          ArcGisFeatureServerCatalogItem.prototype,
          "loadMapItems"
        ).and.returnValue(Result.none());
        loadMapItemsWms = spyOn(
          WebMapServiceCatalogItem.prototype,
          "loadMapItems"
        ).and.returnValue(Result.none());
      });

      it("when a workbench item is a simple map server group", async function() {
        await applyInitData(terria, {
          initData: {
            catalog: [mapServerGroupModel],
            workbench: ["a-test-server-group"]
          }
        });
        expect(terria.workbench.itemIds).toEqual(["a-test-server-group/0"]);
        expect(loadMapItemsArcGisMap).toHaveBeenCalledTimes(1);
      });

      it("when a workbench item is a referenced map server group", async function() {
        await applyInitData(terria, {
          initData: {
            catalog: [magdaRecordDerefencedToFeatureServerGroup],
            workbench: ["a-test-magda-record"]
          }
        });
        expect(terria.workbench.itemIds).toEqual(["a-test-magda-record/0"]);
        expect(loadMapItemsArcGisFeature).toHaveBeenCalledTimes(1);
      });

      it("when a workbench item is a referenced wms", async function() {
        await applyInitData(terria, {
          initData: {
            catalog: [magdaRecordDerefencedToWms],
            workbench: ["another-test-magda-record"]
          }
        });
        expect(terria.workbench.itemIds).toEqual(["another-test-magda-record"]);
        expect(loadMapItemsWms).toHaveBeenCalledTimes(1);
      });

      it("when the workbench has more than one items", async function() {
        await applyInitData(terria, {
          initData: {
            catalog: [
              mapServerGroupModel,
              magdaRecordDerefencedToFeatureServerGroup,
              magdaRecordDerefencedToWms
            ],
            workbench: [
              "a-test-server-group",
              "a-test-magda-record",
              "another-test-magda-record"
            ]
          }
        });

        expect(terria.workbench.itemIds).toEqual(theOrderedItemsIds);
        expect(loadMapItemsWms).toHaveBeenCalledTimes(1);
        expect(loadMapItemsArcGisMap).toHaveBeenCalledTimes(1);
        expect(loadMapItemsArcGisFeature).toHaveBeenCalledTimes(1);
      });

      it("when the workbench has an unknown item", async function() {
        await applyInitData(terria, {
          initData: {
            catalog: [
              mapServerGroupModel,
              magdaRecordDerefencedToFeatureServerGroup,
              magdaRecordDerefencedToWms
            ],
            workbench: [
              "id_of_unknown_model",
              "a-test-server-group",
              "a-test-magda-record",
              "another-test-magda-record"
            ]
          }
        });

        expect(terria.workbench.itemIds).toEqual(theOrderedItemsIds);
        expect(loadMapItemsWms).toHaveBeenCalledTimes(1);
        expect(loadMapItemsArcGisMap).toHaveBeenCalledTimes(1);
        expect(loadMapItemsArcGisFeature).toHaveBeenCalledTimes(1);
      });

      it("when a workbench item has errors", async function() {
        let error: TerriaError | undefined = undefined;
        try {
          await applyInitData(terria, {
            initData: {
              catalog: [
                mapServerModelWithError,
                mapServerGroupModel,
                magdaRecordDerefencedToFeatureServerGroup,
                magdaRecordDerefencedToWms
              ],
              workbench: [
                "a-test-server-with-error",
                "a-test-server-group",
                "a-test-magda-record",
                "another-test-magda-record"
              ]
            }
          });
        } catch (e) {
          error = <TerriaError>e;
          expect(error.message === "models.terria.loadingInitSourceErrorTitle");
        } finally {
          expect(error).not.toEqual(undefined);
          expect(terria.workbench.itemIds).toEqual(theOrderedItemsIds);
          expect(loadMapItemsWms).toHaveBeenCalledTimes(1);
          expect(loadMapItemsArcGisMap).toHaveBeenCalledTimes(1);
          expect(loadMapItemsArcGisFeature).toHaveBeenCalledTimes(1);
        }
      });
    });
  });

  describe("mapSettings", function() {
    it("properly interprets map hash parameter", async () => {
      const getLocalPropertySpy = spyOn(terria, "getLocalProperty");
      //@ts-ignore
      const location: Location = {
        href: "http://test.com/#map=2d"
      };
      await terria.start({ configUrl: "", applicationUrl: location });

      expect(terria.mainViewer.viewerMode).toBe(ViewerMode.Leaflet);
      expect(getLocalPropertySpy).not.toHaveBeenCalledWith("viewermode");
    });

    it("properly resolves persisted map viewer", async () => {
      const getLocalPropertySpy = spyOn(
        terria,
        "getLocalProperty"
      ).and.returnValue("2d");
      await terria.start({ configUrl: "" });

      expect(terria.mainViewer.viewerMode).toBe(ViewerMode.Leaflet);
      expect(getLocalPropertySpy).toHaveBeenCalledWith("viewermode");
    });

    it("properly interprets wrong map hash parameter and resolves persisted value", async () => {
      const getLocalPropertySpy = spyOn(
        terria,
        "getLocalProperty"
      ).and.returnValue("3dsmooth");
      //@ts-ignore
      const location: Location = {
        href: "http://test.com/#map=4d"
      };
      await terria.start({ configUrl: "", applicationUrl: location });

      expect(terria.mainViewer.viewerMode).toBe(ViewerMode.Cesium);
      expect(terria.mainViewer.viewerOptions.useTerrain).toBe(false);
      expect(getLocalPropertySpy).toHaveBeenCalledWith("viewermode");
    });

    it("uses `settings` in initsource", async () => {
      const setBaseMapSpy = spyOn(terria.mainViewer, "setBaseMap");

      await terria.start({ configUrl: "" });

      applyInitData(terria, {
        initData: {
          settings: {
            baseMaximumScreenSpaceError: 1,
            useNativeResolution: true,
            alwaysShowTimeline: true,
            baseMapId: "basemap-natural-earth-II",
            terrainSplitDirection: -1,
            depthTestAgainstTerrainEnabled: true
          }
        }
      });

      await terria.loadInitSources();

      expect(terria.baseMaximumScreenSpaceError).toBe(1);
      expect(terria.useNativeResolution).toBeTruthy;
      expect(terria.timelineStack.alwaysShowingTimeline).toBeTruthy();
      expect(setBaseMapSpy).toHaveBeenCalledWith(
        terria.baseMapsModel.baseMapItems.find(
          item => item.item.uniqueId === "basemap-natural-earth-II"
        )?.item
      );

      expect(terria.terrainSplitDirection).toBe(SplitDirection.LEFT);
      expect(terria.depthTestAgainstTerrainEnabled).toBeTruthy();
    });
  });

  describe("basemaps", function() {
    it("when no base maps are specified load defaultBaseMaps", async function() {
      await terria.start({ configUrl: "" });
      applyInitData(terria, {
        initData: {}
      });
      await terria.loadInitSources();
      const _defaultBaseMaps = defaultBaseMaps(terria);
      expect(terria.baseMapsModel).toBeDefined();
      expect(terria.baseMapsModel.baseMapItems.length).toBe(
        _defaultBaseMaps.length
      );
    });

    it("propperly loads base maps", async function() {
      await terria.start({ configUrl: "" });
      applyInitData(terria, {
        initData: {
          baseMaps: {
            items: [
              {
                item: {
                  id: "basemap-positron",
                  name: "Positron (Light)",
                  type: "open-street-map",
                  url: "https://basemaps.cartocdn.com/light_all/",
                  attribution:
                    "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>, © <a href='https://carto.com/about-carto/'>CARTO</a>",
                  subdomains: ["a", "b", "c", "d"],
                  opacity: 1.0
                },
                image: "/images/positron.png"
              },
              {
                item: {
                  id: "basemap-darkmatter1",
                  name: "Dark Matter",
                  type: "open-street-map",
                  url: "https://basemaps.cartocdn.com/dark_all/",
                  attribution:
                    "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>, © <a href='https://carto.com/about-carto/'>CARTO</a>",
                  subdomains: ["a", "b", "c", "d"],
                  opacity: 1.0
                },
                image: "/images/dark-matter.png"
              }
            ]
          }
        }
      });
      const _defaultBaseMaps = defaultBaseMaps(terria);
      expect(terria.baseMapsModel).toBeDefined();
      expect(terria.baseMapsModel.baseMapItems.length).toEqual(
        _defaultBaseMaps.length + 1
      );
    });
  });

  describe("loadPickedFeatures", function() {
    beforeEach(async function() {
      // Attach cesium viewer and wait for it to be loaded
      const container = document.createElement("div");
      document.body.appendChild(container);
      terria.mainViewer.attach(container);
      return (terria.mainViewer as any)._cesiumPromise;
    });

    it("sets the pickCoords", async function() {
      expect(terria.currentViewer instanceof Cesium).toBeTruthy();
      await loadPickedFeaturesFromJson(terria, {
        pickCoords: {
          lat: 84.93,
          lng: 77.91,
          height: -5400810.41
        },
        providerCoords: {
          "https://foo": { x: 123, y: 456, level: 7 },
          "https://bar": { x: 42, y: 42, level: 4 }
        }
      });
      const pickPosition = terria.pickedFeatures?.pickPosition;
      expect(pickPosition).toBeDefined();
      if (pickPosition) {
        const { x, y, z } = pickPosition;
        expect(x.toFixed(2)).toBe("18483.85");
        expect(y.toFixed(2)).toBe("86292.94");
        expect(z.toFixed(2)).toBe("952035.13");
      }
    });

    it("sets the selectedFeature", async function() {
      const testItem = new SimpleCatalogItem("test", terria);
      const ds = new CustomDataSource("ds");
      const entity = new Entity({ name: "foo" });
      ds.entities.add(entity);
      testItem.mapItems = [ds];
      await terria.workbench.add(testItem);
      // It is irrelevant what we pass as argument for `clock` param because
      // the current implementation of `hashEntity` is broken because as it
      // expects a `Clock` but actually uses it as a `JulianDate`
      const entityHash = hashEntity(entity, undefined);
      await loadPickedFeaturesFromJson(terria, {
        pickCoords: {
          lat: 84.93,
          lng: 77.91,
          height: -5400810.41
        },
        providerCoords: {
          "https://foo": { x: 123, y: 456, level: 7 },
          "https://bar": { x: 42, y: 42, level: 4 }
        },
        entities: [
          {
            hash: entityHash,
            name: "foo"
          }
        ],
        current: {
          hash: entityHash,
          name: "foo"
        }
      });
      expect(terria.selectedFeature).toBeDefined();
      expect(terria.selectedFeature?.name).toBe("foo");
    });
  });

  it("customRequestSchedulerLimits sets RequestScheduler limits for domains", async function() {
    const configUrl = `data:application/json;base64,${btoa(
      JSON.stringify({
        initializationUrls: [],
        parameters: {
          customRequestSchedulerLimits: {
            "test.domain:333": 12
          }
        }
      })
    )}`;
    await terria.start({ configUrl, i18nOptions });
    expect(RequestScheduler.requestsByServer["test.domain:333"]).toBe(12);
  });
});
