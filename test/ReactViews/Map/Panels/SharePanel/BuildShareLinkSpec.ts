import Terria from "../../../../../lib/Models/Terria";
import WebMapServiceCatalogItem from "../../../../../lib/Models/WebMapServiceCatalogItem";
import GeoJsonCatalogItem from "../../../../../lib/Models/GeoJsonCatalogItem";
import ViewState, {
  DATA_CATALOG_NAME,
  USER_DATA_NAME
} from "../../../../../lib/ReactViewModels/ViewState";
import { USER_ADDED_CATEGORY_NAME } from "../../../../../lib/Core/addedByUser";

import {
  buildShareLink,
  SHARE_VERSION,
  isShareable
} from "../../../../../lib/ReactViews/Map/Panels/SharePanel/BuildShareLink";
import URI from "urijs";
import loadBlob from "../../../../../lib/Core/loadBlob";
import addUserCatalogMember from "../../../../../lib/Models/addUserCatalogMember";
import { BaseModel } from "../../../../../lib/Models/Model";
import CommonStrata from "../../../../../lib/Models/CommonStrata";
import { runInAction } from "mobx";
import updateModelFromJson from "../../../../../lib/Models/updateModelFromJson";
import addToWorkbench from "../../../../../lib/Models/addToWorkbench";
import queryToObject from "terriajs-cesium/Source/Core/queryToObject";

let terria: Terria;
let viewState: ViewState;

beforeEach(function() {
  terria = new Terria({
    baseUrl: "./"
  });
  // terria.baseMap = {
  //   name: "Bing Maps Aerial"
  // };

  viewState = new ViewState({
    terria: terria,
    catalogSearchProvider: null,
    locationSearchProviders: []
  });
});

const decodeAndParseStartHash = (url: string) => {
  const parsed = URI.parse(url);
  if (parsed.fragment) {
    return JSON.parse(queryToObject(parsed.fragment)["start"]);
  }
};

interface FlattenedInitSources {
  [key: string]: FlattenedInitSources[keyof FlattenedInitSources];
  previewedItemId: string | undefined;
  models: any;
  workbench: any;
}

const flattenInitSources = (initSources: any[]): FlattenedInitSources =>
  initSources.reduce((acc: FlattenedInitSources, initSource: any) => {
    Object.keys(initSource).forEach(key => {
      acc[key] = initSource[key];
    });

    return acc;
  }, {});

describe("BuildShareLink", function() {
  it("should generate a url with default catalog related flags missing/undefined", function() {
    const shareLink = buildShareLink(terria, viewState);
    const params = decodeAndParseStartHash(shareLink);
    const initSources = flattenInitSources(params.initSources);

    expect(params.version).toBe(SHARE_VERSION);
    expect(initSources.previewedItemId).toBeUndefined();
  });

  describe("user added model containing local data", function() {
    it("should not be serialized", function(done) {
      const modelId = "Test";
      let model = new GeoJsonCatalogItem(modelId, terria);

      loadBlob("test/GeoJSON/bike_racks.geojson", {})
        .then(blob => {
          model.setFileInput(<File>blob);
          terria.addModel(model);

          expect(terria.getModelById(BaseModel, modelId)).toBe(model);
          expect(isShareable(terria)(modelId)).toBe(false);
          return addUserCatalogMember(terria, model);
        })
        .then(() => {
          const shareLink = buildShareLink(terria, viewState);
          const params = decodeAndParseStartHash(shareLink);
          const initSources = flattenInitSources(params.initSources);

          expect(
            initSources.models[USER_ADDED_CATEGORY_NAME].members
          ).not.toContain(model.uniqueId);

          done();
        });
    });

    it("should not be added to workbench in generated url", function(done) {
      const modelId = "Test";
      let model = new GeoJsonCatalogItem(modelId, terria);

      loadBlob("test/GeoJSON/bike_racks.geojson", {})
        .then(blob => {
          model.setFileInput(<File>blob);
          terria.addModel(model);
          return addUserCatalogMember(terria, model);
        })
        .then(() => {
          return addToWorkbench(terria.workbench, model, true);
        })
        .then(() => {
          const shareLink = buildShareLink(terria, viewState);
          const params = decodeAndParseStartHash(shareLink);
          const initSources = flattenInitSources(params.initSources);

          expect(initSources.workbench).not.toContain(model.uniqueId);

          done();
        });
    });
  });

  describe("user added model containing no local data", function() {
    let model: BaseModel;

    beforeEach(function() {
      model = new WebMapServiceCatalogItem("Test", terria);
      runInAction(() => {
        model.setTrait(
          CommonStrata.definition,
          "url",
          "https://programs.communications.gov.au/geoserver/ows"
        );
      });
      terria.addModel(model);
    });

    it("should be serialized", function(done) {
      addUserCatalogMember(terria, model).then(() => {
        const shareLink = buildShareLink(terria, viewState);
        const params = decodeAndParseStartHash(shareLink);
        const initSources = flattenInitSources(params.initSources);

        expect(model.uniqueId).toBeDefined();
        expect(isShareable(terria)(model.uniqueId)).toBe(true);
        expect(initSources.models[USER_ADDED_CATEGORY_NAME].members).toContain(
          model.uniqueId
        );

        done();
      });
    });

    it("should be added to workbench in generated url", function(done) {
      addUserCatalogMember(terria, model)
        .then(() => {
          return addToWorkbench(terria.workbench, model, true);
        })
        .then(() => {
          const shareLink = buildShareLink(terria, viewState);
          const params = decodeAndParseStartHash(shareLink);
          const initSources = flattenInitSources(params.initSources);

          expect(initSources.workbench).toContain(model.uniqueId);

          done();
        });
    });
  });

  describe("should generate a url that opens to the catalog", function() {
    beforeEach(function() {
      updateModelFromJson(
        terria.catalog.userAddedDataGroup,
        CommonStrata.user,
        {
          members: [
            {
              id: "ABC",
              name: "abc",
              type: "wms",
              url: "foo"
            }
          ]
        }
      );
    });

    // sharing active tab category not implemented in mobx yet
    // it("when the explorer window is open without a previewed catalog item", function() {
    //   viewState.openAddData();
    //   const shareLink = buildShareLink(terria, viewState);
    //   const params = decodeAndParseStartHash(shareLink);
    //   const initSources = flattenInitSources(params.initSources);

    //   expect(initSources.previewedItemId).toBe(undefined);
    //   // expect(initSources.sharedFromExplorerPanel).toBe(true);
    //   // expect(viewState.activeTabCategory).toBe(DATA_CATALOG_NAME);
    // });

    describe("opening to the user added tab", function() {
      // below case is impossible with the UI at the moment, but we might want to
      // share the 'empty-user-catalog-as-drag-and-drop' state in the future
      // it("without a previewed item", function() {
      //   viewState.openUserData();
      //   const shareLink = buildShareLink(terria, viewState);
      //   const params = decodeAndParseStartHash(shareLink);
      //   const initSources = flattenInitSources(params.initSources);

      //   expect(initSources.previewedItemId).toBe(undefined);
      //   // expect(initSources.sharedFromExplorerPanel).toBe(true);
      //   // expect(viewState.activeTabCategory).toBe(USER_DATA_NAME);
      // });

      it("viewing a previewed item", function() {
        let model = terria.catalog.userAddedDataGroup.memberModels[0];

        // preview the user added item & the share link should reflect that
        viewState.viewCatalogMember(model);
        const shareLink = buildShareLink(terria, viewState);
        let params = decodeAndParseStartHash(shareLink);
        let initSources = flattenInitSources(params.initSources);
        expect(initSources.previewedItemId).toBe(model.uniqueId);

        // close the catalog & the share link should reflect that
        viewState.closeCatalog();
        params = decodeAndParseStartHash(buildShareLink(terria, viewState));
        initSources = flattenInitSources(params.initSources);
        expect(initSources.previewedItemId).toBeUndefined();
      });
    });
  });
});
