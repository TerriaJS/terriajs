import { action, runInAction, toJS, when } from "mobx";
import { http, HttpResponse } from "msw";
import buildModuleUrl from "terriajs-cesium/Source/Core/buildModuleUrl";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import RequestScheduler from "terriajs-cesium/Source/Core/RequestScheduler";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import SplitDirection from "terriajs-cesium/Source/Scene/SplitDirection";
import URI from "urijs";
import hashEntity from "../../lib/Core/hashEntity";
import Result from "../../lib/Core/Result";
import TerriaError from "../../lib/Core/TerriaError";
import PickedFeatures from "../../lib/Map/PickedFeatures/PickedFeatures";
import { defaultBaseMaps } from "../../lib/Models/BaseMaps/defaultBaseMaps";
import CsvCatalogItem from "../../lib/Models/Catalog/CatalogItems/CsvCatalogItem";
import UrlReference, {
  UrlToCatalogMemberMapping
} from "../../lib/Models/Catalog/CatalogReferences/UrlReference";
import ArcGisFeatureServerCatalogItem from "../../lib/Models/Catalog/Esri/ArcGisFeatureServerCatalogItem";
import ArcGisMapServerCatalogItem from "../../lib/Models/Catalog/Esri/ArcGisMapServerCatalogItem";
import WebMapServiceCatalogGroup from "../../lib/Models/Catalog/Ows/WebMapServiceCatalogGroup";
import WebMapServiceCatalogItem from "../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import { BaseModel } from "../../lib/Models/Definition/Model";
import TerriaFeature from "../../lib/Models/Feature/Feature";
import { parseHashParams } from "../../lib/Models/HashParams";
import {
  buildInitSourcesFromStartData,
  buildInitSourcesFromUrlFragments,
  buildInitSourcesFromConfig,
  isInitFromData,
  isInitFromOptions,
  isInitFromUrl,
  updateInitSourcesFromUrl
} from "../../lib/Models/InitSource";
import Terria from "../../lib/Models/Terria";
import ViewerMode from "../../lib/Models/ViewerMode";
import ViewState from "../../lib/ReactViewModels/ViewState";
import { buildShareLink } from "../../lib/ReactViews/Map/Panels/SharePanel/BuildShareLink";
import configProxy from "../../wwwroot/test/init/configProxy.json";
import serverConfig from "../../wwwroot/test/init/serverconfig.json";
import storyJson from "../../wwwroot/test/stories/TerriaJS App/my-story.json";
import esriFeatureServerJson from "../../wwwroot/test/Terria/applyInitData/FeatureServer/esri_feature_server.json";
import mapServerSimpleGroupJson from "../../wwwroot/test/Terria/applyInitData/MapServer/mapServerSimpleGroup.json";
import mapServerWithErrorJson from "../../wwwroot/test/Terria/applyInitData/MapServer/mapServerWithError.json";
import wmsCapabilitiesXml from "../../wwwroot/test/Terria/applyInitData/WmsServer/capabilities.xml";
import SimpleCatalogItem from "../Helpers/SimpleCatalogItem";
import { worker } from "../mocks/browser";

describe("TerriaSpec", function () {
  let terria: Terria;

  beforeEach(function () {
    terria = new Terria({
      appBaseHref: "/",
      baseUrl: "./"
    });
  });

  describe("cesiumBaseUrl", function () {
    it("is set when passed as an option when constructing Terria", function () {
      terria = new Terria({
        appBaseHref: "/",
        baseUrl: "./",
        cesiumBaseUrl: "some/path/to/cesium"
      });

      const path = new URL(buildModuleUrl("")).pathname;
      expect(path).toBe("/some/path/to/cesium/");
    });

    it("should default to a path relative to `baseUrl`", function () {
      terria = new Terria({
        appBaseHref: "/",
        baseUrl: "some/path/to/terria"
      });
      const path = new URL(buildModuleUrl("")).pathname;
      expect(path).toBe("/some/path/to/terria/build/Cesium/build/");
    });

    it("should update the baseUrl setting in the cesium module", function () {
      expect(
        buildModuleUrl("Assets/some/image.png").endsWith(
          "/build/Cesium/build/Assets/some/image.png"
        )
      ).toBe(true);

      terria = new Terria({
        appBaseHref: "/",
        baseUrl: "some/path/to/terria"
      });
      expect(
        buildModuleUrl("Assets/some/image.png").endsWith(
          "/some/path/to/terria/build/Cesium/build/Assets/some/image.png"
        )
      ).toBe(true);
    });
  });

  describe("terria start", function () {
    beforeEach(function () {
      worker.use(
        http.get("*/serverconfig/*", () => HttpResponse.json({ foo: "bar" })),
        http.get("*/proxyabledomains/*", () =>
          HttpResponse.json({ foo: "bar" })
        )
      );
    });

    it("applies initSources in correct order", async function () {
      expect(terria.initSources.length).toEqual(0);
      worker.use(
        http.get("*/init/something.json", () =>
          HttpResponse.json({
            workbench: ["test"],
            catalog: [
              { id: "test", type: "czml", url: "test.czml" },
              { id: "test-2", type: "czml", url: "test-2.czml" }
            ],
            showSplitter: false,
            splitPosition: 0.5
          })
        ),
        http.get("https://application.url/init/hash-init.json", () =>
          HttpResponse.json({
            // Override workbench in "init/something.json"
            workbench: ["test-2"],
            showSplitter: true
          })
        ),
        // This model is added to the workbench in "init/something.json" - which is loaded before "https://application.url/init/hash-init.json"
        // So we add a long delay to make sure that `workbench` is overridden by `hash-init.json`
        http.get("*/test.czml", async () => {
          return HttpResponse.json([{ id: "document", version: "1.0" }]);
        }),
        // Note: no delay for "test-2.czml" - which is added to `workbench` by `hash-init.json
        http.get("*/test-2.czml", () =>
          HttpResponse.json([{ id: "document", version: "1.0" }])
        )
      );
      terria.build();
      terria.addInitSources(
        buildInitSourcesFromConfig({
          initializationUrls: ["something"],
          baseUri: new URI(terria.baseUrl),
          initFragmentPaths: terria.configParameters.initFragmentPaths
        })
      );

      const hashParams = parseHashParams("https://application.url/#hash-init");
      terria.setHashParams(hashParams).build();
      const initSources = await buildInitSourcesFromUrlFragments(
        "https://application.url/#hash-init",
        hashParams.initFragments,
        terria.configParameters.initFragmentPaths
      );
      terria.addInitSources(initSources);

      await terria.loadInitSources();

      expect(terria.initSources.length).toEqual(2);

      expect(terria.configParameters.showSplitter).toBe(true);
      expect(terria.configParameters.splitPosition).toBe(0.5);
      expect(terria.workbench.items.length).toBe(1);
      expect(terria.workbench.items[0].uniqueId).toBe("test-2");
    });

    it("works with initializationUrls and initFragmentPaths", async function () {
      expect(terria.initSources.length).toEqual(0);

      worker.use(
        http.get("*/init/something.json", () =>
          HttpResponse.json({
            catalog: []
          })
        ),
        http.get("https://hostname.com/*", () => HttpResponse.json({}))
      );

      terria
        .updateConfig({
          initFragmentPaths: [
            "path/to/init/",
            "https://hostname.com/some/other/path/"
          ]
        })
        .build();
      terria.addInitSources(
        buildInitSourcesFromConfig({
          initializationUrls: ["something"],
          baseUri: new URI("path/to/config/"),
          initFragmentPaths: [
            "path/to/init/",
            "https://hostname.com/some/other/path/"
          ]
        })
      );
      expect(terria.initSources.length).toEqual(1);

      const initSource = terria.initSources[0];
      expect(isInitFromOptions(initSource)).toBeTruthy();

      if (!isInitFromOptions(initSource))
        throw "Init source is not from options";

      // Note: initFragmentPaths in `initializationUrls` are resolved to the base URL of configURL
      // - which is path/to/config/
      expect(
        initSource.options.map((source) =>
          isInitFromUrl(source) ? source.initUrl : ""
        )
      ).toEqual([
        "path/to/config/path/to/init/something.json",
        "https://hostname.com/some/other/path/something.json"
      ]);
    });
  });

  describe("updateApplicationUrl", function () {
    it("works with initializationUrls and initFragmentPaths", async function () {
      expect(terria.initSources.length).toEqual(0);

      worker.use(
        http.get("*/path/to/config/configUrl.json", () =>
          HttpResponse.json({
            initializationUrls: ["something"],
            parameters: {}
          })
        ),
        http.get("*/init/something.json", () =>
          HttpResponse.json({
            catalog: []
          })
        ),
        http.get("https://application.url/*", () => HttpResponse.json({})),
        http.get("https://hostname.com/*", () => HttpResponse.json({}))
      );

      terria.updateConfig({
        initFragmentPaths: [
          "path/to/init/",
          "https://hostname.com/some/other/path/"
        ]
      });

      const hashParams = parseHashParams(
        "https://application.url/#someInitHash"
      );

      terria.setHashParams(hashParams).build();

      terria.addInitSources(
        buildInitSourcesFromConfig({
          initializationUrls: ["something"],
          baseUri: new URI("path/to/config/"),
          initFragmentPaths: terria.configParameters.initFragmentPaths
        })
      );
      terria.addInitSources(
        await buildInitSourcesFromUrlFragments(
          "https://application.url",
          hashParams.initFragments,
          terria.configParameters.initFragmentPaths
        )
      );

      expect(terria.initSources.length).toEqual(2);

      const initSource = terria.initSources[1];
      expect(isInitFromOptions(initSource)).toBeTruthy();

      if (!isInitFromOptions(initSource))
        throw "Init source is not from options";

      // Note: initFragmentPaths in hash parameters are resolved to the base URL of application URL
      // - which is https://application.url/
      expect(
        initSource.options.map((source) =>
          isInitFromUrl(source) ? source.initUrl : ""
        )
      ).toEqual([
        "https://application.url/path/to/init/someInitHash.json",
        "https://hostname.com/some/other/path/someInitHash.json"
      ]);
    });

    it("processes #start correctly", async function () {
      expect(terria.initSources.length).toEqual(0);

      worker.use(http.get("http://something/*", () => HttpResponse.json({})));

      const hashParams = parseHashParams(
        "https://application.url/#start=" +
          JSON.stringify({
            version: "8.0.0",
            initSources: ["http://something/init.json", { splitPosition: 0.3 }]
          })
      );

      terria.setHashParams(hashParams).build();
      const initSoruces = await buildInitSourcesFromStartData(hashParams.start);
      terria.addInitSources(initSoruces);

      expect(terria.initSources.length).toEqual(2);

      const urlInitSource = terria.initSources[0];
      expect(isInitFromUrl(urlInitSource)).toBeTruthy();

      if (!isInitFromUrl(urlInitSource)) throw "Init source is not from url";

      expect(urlInitSource.initUrl).toBe("http://something/init.json");

      const jsonInitSource = terria.initSources[1];
      expect(isInitFromData(jsonInitSource)).toBeTruthy();

      if (!isInitFromData(jsonInitSource)) throw "Init source is not from data";

      expect(jsonInitSource.data.splitPosition).toBe(0.3);
    });

    describe("test via serialise & load round-trip", function () {
      let newTerria: Terria;
      let viewState: ViewState;

      beforeEach(function () {
        newTerria = new Terria({ appBaseHref: "/", baseUrl: "./" });
        viewState = new ViewState({
          terria: terria,
          catalogSearchProvider: undefined
        });

        UrlToCatalogMemberMapping.register(
          (_s) => true,
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

      it("initializes user added data group with shared items", async function () {
        expect(newTerria.catalog.userAddedDataGroup.members).not.toContain(
          "itemABC"
        );
        expect(newTerria.catalog.userAddedDataGroup.members).not.toContain(
          "groupABC"
        );

        const shareLink = buildShareLink(terria, viewState);
        const baseUrl = new URL(document.baseURI);
        baseUrl.pathname = "";
        baseUrl.search = "";
        baseUrl.hash = "";
        await updateInitSourcesFromUrl(
          shareLink,
          baseUrl.toString(),
          newTerria
        );

        await newTerria.loadInitSources();
        expect(newTerria.catalog.userAddedDataGroup.members).toContain(
          "itemABC"
        );
        expect(newTerria.catalog.userAddedDataGroup.members).toContain(
          "groupABC"
        );
      });

      it("initializes user added data group with shared UrlReference items", async function () {
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
        const baseUrl = new URL(document.baseURI);
        baseUrl.pathname = "";
        baseUrl.search = "";
        baseUrl.hash = "";
        await updateInitSourcesFromUrl(
          shareLink,
          baseUrl.toString(),
          newTerria
        );
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

      it("initializes workbench with shared workbench items", async function () {
        const model1 = terria.getModelById(
          BaseModel,
          "itemABC"
        ) as WebMapServiceCatalogItem;
        const model2 = terria.getModelById(
          BaseModel,
          "itemDEF"
        ) as WebMapServiceCatalogItem;
        await terria.workbench.add(model1);
        await terria.workbench.add(model2);
        expect(terria.workbench.itemIds).toContain("itemABC");
        expect(terria.workbench.itemIds).toContain("itemDEF");
        expect(newTerria.workbench.itemIds).toEqual([]);

        const shareLink = buildShareLink(terria, viewState);
        const baseUrl = new URL(document.baseURI);
        baseUrl.pathname = "";
        baseUrl.search = "";
        baseUrl.hash = "";
        await updateInitSourcesFromUrl(
          shareLink,
          baseUrl.toString(),
          newTerria
        );
        await newTerria.loadInitSources();
        expect(newTerria.workbench.itemIds).toEqual(terria.workbench.itemIds);
      });

      it("initializes splitter correctly", async function () {
        const model1 = terria.getModelById(
          BaseModel,
          "itemABC"
        ) as WebMapServiceCatalogItem;
        await terria.workbench.add(model1);

        runInAction(() => {
          terria.configParameters.showSplitter = true;
          terria.configParameters.splitPosition = 0.7;
          model1.setTrait(
            CommonStrata.user,
            "splitDirection",
            SplitDirection.RIGHT
          );
        });

        const shareLink = buildShareLink(terria, viewState);
        const baseUrl = new URL(document.baseURI);
        baseUrl.pathname = "";
        baseUrl.search = "";
        baseUrl.hash = "";
        await updateInitSourcesFromUrl(
          shareLink,
          baseUrl.toString(),
          newTerria
        );
        await newTerria.loadInitSources();
        expect(newTerria.configParameters.showSplitter).toEqual(true);
        expect(newTerria.configParameters.splitPosition).toEqual(0.7);
        expect(newTerria.workbench.itemIds).toEqual(["itemABC"]);

        const newModel1 = newTerria.getModelById(
          BaseModel,
          "itemABC"
        ) as WebMapServiceCatalogItem;
        expect(newModel1).toBeDefined();
        expect(newModel1.splitDirection).toEqual(SplitDirection.RIGHT as any);
      });

      it("opens and loads members of shared open groups", async function () {
        const group = terria.getModelById(
          BaseModel,
          "groupABC"
        ) as WebMapServiceCatalogGroup;
        await viewState.viewCatalogMember(group);
        expect(group.isOpen).toBe(true);
        expect(group.members.length).toBeGreaterThan(0);
        const shareLink = buildShareLink(terria, viewState);
        const baseUrl = new URL(document.baseURI);
        baseUrl.pathname = "";
        baseUrl.search = "";
        baseUrl.hash = "";
        await updateInitSourcesFromUrl(
          shareLink,
          baseUrl.toString(),
          newTerria
        );
        await newTerria.loadInitSources();
        const newGroup = newTerria.getModelById(
          BaseModel,
          "groupABC"
        ) as WebMapServiceCatalogGroup;
        expect(newGroup.isOpen).toBe(true);
        expect(newGroup.members).toEqual(group.members);
      });
    });

    describe("using story route", function () {
      beforeEach(function () {
        // These specs must run with a Terria constructed with "appBaseHref": "/"
        // to make the specs work with browser runner
        terria.updateConfig({
          storyRouteUrlPrefix: "test/stories/TerriaJS%20App/"
        });

        worker.use(
          http.get("*/test/stories/TerriaJS%20App/my-story", () =>
            HttpResponse.json(storyJson)
          )
        );
      });

      it("sets playStory to 1", async function () {
        const baseUrl = new URL(document.baseURI);
        baseUrl.pathname = "";
        baseUrl.search = "";
        baseUrl.hash = "";
        await updateInitSourcesFromUrl(
          new URL("story/my-story", baseUrl).toString(),
          baseUrl.toString(),
          terria
        );
        expect(terria.playStoryOnInit).toBe(true);
      });

      it("correctly adds the story share as a datasource", async function () {
        const baseUrl = new URL(document.baseURI);
        baseUrl.pathname = "";
        baseUrl.search = "";
        baseUrl.hash = "";
        await updateInitSourcesFromUrl(
          new URL("story/my-story/", baseUrl).toString(),
          baseUrl.toString(),
          terria
        );
        expect(terria.initSources.length).toBe(1);
        expect(terria.initSources[0].name).toMatch(/my-story/);
        if (!isInitFromData(terria.initSources[0]))
          throw new Error("Expected initSource to be InitData from my-story");

        expect(toJS(terria.initSources[0].data)).toEqual(
          (storyJson as any).initSources[0]
        );
      });

      it("correctly adds the story share as a datasource when there's a trailing slash on story url", async function () {
        const baseUrl = new URL(document.baseURI);
        baseUrl.pathname = "";
        baseUrl.search = "";
        baseUrl.hash = "";
        await updateInitSourcesFromUrl(
          new URL("story/my-story/", baseUrl).toString(),
          baseUrl.toString(),
          terria
        );
        expect(terria.initSources.length).toBe(1);
        expect(terria.initSources[0].name).toMatch(/my-story/);
        if (!isInitFromData(terria.initSources[0]))
          throw new Error("Expected initSource to be InitData from my-story");

        expect(toJS(terria.initSources[0].data)).toEqual(
          (storyJson as any).initSources[0]
        );
      });
    });
  });

  // Test share keys by serialising from one catalog and deserialising with a reorganised catalog
  describe("shareKeys", function () {
    describe("with a JSON catalog", function () {
      let newTerria: Terria;
      let viewState: ViewState;
      beforeEach(async function () {
        // Create a config.json in a URL to pass to Terria.start
        newTerria = new Terria({ baseUrl: "./" });
        viewState = new ViewState({
          terria: terria,
          catalogSearchProvider: undefined
        });

        terria.updateConfig({
          regionMappingDefinitionsUrls: ["data/regionMapping.json"]
        });
        newTerria.updateConfig({
          regionMappingDefinitionsUrls: ["data/regionMapping.json"]
        });

        terria.catalog.group.addMembersFromJson(CommonStrata.definition, [
          {
            name: "Old group",
            type: "group",
            members: [
              {
                name: "Random CSV",
                type: "csv",
                url: "data:text/csv,lon%2Clat%2Cval%2Cdate%0A151%2C-31%2C15%2C2010%0A151%2C-31%2C15%2C2011"
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
                    url: "data:text/csv,lon%2Clat%2Cval%2Cdate%0A151%2C-31%2C15%2C2010%0A151%2C-31%2C15%2C2011",
                    shareKeys: ["//Old group/Random CSV"]
                  }
                ]
              }
            ]
          }
        ]);
      });

      it("correctly applies user stratum changes to moved item", async function () {
        const csv = terria.getModelById(
          CsvCatalogItem,
          "//Old group/Random CSV"
        );
        expect(csv).toBeDefined("Can't find csv item in source terria");
        csv?.setTrait(CommonStrata.user, "opacity", 0.5);
        const shareLink = buildShareLink(terria, viewState);
        const baseUrl = new URL(document.baseURI);
        baseUrl.pathname = "";
        baseUrl.search = "";
        baseUrl.hash = "";
        await updateInitSourcesFromUrl(
          shareLink,
          baseUrl.toString(),
          newTerria
        );
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

      it("correctly adds moved item to workbench and timeline", async function () {
        const csv = terria.getModelById(
          CsvCatalogItem,
          "//Old group/Random CSV"
        );
        expect(csv).toBeDefined("csv not found in source terria");
        if (csv === undefined) return;
        await terria.workbench.add(csv);
        terria.timelineStack.addToTop(csv);

        const shareLink = buildShareLink(terria, viewState);
        const baseUrl = new URL(document.baseURI);
        baseUrl.pathname = "";
        baseUrl.search = "";
        baseUrl.hash = "";
        await updateInitSourcesFromUrl(
          shareLink,
          baseUrl.toString(),
          newTerria
        );
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

  describe("proxyConfiguration", function () {
    beforeEach(function () {
      worker.use(
        http.get("*test/init/configProxy*", () =>
          HttpResponse.json(configProxy)
        ),
        http.get("*/serverconfig/*", () => HttpResponse.json(serverConfig))
      );
    });

    it("initializes proxy with parameters from config file", async function () {
      terria.updateConfig({
        corsProxyBaseUrl: "/myproxy/"
      });
      terria.initCorsProxy({
        proxyAllDomains: false,
        allowProxyFor: ["example.com", "csiro.au"],
        baseProxyUrl: terria.configParameters.corsProxyBaseUrl
      });

      expect(terria.corsProxy.baseProxyUrl).toBe("/myproxy/");
      expect(terria.corsProxy.proxyDomains).toEqual([
        "example.com",
        "csiro.au"
      ]);
    });
  });

  describe("removeModelReferences", function () {
    let model: SimpleCatalogItem;
    beforeEach(function () {
      model = new SimpleCatalogItem("testId", terria);
      terria.addModel(model);
    });

    it("removes the model from workbench", async function () {
      await terria.workbench.add(model);
      terria.removeModelReferences(model);
      expect(terria.workbench).not.toContain(model);
    });

    it(
      "it removes picked features & selected feature for the model",
      action(function () {
        terria.pickedFeatures = new PickedFeatures();
        const feature = new TerriaFeature({});
        terria.selectedFeature = feature;
        feature._catalogItem = model;
        terria.pickedFeatures.features.push(feature);
        terria.removeModelReferences(model);
        expect(terria.pickedFeatures.features.length).toBe(0);
        expect(terria.selectedFeature).toBeUndefined();
      })
    );

    it("unregisters the model from Terria", function () {
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

  describe("applyInitData", function () {
    describe("when pickedFeatures is not present in initData", function () {
      it("unsets the feature picking state if `canUnsetFeaturePickingState` is `true`", async function () {
        terria.pickedFeatures = new PickedFeatures();
        terria.selectedFeature = new Entity({
          name: "selected"
        }) as TerriaFeature;
        await terria.applyInitData({
          initData: {},
          canUnsetFeaturePickingState: true
        });
        expect(terria.pickedFeatures).toBeUndefined();
        expect(terria.selectedFeature).toBeUndefined();
      });

      it("otherwise, should not unset feature picking state", async function () {
        terria.pickedFeatures = new PickedFeatures();
        terria.selectedFeature = new Entity({
          name: "selected"
        }) as TerriaFeature;
        await terria.applyInitData({
          initData: {}
        });
        expect(terria.pickedFeatures).toBeDefined();
        expect(terria.selectedFeature).toBeDefined();
      });
    });

    describe("Sets workbench contents correctly", function () {
      const mapServerSimpleGroupUrl =
        "http://some.service.gov.au/arcgis/rest/services/mapServerSimpleGroup/MapServer";
      const mapServerWithErrorUrl =
        "http://some.service.gov.au/arcgis/rest/services/mapServerWithError/MapServer";
      const featureServerGroupUrl =
        "https://services2.arcgis.com/iCBB4zKDwkw2iwDD/arcgis/rest/services/Forest_Management_Zones/FeatureServer";
      const wmsUrl =
        "https://mapprod1.environment.nsw.gov.au/arcgis/services/VIS/Vegetation_SouthCoast_SCIVI_V14_E_2230/MapServer/WMSServer?request=GetCapabilities&service=WMS";

      const mapServerGroupModel = {
        type: "esri-mapServer-group",
        name: "A simple map server group",
        url: mapServerSimpleGroupUrl,
        id: "a-test-server-group"
      };

      const featureServerGroupModel = {
        type: "esri-featureServer-group",
        name: "A simple map server group",
        url: featureServerGroupUrl,
        id: "a-test-feature-server-group"
      };
      const wmsModel = {
        type: "wms",
        name: "A wms item",
        url: wmsUrl,
        id: "another-test-wms"
      };

      const mapServerModelWithError = {
        type: "esri-mapServer-group",
        name: "A map server with error",
        url: mapServerWithErrorUrl,
        id: "a-test-server-with-error"
      };

      const theOrderedItemsIds = [
        "a-test-server-group/0",
        "a-test-feature-server-group/0",
        "another-test-wms"
      ];

      let loadMapItemsWms: any = undefined;
      let loadMapItemsArcGisMap: any = undefined;
      let loadMapItemsArcGisFeature: any = undefined;
      beforeEach(function () {
        worker.use(
          // MapServer group metadata
          http.get(
            "http://some.service.gov.au/arcgis/rest/services/mapServerSimpleGroup/MapServer",
            () => HttpResponse.json(mapServerSimpleGroupJson)
          ),
          http.get(
            "http://some.service.gov.au/arcgis/rest/services/mapServerWithError/MapServer",
            () => HttpResponse.json(mapServerWithErrorJson)
          ),
          http.get(
            "https://services2.arcgis.com/iCBB4zKDwkw2iwDD/arcgis/rest/services/Forest_Management_Zones/FeatureServer",
            () => HttpResponse.json(esriFeatureServerJson)
          ),
          http.get(
            "https://mapprod1.environment.nsw.gov.au/arcgis/services/VIS/Vegetation_SouthCoast_SCIVI_V14_E_2230/MapServer/WMSServer",
            () => HttpResponse.xml(wmsCapabilitiesXml)
          )
        );

        // Do not call through.
        loadMapItemsArcGisMap = spyOn(
          ArcGisMapServerCatalogItem.prototype,
          "loadMapItems"
        ).and.callFake(() => Promise.resolve(Result.none()));
        loadMapItemsArcGisFeature = spyOn(
          ArcGisFeatureServerCatalogItem.prototype,
          "loadMapItems"
        ).and.callFake(() => Promise.resolve(Result.none()));
        loadMapItemsWms = spyOn(
          WebMapServiceCatalogItem.prototype,
          "loadMapItems"
        ).and.callFake(() => Promise.resolve(Result.none()));
      });

      it("when a workbench item is a simple map server group", async function () {
        await terria.applyInitData({
          initData: {
            catalog: [mapServerGroupModel],
            workbench: ["a-test-server-group"]
          }
        });
        expect(terria.workbench.itemIds).toEqual(["a-test-server-group/0"]);
        expect(loadMapItemsArcGisMap).toHaveBeenCalledTimes(1);
      });

      it("when the workbench has more than one items", async function () {
        await terria.applyInitData({
          initData: {
            catalog: [mapServerGroupModel, featureServerGroupModel, wmsModel],
            workbench: [
              "a-test-server-group",
              "a-test-feature-server-group",
              "another-test-wms"
            ]
          }
        });

        expect(terria.workbench.itemIds).toEqual(theOrderedItemsIds);
        expect(loadMapItemsWms).withContext("wms").toHaveBeenCalledTimes(1);
        expect(loadMapItemsArcGisMap)
          .withContext("arcgis map")
          .toHaveBeenCalledTimes(1);
        expect(loadMapItemsArcGisFeature)
          .withContext("arcgis feature")
          .toHaveBeenCalledTimes(1);
      });

      it("when the workbench has an unknown item", async function () {
        await terria.applyInitData({
          initData: {
            catalog: [mapServerGroupModel, featureServerGroupModel, wmsModel],
            workbench: [
              "id_of_unknown_model",
              "a-test-server-group",
              "a-test-feature-server-group",
              "another-test-wms"
            ]
          }
        });

        expect(terria.workbench.itemIds).toEqual(theOrderedItemsIds);
        expect(loadMapItemsWms).withContext("wms").toHaveBeenCalledTimes(1);
        expect(loadMapItemsArcGisMap)
          .withContext("arcgis map")
          .toHaveBeenCalledTimes(1);
        expect(loadMapItemsArcGisFeature)
          .withContext("arcgis feature")
          .toHaveBeenCalledTimes(1);
      });

      it("when a workbench item has errors", async function () {
        let error: TerriaError | undefined = undefined;
        try {
          await terria.applyInitData({
            initData: {
              catalog: [
                mapServerModelWithError,
                mapServerGroupModel,
                featureServerGroupModel,
                wmsModel
              ],
              workbench: [
                "a-test-server-with-error",
                "a-test-server-group",
                "a-test-feature-server-group",
                "another-test-wms"
              ]
            }
          });
        } catch (e) {
          error = e as TerriaError;
          expect(error.message === "models.terria.loadingInitSourceErrorTitle");
        } finally {
          expect(error).not.toEqual(undefined);
          expect(terria.workbench.itemIds).toEqual(theOrderedItemsIds);
          expect(loadMapItemsWms).withContext("wms").toHaveBeenCalledTimes(1);
          expect(loadMapItemsArcGisMap)
            .withContext("arcgis map")
            .toHaveBeenCalledTimes(1);
          expect(loadMapItemsArcGisFeature)
            .withContext("arcgis feature")
            .toHaveBeenCalledTimes(1);
        }
      });
    });

    describe("Enable/disable shorten share URL via init data", function () {
      beforeEach(function () {
        window.localStorage.clear();
      });

      it("should not change local property shortenShareUrls", async function () {
        await terria.applyInitData({
          initData: {}
        });
        expect(terria.localStorage.getItem("shortenShareUrls")).toBe(null);

        terria.updateConfig({ shortenShareUrls: true });
        await terria.applyInitData({
          initData: {}
        });
        expect(terria.localStorage.getItem("shortenShareUrls")).toBeTruthy();

        terria.updateConfig({ shortenShareUrls: false });
        await terria.applyInitData({
          initData: {}
        });
        expect(terria.localStorage.getItem("shortenShareUrls")).toBeFalsy();
      });

      it("should set local property shortenShareUrls to true", async function () {
        await terria.applyInitData({
          initData: {
            settings: {
              shortenShareUrls: true
            }
          }
        });
        expect(terria.localStorage.getItem("shortenShareUrls")).toBeTruthy();
      });

      it("should set local property shortenShareUrls to false", async function () {
        await terria.applyInitData({
          initData: {
            settings: {
              shortenShareUrls: false
            }
          }
        });
        expect(terria.localStorage.getItem("shortenShareUrls")).toBeFalsy();

        terria.updateConfig({ shortenShareUrls: true });
        await terria.applyInitData({
          initData: {
            settings: {
              shortenShareUrls: false
            }
          }
        });
        expect(terria.localStorage.getItem("shortenShareUrls")).toBeFalsy();
      });
    });
  });

  describe("mapSettings", function () {
    it("properly interprets map hash parameter", async () => {
      const hashParams = parseHashParams("http://test.com/#map=2d");
      terria.setHashParams(hashParams).build();

      expect(terria.mainViewer.viewerMode).toBe(ViewerMode.Leaflet);
    });

    it("properly resolves persisted map viewer", async () => {
      const getLocalPropertySpy = spyOn(
        terria.localStorage,
        "getItem"
      ).and.returnValue("2d");

      terria.build();

      expect(terria.mainViewer.viewerMode).toBe(ViewerMode.Leaflet);
      expect(getLocalPropertySpy).toHaveBeenCalledWith("viewermode");
    });

    it("properly interprets wrong map hash parameter and resolves persisted value", async () => {
      const getLocalPropertySpy = spyOn(
        terria.localStorage,
        "getItem"
      ).and.returnValue("3dsmooth");
      const location = {
        href: "http://test.com/#map=4d"
      } as Location;
      const hashParams = parseHashParams(location.href);
      terria.setHashParams(hashParams).build();

      expect(terria.mainViewer.viewerMode).toBe(ViewerMode.Cesium);
      expect(terria.mainViewer.viewerOptions.useTerrain).toBe(false);
      expect(getLocalPropertySpy).toHaveBeenCalledWith("viewermode");
    });

    it("uses `settings` in initsource", async () => {
      const setBaseMapSpy = spyOn(terria.mainViewer, "setBaseMap");

      terria.build();

      await terria.applyInitData({
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

      expect(terria.configParameters.baseMaximumScreenSpaceError).toBe(1);
      expect(terria.configParameters.useNativeResolution).toBeTruthy();
      expect(terria.timelineStack.alwaysShowingTimeline).toBeTruthy();
      expect(setBaseMapSpy).toHaveBeenCalledWith(
        terria.baseMapsModel.baseMapItems.find(
          (item) => item.item.uniqueId === "basemap-natural-earth-II"
        )?.item
      );

      expect(terria.configParameters.terrainSplitDirection).toBe(
        SplitDirection.LEFT
      );
      expect(
        terria.configParameters.depthTestAgainstTerrainEnabled
      ).toBeTruthy();
    });
  });

  describe("basemaps", function () {
    it("when no base maps are specified load defaultBaseMaps", async function () {
      terria.build();
      await terria.applyInitData({
        initData: {}
      });
      await terria.loadInitSources();
      const _defaultBaseMaps = defaultBaseMaps(terria);
      expect(terria.baseMapsModel).toBeDefined();
      expect(terria.baseMapsModel.baseMapItems.length).toBe(
        _defaultBaseMaps.length
      );
    });

    it("correctly loads the base maps", async function () {
      terria.build();
      await (
        await terria._applyInitData({
          initData: {
            settings: { baseMapId: "basemap-2" },
            baseMaps: {
              items: [
                {
                  item: {
                    id: "basemap-natural-earth-II",
                    name: "Natural Earth II",
                    type: "url-template-imagery",
                    url: "https://storage.googleapis.com/terria-datasets-public/basemaps/natural-earth-tiles/{z}/{x}/{reverseY}.png",
                    attribution:
                      "<a href='https://www.naturalearthdata.com/downloads/10m-raster-data/10m-natural-earth-2/'>Natural Earth II</a> - From Natural Earth. <a href='https://www.naturalearthdata.com/about/terms-of-use/'>Public Domain</a>.",
                    maximumLevel: 7,
                    opacity: 1.0
                  },
                  image: "build/TerriaJS/images/natural-earth.png",
                  contrastColor: "#000000"
                },
                {
                  item: {
                    id: "basemap-2",
                    name: "Base map 2",
                    type: "url-template-imagery",
                    url: "https://example.com"
                  }
                }
              ]
            }
          }
        })
      ).baseMapPromise;
      const _defaultBaseMaps = defaultBaseMaps(terria);
      expect(terria.baseMapsModel).toBeDefined();
      expect(terria.baseMapsModel.baseMapItems.length).toEqual(
        _defaultBaseMaps.length + 1
      );
      expect(terria.mainViewer.baseMap?.uniqueId).toBe("basemap-2");
    });
  });

  describe("loadPickedFeatures", function () {
    let container: HTMLElement;
    beforeEach(async function () {
      // Attach cesium viewer and wait for it to be loaded
      container = document.createElement("div");
      document.body.appendChild(container);
      terria.mainViewer.viewerOptions.useTerrain = false;
      terria.mainViewer.attach(container);
      return terria.mainViewer.viewerLoadPromise;
    });

    afterEach(() => {
      terria.mainViewer.destroy();
      document.body.removeChild(container);
    });

    it("sets the pickCoords", async function () {
      const Cesium = (await import("../../lib/Models/Cesium")).default;
      expect(terria.currentViewer instanceof Cesium).toBeTruthy();
      await terria.loadPickedFeatures({
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

    it("sets the selectedFeature", async function () {
      const testItem = new SimpleCatalogItem("test", terria);
      const ds = new CustomDataSource("ds");
      const entity = new Entity({ name: "foo" });
      ds.entities.add(entity);
      testItem.mapItems = [ds];
      await terria.workbench.add(testItem);
      const entityHash = hashEntity(entity, terria);
      await terria.loadPickedFeatures({
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

  it("customRequestSchedulerLimits sets RequestScheduler limits for domains", async function () {
    terria.updateConfig({
      customRequestSchedulerLimits: {
        "test.domain:333": 12
      }
    });
    terria.build();
    expect(RequestScheduler.requestsByServer["test.domain:333"]).toBe(12);
  });

  describe("initial zoom", function () {
    describe("behaviour of `initialCamera.focusWorkbenchItems`", function () {
      let container: HTMLElement;

      beforeEach(function () {
        // Attach cesium viewer and wait for it to be loaded
        container = document.createElement("div");
        document.body.appendChild(container);
        terria.mainViewer.viewerOptions.useTerrain = false;
        terria.mainViewer.attach(container);

        // An init source with a pre-loaded workbench item
        const initJson = {
          initialCamera: { focusWorkbenchItems: true },
          catalog: [
            {
              id: "points",
              type: "geojson",
              name: "Points",
              geoJsonData: {
                type: "Feature",
                bbox: [-10.0, -10.0, 10.0, 10.0],
                properties: {
                  foo: "hi",
                  bar: "bye"
                },
                geometry: {
                  type: "Polygon",
                  coordinates: [
                    [
                      [100.0, 0.0],
                      [101.0, 0.0],
                      [101.0, 1.0],
                      [100.0, 1.0],
                      [100.0, 0.0]
                    ],
                    [
                      [100.2, 0.2],
                      [100.8, 0.2],
                      [100.8, 0.8],
                      [100.2, 0.8],
                      [100.2, 0.2]
                    ]
                  ]
                }
              }
            }
          ],
          workbench: ["points"],
          baseMaps: {
            enabledBaseMaps: []
          }
        };
        worker.use(
          http.get("*/focus-workbench-items.json", () =>
            HttpResponse.json(initJson)
          )
        );
      });

      afterEach(() => {
        terria.mainViewer.destroy();
        document.body.removeChild(container);
      });

      it("zooms the map to focus on the workbench items", async function () {
        terria.build();
        terria.addInitSources(
          buildInitSourcesFromConfig({
            initializationUrls: ["focus-workbench-items.json"],
            baseUri: new URI(terria.baseUrl),
            initFragmentPaths: terria.configParameters.initFragmentPaths
          })
        );
        try {
          const result = await terria.loadInitSources();
          console.log(result);
        } catch (e) {
          fail(`Failed to load init sources: ${(e as Error).message}`);
        }
        await when(() => terria.currentViewer.type === "Cesium");

        const cameraPos = terria.cesium?.scene.camera.positionCartographic;
        expect(cameraPos).toBeDefined();
        const { longitude, latitude, height } = cameraPos!;
        expect(CesiumMath.toDegrees(longitude)).toBeCloseTo(100.5);
        expect(CesiumMath.toDegrees(latitude)).toBeCloseTo(0.5);
        expect(height).toBeCloseTo(191276.7939);
      });

      it("works correctly even when there is a delay in a Cesium/Leaflet viewer becoming available", async function () {
        // Start with NoViewer
        runInAction(() => {
          terria.mainViewer.viewerMode = undefined;
        });
        terria.addInitSources(
          buildInitSourcesFromConfig({
            initializationUrls: ["focus-workbench-items.json"],
            baseUri: new URI(terria.baseUrl),
            initFragmentPaths: terria.configParameters.initFragmentPaths
          })
        );
        terria.build();
        await terria.loadInitSources();
        expect(terria.currentViewer.type).toEqual("none");
        // Switch to Cesium viewer
        runInAction(() => {
          terria.mainViewer.viewerMode = ViewerMode.Cesium;
        });
        // Wait for the switch to happen
        await when(() => terria.mainViewer.currentViewer.type === "Cesium");
        // Ensure that the camera position is correctly updated after the switch
        const cameraPos = terria.cesium?.scene.camera.positionCartographic;
        const { longitude, latitude, height } = cameraPos!;
        expect(CesiumMath.toDegrees(longitude)).toBeCloseTo(100.5);
        expect(CesiumMath.toDegrees(latitude)).toBeCloseTo(0.5);
        expect(height).toBeCloseTo(191276.7939);
      });

      it("is not applied if subsequent init sources override the initialCamera settings", async function () {
        terria.addInitSources(
          buildInitSourcesFromConfig({
            initializationUrls: ["focus-workbench-items.json"],
            baseUri: new URI(terria.baseUrl),
            initFragmentPaths: terria.configParameters.initFragmentPaths
          })
        );
        terria.build();

        terria.initSources.push({
          data: {
            initialCamera: {
              west: 42,
              east: 44,
              north: 44,
              south: 42,
              zoomDuration: 0
            }
          }
        });

        // Terria uses a 2 second flight duration when zooming to CameraView.
        // Here we re-define zoomTo() to ignore duration and zoom to the target
        // immediately so that we can observe the effects without delay.
        const originalZoomTo = terria.currentViewer.zoomTo.bind(
          terria.currentViewer
        );
        terria.currentViewer.zoomTo = (target, _duration) =>
          originalZoomTo(target, 0.0);

        await terria.loadInitSources();
        await when(() => terria.currentViewer.type === "Cesium");

        const cameraPos = terria.cesium?.scene.camera.positionCartographic;
        expect(cameraPos).toBeDefined();
        const { longitude, latitude, height } = cameraPos!;
        expect(CesiumMath.toDegrees(longitude)).toBeCloseTo(43);
        expect(CesiumMath.toDegrees(latitude)).toBeCloseTo(43);
        expect(height).toBeCloseTo(384989.3092);
      });

      it("is not applied when share URL specifies a different initialCamera setting", async function () {
        // Terria uses a 2 second flight duration when zooming to CameraView.
        // Here we re-define zoomTo() to ignore duration and zoom to the target
        // immediately so that we can observe the effects without delay.
        await when(() => terria.currentViewer.type === "Cesium");
        const originalZoomTo = terria.currentViewer.zoomTo.bind(
          terria.currentViewer
        );
        terria.currentViewer.zoomTo = (target, _duration) =>
          originalZoomTo(target, 0.0);
        terria.addInitSources(
          buildInitSourcesFromConfig({
            initializationUrls: ["focus-workbench-items.json"],
            baseUri: new URI(terria.baseUrl),
            initFragmentPaths: terria.configParameters.initFragmentPaths
          })
        );
        terria.build();

        const initSources = await buildInitSourcesFromStartData({
          version: "8.0.0",
          initSources: [
            {
              stratum: "user",
              initialCamera: {
                east: 80.48324442836365,
                west: 74.16912021554141,
                north: 10.82936711956377,
                south: 7.882086009700934
              },
              workbench: ["points"]
            }
          ]
        });
        terria.addInitSources(initSources);

        await terria.loadInitSources();
        await when(() => terria.currentViewer.type === "Cesium");

        const cameraPos = terria.cesium?.scene.camera.positionCartographic;
        expect(cameraPos).toBeDefined();
        const { longitude, latitude, height } = cameraPos!;
        expect(CesiumMath.toDegrees(longitude)).toBeCloseTo(77.3261);
        expect(CesiumMath.toDegrees(latitude)).toBeCloseTo(9.3557);
        expect(height).toBeCloseTo(591140.7251);
      });
    });
  });

  describe("updateConfig()", function () {
    it("applies known config parameters", function () {
      terria.updateConfig({ appName: "MyMap" });
      expect(terria.appName).toBe("MyMap");
    });

    it("updates configParameters properties", function () {
      terria.updateConfig({ supportEmail: "help@example.com" });
      expect(terria.configParameters.supportEmail).toBe("help@example.com");
    });

    it("ignores unknown keys", function () {
      expect(() =>
        terria.updateConfig({ unknownKey: "value" } as any)
      ).not.toThrow();
    });
  });
});
