import Terria from "../../../../../lib/Models/Terria";
import CatalogGroup from "../../../../../lib/Models/CatalogGroupNew";
import WebMapServiceCatalogItem from "../../../../../lib/Models/WebMapServiceCatalogItem";
import createCatalogMemberFromType from "../../../../../lib/Models/createCatalogMemberFromType";
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
import upsertModelFromJson from "../../../../../lib/Models/upsertModelFromJson";
import CatalogMemberFactory from "../../../../../lib/Models/CatalogMemberFactory";
import { before } from "lodash-es";
import Catalog from "../../../../../lib/Models/CatalogNew";
import loadBlob from "../../../../../lib/Core/loadBlob";
import createCatalogItemFromFileOrUrl from "../../../../../lib/Models/createCatalogItemFromFileOrUrl";
import addUserCatalogMember from "../../../../../lib/Models/addUserCatalogMember";
import GeoJsonCatalogItem from "../../../../../lib/Models/GeoJsonCatalogItem";
import { item } from "../../../../../lib/ReactViews/Workbench/Controls/chart-item-selector.scss";
import { BaseModel } from "../../../../../lib/Models/Model";
import CommonStrata from "../../../../../lib/Models/CommonStrata";
import createCatalogItemFromUrl from "../../../../../lib/Models/createCatalogItemFromUrl";
import defined from "terriajs-cesium/Source/Core/defined";
import { runInAction } from "mobx";
import updateModelFromJson from "../../../../../lib/Models/updateModelFromJson";
import addToWorkbench from "../../../../../lib/Models/addToWorkbench";

let terria: Terria;
let viewState: ViewState;

beforeEach(function() {
  terria = new Terria({
    baseUrl: "./"
  });
  // terria.baseMap = {
  //   name: "Bing Maps Aerial"
  // };
  CatalogMemberFactory.register(
    WebMapServiceCatalogItem.type,
    WebMapServiceCatalogItem
  );

  let catalogGroupMembers = [
    {
      id: "A",
      name: "A",
      type: "wms"
    }
  ];

  viewState = new ViewState({ terria });

  // clone to prevent any weird mutations
  // catalogUpdateJson = JSON.parse(
  //   JSON.stringify([
  //     {
  //       name: "A",
  //       type: "group",
  //       items: [
  //         {
  //           id: "C",
  //           name: "C",
  //           type: "wms",
  //           isEnabled: false
  //         }
  //       ]
  //     },
  //     {
  //       name: USER_ADDED_CATEGORY_NAME,
  //       type: "group",
  //       items: [
  //         {
  //           id: "D",
  //           name: "D",
  //           type: "wms",
  //           isEnabled: false,
  //           url: "foo"
  //         }
  //       ]
  //     }
  //   ])
  // );
});

const decodeAndParseStartHash = url =>
  JSON.parse(URI.decode(URI.parse(url).fragment.replace(/start=/, "")));

const flattenInitSources = initSources =>
  initSources.reduce((acc, initSource) => {
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

          expect(initSources.models["User-Added+Data"].members).not.toContain(
            model.uniqueId
          );

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
          "definition",
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
        expect(initSources.models["User-Added+Data"].members).toContain(
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
    // it("when the explorer window is open without a previewed catalog item", function(done) {
    //   catalog
    //     .updateFromJson(catalogUpdateJson)
    //     .then(function() {
    //       // preview the wms item & the share link should reflect that
    //       viewState.openAddData();
    //       const shareLink = buildShareLink(terria, viewState);
    //       const params = decodeAndParseStartHash(shareLink);
    //       const initSources = flattenInitSources(params.initSources);

    //       expect(initSources.previewedItemId).toBe(undefined);
    //       expect(initSources.sharedFromExplorerPanel).toBe(true);
    //       expect(viewState.activeTabCategory).toBe(DATA_CATALOG_NAME);

    //       done();
    //     })
    //     .otherwise(done.fail);
    // });

    describe("opening to the user added tab", function() {
      // below case is impossible with the UI at the moment, but we might want to
      // share the 'empty-user-catalog-as-drag-and-drop' state in the future
      // xit("without a previewed item", function(done) {
      //   catalog
      //     .updateFromJson(catalogUpdateJson)
      //     .then(function() {
      //       // preview the wms item & the share link should reflect that
      //       viewState.openAddData();
      //       const shareLink = buildShareLink(terria, viewState);
      //       const params = decodeAndParseStartHash(shareLink);
      //       const initSources = flattenInitSources(params.initSources);
      //       expect(initSources.previewedItemId).toBe(undefined);
      //       expect(initSources.sharedFromExplorerPanel).toBe(true);
      //       // this is actually impossible at the moment
      //       expect(viewState.activeTabCategory).toBe(USER_DATA_NAME);
      //       done();
      //     })
      //     .otherwise(done.fail);
      // });

      it("viewing a previewed item", function() {
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

// "use strict";

// //*global require,expect*/
// import Terria from "../../../../../lib/Models/Terria";
// import CatalogGroup from "../../../../../lib/Models/CatalogGroup";
// import WebMapServiceCatalogItem from "../../../../../lib/Models/WebMapServiceCatalogItem";
// import createCatalogMemberFromType from "../../../../../lib/Models/createCatalogMemberFromType";
// import ViewState, {
//   DATA_CATALOG_NAME,
//   USER_DATA_NAME
// } from "../../../../../lib/ReactViewModels/ViewState";
// import { USER_ADDED_CATEGORY_NAME } from "../../../../../lib/Core/addedByUser";

// import {
//   buildShareLink,
//   SHARE_VERSION
// } from "../../../../../lib/ReactViews/Map/Panels/SharePanel/BuildShareLink";
// import URI from "urijs";

// var terria;
// var catalog;
// var viewState;
// var catalogUpdateJson;

// beforeEach(function() {
//   terria = new Terria({
//     baseUrl: "./"
//   });
//   terria.baseMap = {
//     name: "Bing Maps Aerial"
//   };
//   createCatalogMemberFromType.register("group", CatalogGroup);
//   createCatalogMemberFromType.register("wms", WebMapServiceCatalogItem);

//   catalog = terria.catalog;

//   viewState = new ViewState({ terria });

//   // clone to prevent any weird mutations
//   catalogUpdateJson = JSON.parse(
//     JSON.stringify([
//       {
//         name: "A",
//         type: "group",
//         items: [
//           {
//             id: "C",
//             name: "C",
//             type: "wms",
//             isEnabled: false
//           }
//         ]
//       },
//       {
//         name: USER_ADDED_CATEGORY_NAME,
//         type: "group",
//         items: [
//           {
//             id: "D",
//             name: "D",
//             type: "wms",
//             isEnabled: false,
//             url: "foo"
//           }
//         ]
//       }
//     ])
//   );
// });

// const decodeAndParseStartHash = url =>
//   JSON.parse(URI.decode(URI.parse(url).fragment.replace(/start=/, "")));

// const flattenInitSources = initSources =>
//   initSources.reduce((acc, initSource) => {
//     Object.keys(initSource).forEach(key => {
//       acc[key] = initSource[key];
//     });

//     return acc;
//   }, {});

// describe("BuildShareLink", function() {
//   it("should generate a url with default catalog related flags missing/undefined", function() {
//     const shareLink = buildShareLink(terria, viewState);
//     const params = decodeAndParseStartHash(shareLink);
//     const initSources = flattenInitSources(params.initSources);

//     expect(params.version).toBe(SHARE_VERSION);
//     expect(initSources.previewedItemId).toBeUndefined();
//     expect(initSources.sharedFromExplorerPanel).toBeUndefined();
//   });

//   describe("should generate a url that opens to the catalog", function() {
//     it("when the explorer window is open without a previewed catalog item", function(done) {
//       catalog
//         .updateFromJson(catalogUpdateJson)
//         .then(function() {
//           // preview the wms item & the share link should reflect that
//           viewState.openAddData();
//           const shareLink = buildShareLink(terria, viewState);
//           const params = decodeAndParseStartHash(shareLink);
//           const initSources = flattenInitSources(params.initSources);

//           expect(initSources.previewedItemId).toBe(undefined);
//           expect(initSources.sharedFromExplorerPanel).toBe(true);
//           expect(viewState.activeTabCategory).toBe(DATA_CATALOG_NAME);

//           done();
//         })
//         .otherwise(done.fail);
//     });

//     describe("opening to the user added tab", function() {
//       // below case is impossible with the UI at the moment, but we might want to
//       // share the 'empty-user-catalog-as-drag-and-drop' state in the future
//       // xit("without a previewed item", function(done) {
//       //   catalog
//       //     .updateFromJson(catalogUpdateJson)
//       //     .then(function() {
//       //       // preview the wms item & the share link should reflect that
//       //       viewState.openAddData();
//       //       const shareLink = buildShareLink(terria, viewState);
//       //       const params = decodeAndParseStartHash(shareLink);
//       //       const initSources = flattenInitSources(params.initSources);

//       //       expect(initSources.previewedItemId).toBe(undefined);
//       //       expect(initSources.sharedFromExplorerPanel).toBe(true);
//       //       // this is actually impossible at the moment
//       //       expect(viewState.activeTabCategory).toBe(USER_DATA_NAME);

//       //       done();
//       //     })
//       //     .otherwise(done.fail);
//       // });
//       it("viewing a previewed item", function(done) {
//         catalog
//           .updateFromJson(catalogUpdateJson)
//           .then(function() {
//             // preview the user added item & the share link should reflect that
//             viewState.viewCatalogMember(catalog.group.items[1].items[0]);
//             const shareLink = buildShareLink(terria, viewState);
//             const params = decodeAndParseStartHash(shareLink);
//             const initSources = flattenInitSources(params.initSources);

//             expect(initSources.previewedItemId).toBe("D");
//             expect(initSources.sharedFromExplorerPanel).toBe(true);
//             expect(viewState.activeTabCategory).toBe(USER_DATA_NAME);

//             return catalog.updateByShareKeys({});
//           })
//           .then(function() {
//             // close the catalog & the share link should reflect that
//             viewState.closeCatalog();
//             const params = decodeAndParseStartHash(
//               buildShareLink(terria, viewState)
//             );
//             const initSources = flattenInitSources(params.initSources);

//             expect(initSources.previewedItemId).toBeUndefined();
//             expect(initSources.sharedFromExplorerPanel).toBeUndefined();

//             done();
//           })
//           .otherwise(done.fail);
//       });
//     });
//   });
// });
