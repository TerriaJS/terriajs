import Terria from "../../lib/Models/Terria";
import updateModelFromJson from "../../lib/Models/updateModelFromJson";
import CommonStrata from "../../lib/Models/CommonStrata";
import ViewState from "../../lib/ReactViewModels/ViewState";
import { buildShareLink } from "../../lib/ReactViews/Map/Panels/SharePanel/BuildShareLink";
import WebMapServiceCatalogItem from "../../lib/Models/WebMapServiceCatalogItem";
import CatalogMemberFactory from "../../lib/Models/CatalogMemberFactory";
import { BaseModel } from "../../lib/Models/Model";

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
    let model: BaseModel;

    beforeEach(function() {
      newTerria = new Terria({ baseUrl: "./" });
      viewState = new ViewState({
        terria: terria,
        catalogSearchProvider: null,
        locationSearchProviders: []
      });

      CatalogMemberFactory.register("wms", WebMapServiceCatalogItem);
      updateModelFromJson(
        terria.catalog.userAddedDataGroup,
        CommonStrata.user,
        {
          members: [
            {
              id: "ABC",
              name: "abc",
              type: "wms",
              url: "https://programs.communications.gov.au/geoserver/ows"
            }
          ]
        }
      );
      model = terria.catalog.userAddedDataGroup.memberModels[0];
    });

    it("initializes user added data group with shared items", function(done) {
      expect(newTerria.catalog.userAddedDataGroup.members).not.toContain("ABC");

      const shareLink = buildShareLink(terria, viewState);
      newTerria.updateApplicationUrl(shareLink).then(() => {
        expect(newTerria.catalog.userAddedDataGroup.members).toContain("ABC");
        done();
      });
    });

    it("initializes workbench with shared workbench items", function(done) {
      terria.workbench.add(model);
      expect(terria.workbench.itemIds).toContain("ABC");
      expect(newTerria.workbench.itemIds).not.toContain("ABC");

      const shareLink = buildShareLink(terria, viewState);
      newTerria
        .updateApplicationUrl(shareLink)
        // .then(() => Promise.resolve())
        .then(res => {
          debugger;
          expect(newTerria.workbench.itemIds).toContain("ABC");
          done();
          //   const wms = <WebMapServiceCatalogItem>(
          //     newTerria.catalog.userAddedDataGroup.memberModels[0]
          //   );

          //   wms.loadMapItems().then(() => {
          //     expect(newTerria.workbench.itemIds).toContain("ABC");
          //     done();
          //   });
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

// "use strict";

// /*global require*/
// var Terria = require("../../lib/Models/Terria");
// var WebMapServiceCatalogItem = require("../../lib/Models/WebMapServiceCatalogItem");

// describe("Terria", function() {
//   var terria;

//   beforeEach(function() {
//     terria = new Terria({
//       baseUrl: "./"
//     });
//   });

//   it("initializes proxy with parameters from config file", function(done) {
//     terria
//       .start({
//         configUrl: "test/init/configProxy.json"
//       })
//       .then(function() {
//         expect(terria.corsProxy.baseProxyUrl).toBe("/myproxy/");
//         expect(terria.corsProxy.proxyDomains).toEqual([
//           "example.com",
//           "csiro.au"
//         ]);
//       })
//       .then(done)
//       .otherwise(done.fail);
//   });
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
// });
