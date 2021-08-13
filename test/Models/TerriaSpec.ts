import { action, runInAction } from "mobx";
import RequestScheduler from "terriajs-cesium/Source/Core/RequestScheduler";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import ImagerySplitDirection from "terriajs-cesium/Source/Scene/ImagerySplitDirection";
import hashEntity from "../../lib/Core/hashEntity";
import PickedFeatures from "../../lib/Map/PickedFeatures";
import CameraView from "../../lib/Models/CameraView";
import CsvCatalogItem from "../../lib/Models/Catalog/CatalogItems/CsvCatalogItem";
import MagdaReference from "../../lib/Models/Catalog/CatalogReferences/MagdaReference";
import WebMapServiceCatalogGroup from "../../lib/Models/Catalog/Ows/WebMapServiceCatalogGroup";
import WebMapServiceCatalogItem from "../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import UrlReference, {
  UrlToCatalogMemberMapping
} from "../../lib/Models/Catalog/CatalogReferences/UrlReference";
import Cesium from "../../lib/Models/Cesium";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import { BaseModel } from "../../lib/Models/Definition/Model";
import Feature from "../../lib/Models/Feature";
import {
  isInitData,
  isInitDataPromise,
  isInitUrl
} from "../../lib/Models/InitSource";
import Terria from "../../lib/Models/Terria";
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

// i18nOptions for CI
const i18nOptions = {
  // Skip calling i18next.init in specs
  skipInit: true
};

describe("Terria", function() {
  let terria: Terria;

  beforeEach(function() {
    terria = new Terria({
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
    });

    afterEach(function() {
      jasmine.Ajax.uninstall();
    });

    describe("via loadMagdaConfig", function() {
      it("should dereference uniqueId to `/`", function(done) {
        expect(terria.catalog.group.uniqueId).toEqual("/");

        jasmine.Ajax.stubRequest(/.*api\/v0\/registry.*/).andReturn({
          // terria's "Magda derived url"
          responseText: mapConfigBasicString
        });
        // no init sources before starting
        expect(terria.initSources.length).toEqual(0);

        terria
          .start({
            configUrl: "test/Magda/map-config-basic.json",
            i18nOptions
          })
          .then(function() {
            expect(terria.catalog.group.uniqueId).toEqual("/");
            done();
          })
          .catch(error => {
            done.fail(error);
          });
      });
      it("works with basic initializationUrls", function(done) {
        jasmine.Ajax.stubRequest(/.*api\/v0\/registry.*/).andReturn({
          // terria's "Magda derived url"
          responseText: mapConfigBasicString
        });
        // no init sources before starting
        expect(terria.initSources.length).toEqual(0);

        terria
          .start({
            configUrl: "test/Magda/map-config-basic.json",
            i18nOptions
          })
          .then(function() {
            expect(terria.initSources.length).toEqual(1);
            expect(isInitUrl(terria.initSources[0])).toEqual(true);
            if (isInitUrl(terria.initSources[0])) {
              expect(terria.initSources[0].initUrl).toEqual(
                mapConfigBasicJson.aspects["terria-config"]
                  .initializationUrls[0]
              );
            } else {
              throw "not init source";
            }
            done();
          })
          .catch(error => {
            done.fail(error);
          });
      });
      it("works with v7initializationUrls", async function() {
        jasmine.Ajax.stubRequest(/.*api\/v0\/registry.*/).andReturn({
          // terria's "Magda derived url"
          responseText: mapConfigBasicString
        });
        const groupName = "Simple converter test";
        jasmine.Ajax.stubRequest(
          "https://example.foo.bar/initv7.json"
        ).andReturn({
          // terria's "Magda derived url"
          responseText: JSON.stringify({
            catalog: [{ name: groupName, type: "group", items: [] }]
          })
        });
        // no init sources before starting
        expect(terria.initSources.length).toBe(0);

        await terria.start({
          configUrl: "test/Magda/map-config-v7.json",
          i18nOptions
        });

        expect(terria.initSources.length).toBe(1);
        expect(isInitDataPromise(terria.initSources[0])).toBeTruthy(
          "Expected initSources[0] to be an InitDataPromise"
        );
        if (isInitDataPromise(terria.initSources[0])) {
          const data = await terria.initSources[0].data;
          // JSON parse & stringify to avoid a problem where I think catalog-converter
          //  can return {"id": undefined} instead of no "id"
          expect(
            JSON.parse(JSON.stringify(data.ignoreError()?.data.catalog))
          ).toEqual([
            {
              name: groupName,
              type: "group",
              members: [],
              shareKeys: [`Root Group/${groupName}`]
            }
          ]);
        }
      });
      it("works with inline init", async function() {
        // inline init
        jasmine.Ajax.stubRequest(/.*api\/v0\/registry.*/).andReturn({
          responseText: mapConfigInlineInitString
        });
        // no init sources before starting
        expect(terria.initSources.length).toEqual(0);
        await terria.start({
          configUrl: "test/Magda/map-config-inline-init.json",
          i18nOptions
        });

        const inlineInit = mapConfigInlineInitJson.aspects["terria-init"];
        /** Check cors domains */
        expect(terria.corsProxy.corsDomains).toEqual(inlineInit.corsDomains);
        /** Camera setting */
        expect(terria.mainViewer.homeCamera).toEqual(
          CameraView.fromJson(inlineInit.homeCamera)
        );

        /** Ensure inlined data catalog from init sources */
        expect(terria.initSources.length).toEqual(1);
        if (isInitData(terria.initSources[0])) {
          expect(terria.initSources[0].data.catalog).toEqual(
            inlineInit.catalog
          );
        } else {
          throw "not init source";
        }
      });
      it("parses dereferenced group aspect", function(done) {
        expect(terria.catalog.group.uniqueId).toEqual("/");
        // dereferenced res
        jasmine.Ajax.stubRequest(/.*api\/v0\/registry.*/).andReturn({
          responseText: mapConfigDereferencedString
        });
        terria
          .start({
            configUrl: "test/Magda/map-config-dereferenced.json",
            i18nOptions
          })
          .then(function() {
            const groupAspect = mapConfigDereferencedJson.aspects["group"];
            const ids = groupAspect.members.map((member: any) => member.id);
            expect(terria.catalog.group.uniqueId).toEqual("/");
            // ensure user added data co-exists with dereferenced magda members
            expect(terria.catalog.group.members.length).toEqual(3);
            expect(terria.catalog.userAddedDataGroup).toBeDefined();
            ids.forEach((id: string) => {
              const model = terria.getModelById(MagdaReference, id);
              if (!model) {
                throw "no record id";
              }
              expect(terria.modelIds).toContain(id);
              expect(model.recordId).toEqual(id);
            });
            done();
          })
          .catch(error => {
            done.fail(error);
          });
      });
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

      UrlToCatalogMemberMapping.register(
        s => true,
        WebMapServiceCatalogItem.type,
        true
      );

      terria.catalog.userAddedDataGroup.addMembersFromJson(CommonStrata.user, [
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
      ]);

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
      await newTerria.updateApplicationUrl(shareLink);
      await newTerria.loadInitSources();
      expect(newTerria.catalog.userAddedDataGroup.members).toContain("itemABC");
      expect(newTerria.catalog.userAddedDataGroup.members).toContain(
        "groupABC"
      );
    });

    it("initializes user added data group with shared UrlReference items", async function() {
      terria.catalog.userAddedDataGroup.addMembersFromJson(CommonStrata.user, [
        {
          id: "url_test",
          name: "foo",
          type: "url-reference",
          url: "test/WMS/single_metadata_url.xml"
        }
      ]);

      const shareLink = buildShareLink(terria, viewState);
      await newTerria.updateApplicationUrl(shareLink);
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
      await newTerria.updateApplicationUrl(shareLink);
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
          ImagerySplitDirection.RIGHT
        );
      });

      const shareLink = buildShareLink(terria, viewState);
      await newTerria.updateApplicationUrl(shareLink);
      await newTerria.loadInitSources();
      expect(newTerria.showSplitter).toEqual(true);
      expect(newTerria.splitPosition).toEqual(0.7);
      expect(newTerria.workbench.itemIds).toEqual(["itemABC"]);

      const newModel1 = <WebMapServiceCatalogItem>(
        newTerria.getModelById(BaseModel, "itemABC")
      );
      expect(newModel1).toBeDefined();
      expect(newModel1.splitDirection).toEqual(
        <any>ImagerySplitDirection.RIGHT
      );
    });

    it("opens and loads members of shared open groups", async function() {
      const group = <WebMapServiceCatalogGroup>(
        terria.getModelById(BaseModel, "groupABC")
      );
      await viewState.viewCatalogMember(group);
      expect(group.isOpen).toBe(true);
      expect(group.members.length).toBeGreaterThan(0);
      const shareLink = buildShareLink(terria, viewState);
      await newTerria.updateApplicationUrl(shareLink);
      await newTerria.loadInitSources();
      const newGroup = <WebMapServiceCatalogGroup>(
        newTerria.getModelById(BaseModel, "groupABC")
      );
      expect(newGroup.isOpen).toBe(true);
      expect(newGroup.members).toEqual(group.members);
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
        await newTerria.updateApplicationUrl(shareLink);
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
        await newTerria.updateApplicationUrl(shareLink);
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

    describe("with a Magda catalog", function() {
      // Simulate same as above but with Magda catalogs
      // This is really messy before a proper MagdaCatalogProvider is made
      //  that can call a (currently not yet written) Magda API to find the location of
      //  any id within a catalog

      // Could at least simulate moving an item deeper (similar to JSON catalog) and try having
      //  one of the knownContainerIds be shareKey linked to the new location?
      //  (hopefully that would trigger loading of the new group)

      let newTerria: Terria;
      let viewState: ViewState;
      beforeEach(async function() {
        // Create a config.json in a URL to pass to Terria.start
        const configUrl =
          "https://magda.example.com/api/v0/registry/records/map-config-example?optionalAspect=terria-config&optionalAspect=terria-init&optionalAspect=group&dereference=true";

        viewState = new ViewState({
          terria: terria,
          catalogSearchProvider: null,
          locationSearchProviders: []
        });
        newTerria = new Terria({ baseUrl: "./" });

        // Simulate an update to catalog/config between terria and newTerria

        jasmine.Ajax.install();
        jasmine.Ajax.stubRequest(/.*/).andError({});
        // .andCallFunction(request =>
        //   console.error(`Request attempted: ${request.url}`)
        // );

        jasmine.Ajax.stubRequest("serverconfig/").andReturn({
          responseText: "{}"
        });

        jasmine.Ajax.stubRequest(
          "https://magda.example.com/api/v0/registry/records/6b24aa39-1aa7-48d1-b6a6-9e755aff4476?optionalAspect=terria&optionalAspect=group&optionalAspect=dcat-dataset-strings&optionalAspect=dcat-distribution-strings&optionalAspect=dataset-distributions&optionalAspect=dataset-format&dereference=true"
        ).andReturn({
          responseText: JSON.stringify(
            require("../../wwwroot/test/Magda/shareKeys/6b24aa39-1aa7-48d1-b6a6-9e755aff4476.json")
          )
        });

        jasmine.Ajax.stubRequest(
          "https://magda.example.com/api/v0/registry/records/bfc69476-1c85-4208-9046-4f736bab9b8e?optionalAspect=terria&optionalAspect=group&optionalAspect=dcat-dataset-strings&optionalAspect=dcat-distribution-strings&optionalAspect=dataset-distributions&optionalAspect=dataset-format&dereference=true"
        ).andReturn({
          responseText: JSON.stringify(
            require("../../wwwroot/test/Magda/shareKeys/bfc69476-1c85-4208-9046-4f736bab9b8e.json")
          )
        });

        jasmine.Ajax.stubRequest(
          "https://magda.example.com/api/v0/registry/records/12f26f07-f39e-4753-979d-2de01af54bd1?optionalAspect=terria&optionalAspect=group&optionalAspect=dcat-dataset-strings&optionalAspect=dcat-distribution-strings&optionalAspect=dataset-distributions&optionalAspect=dataset-format&dereference=true"
        ).andReturn({
          responseText: JSON.stringify(
            require("../../wwwroot/test/Magda/shareKeys/12f26f07-f39e-4753-979d-2de01af54bd1.json")
          )
        });

        jasmine.Ajax.stubRequest(configUrl).andReturn({
          responseText: JSON.stringify(
            require("../../wwwroot/test/Magda/shareKeys/map-config-example-old.json")
          )
        });

        await terria.start({
          configUrl,
          i18nOptions
        });
        jasmine.Ajax.stubRequest(configUrl).andReturn({
          responseText: JSON.stringify(
            require("../../wwwroot/test/Magda/shareKeys/map-config-example-new.json")
          )
        });

        await newTerria.start({
          configUrl,
          i18nOptions
        });
        // Don't allow more requests to configUrl once Terrias are set up
        jasmine.Ajax.stubRequest(configUrl).andError({});
      });

      afterEach(function() {
        jasmine.Ajax.uninstall();
      });

      it("correctly applies user stratum changes to moved item", async function() {
        const oldGroupRef = terria.getModelById(
          MagdaReference,
          "6b24aa39-1aa7-48d1-b6a6-9e755aff4476"
        );
        expect(oldGroupRef).toBeDefined(
          "Can't find Old group reference in source terria"
        );
        if (oldGroupRef === undefined) return;
        await oldGroupRef.loadReference();
        expect(oldGroupRef.target).toBeDefined(
          "Can't dereference Old group in source terria"
        );

        const csv = terria.getModelById(
          CsvCatalogItem,
          "3432284e-a111-4844-97c8-26a1767f9986"
        );
        expect(csv).toBeDefined("Can't dereference csv in source terria");
        if (csv === undefined) return;
        csv.setTrait(CommonStrata.user, "opacity", 0.5);
        const shareLink = buildShareLink(terria, viewState);

        // Hack to make below test succeed. This needs to be there until we add a magda API that can locate any
        //  item by ID or share key within a Terria catalog
        // Loads "New group" (bfc69476-1c85-4208-9046-4f736bab9b8e) which registers shareKeys for
        //  "Extra group" (12f26f07-f39e-4753-979d-2de01af54bd1). And "Extra group" has a share key
        //  that matches the ancestor of the serialised Random CSV, so loading is triggered on "Extra group"
        //  followed by 3432284e-a111-4844-97c8-26a1767f9986 which points to "My random CSV"
        //  (decfc787-0425-4175-a98c-a40db064feb3)
        const newGroupRef = newTerria.getModelById(
          MagdaReference,
          "bfc69476-1c85-4208-9046-4f736bab9b8e"
        );
        if (newGroupRef === undefined) return;
        await newGroupRef.loadReference();

        await newTerria.updateApplicationUrl(shareLink);
        await newTerria.loadInitSources();

        // Why does this return a CSV item (when above hack isn't added)? It returns a brand new csv item without data or URL
        // Does serialisation save enough attributes that upsertModelFromJson thinks it can create a new model?
        // upsertModelFromJson should really be replaced with update + insert functions
        // But is it always easy to work out when share data should use update and when it should insert?
        // E.g. user added models should be inserted when deserialised, not updated
        const newCsv = newTerria.getModelByIdOrShareKey(
          CsvCatalogItem,
          "3432284e-a111-4844-97c8-26a1767f9986"
        );
        expect(newCsv).toBeDefined(
          "Can't find newCsv item in destination newTerria"
        );

        expect(newCsv?.uniqueId).toBe(
          "decfc787-0425-4175-a98c-a40db064feb3",
          "Failed to map share key to correct model"
        );
        expect(newCsv?.opacity).toBe(0.5);
      });

      it("correctly adds moved item to workbench and timeline", async function() {
        const oldGroupRef = terria.getModelById(
          MagdaReference,
          "6b24aa39-1aa7-48d1-b6a6-9e755aff4476"
        );
        expect(oldGroupRef).toBeDefined(
          "Can't find Old group reference in source terria"
        );
        if (oldGroupRef === undefined) return;
        await oldGroupRef.loadReference();
        expect(oldGroupRef.target).toBeDefined(
          "Can't dereference Old group in source terria"
        );

        const csv = terria.getModelById(
          CsvCatalogItem,
          "3432284e-a111-4844-97c8-26a1767f9986"
        );
        expect(csv).toBeDefined("Can't dereference csv in source terria");
        if (csv === undefined) return;
        terria.workbench.add(csv);
        terria.timelineStack.addToTop(csv);

        const shareLink = buildShareLink(terria, viewState);

        // Hack to make below test succeed. Needs to be there until we add a magda API that can locate any
        //  item by ID or share key within a Terria catalog
        // Loads "New group" (bfc69476-1c85-4208-9046-4f736bab9b8e) which registers shareKeys for
        //  "Extra group" (12f26f07-f39e-4753-979d-2de01af54bd1). And "Extra group" has a share key
        //  that matches the ancestor of the serialised Random CSV, so loading is triggered on "Extra group"
        //  followed by 3432284e-a111-4844-97c8-26a1767f9986 which points to "My random CSV"
        //  (decfc787-0425-4175-a98c-a40db064feb3)
        const newGroupRef = newTerria.getModelById(
          MagdaReference,
          "bfc69476-1c85-4208-9046-4f736bab9b8e"
        );
        if (newGroupRef === undefined) return;
        await newGroupRef.loadReference();

        await newTerria.updateApplicationUrl(shareLink);
        await newTerria.loadInitSources();

        // Why does this return a CSV item (when above hack isn't added)? It returns a brand new csv item without data or URL
        // Does serialisation save enough attributes that upsertModelFromJson thinks it can create a new model?
        // upsertModelFromJson should really be replaced with update + insert functions
        // But is it always easy to work out when share data should use update and when it should insert?
        // E.g. user added models should be inserted when deserialised, not updated
        const newCsv = newTerria.getModelByIdOrShareKey(
          CsvCatalogItem,
          "3432284e-a111-4844-97c8-26a1767f9986"
        );
        expect(newCsv).toBeDefined(
          "Can't find newCsv item in destination newTerria"
        );
        if (newCsv === undefined) return;

        expect(newCsv.uniqueId).toBe(
          "decfc787-0425-4175-a98c-a40db064feb3",
          "Failed to map share key to correct model"
        );
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
  //           .otherwise(done.fail);
  //       })
  //       .otherwise(done.fail);
  //   });

  describe("applyInitData", function() {
    describe("when pickedFeatures is not present in initData", function() {
      it("unsets the feature picking state if `canUnsetFeaturePickingState` is `true`", async function() {
        terria.pickedFeatures = new PickedFeatures();
        terria.selectedFeature = new Entity({ name: "selected" }) as Feature;
        await terria.applyInitData({
          initData: {},
          canUnsetFeaturePickingState: true
        });
        expect(terria.pickedFeatures).toBeUndefined();
        expect(terria.selectedFeature).toBeUndefined();
      });

      it("otherwise, should not unset feature picking state", async function() {
        terria.pickedFeatures = new PickedFeatures();
        terria.selectedFeature = new Entity({ name: "selected" }) as Feature;
        await terria.applyInitData({
          initData: {}
        });
        expect(terria.pickedFeatures).toBeDefined();
        expect(terria.selectedFeature).toBeDefined();
      });
    });
  });

  describe("basemaps", function() {
    it("when no base maps are specified load defaultBaseMaps", async function() {
      await terria.start({ configUrl: "" });
      terria.applyInitData({
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
      terria.applyInitData({
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
