"use strict";

/*global require,describe,it,expect,beforeEach*/

var Terria = require("../../lib/Models/Terria");
var ImageryLayerCatalogItem = require("../../lib/Models/ImageryLayerCatalogItem");
var NeverTileDiscardPolicy = require("terriajs-cesium/Source/Scene/NeverTileDiscardPolicy")
  .default;
var UrlTemplateCatalogItem = require("../../lib/Models/UrlTemplateCatalogItem");

var terria;
var urlTemplateCatalogItem;

describe("UrlTemplateCatalogItem", function() {
  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });

    urlTemplateCatalogItem = new UrlTemplateCatalogItem(terria);
  });

  it("has sensible type and typeName", function() {
    expect(urlTemplateCatalogItem.type).toBe("url-template");
    expect(urlTemplateCatalogItem.typeName).toBe("URL Template Map Server");
  });

  it("can be constructed", function() {
    expect(urlTemplateCatalogItem).toBeDefined();
  });

  it("is derived from ImageryLayerCatalogItem", function() {
    expect(urlTemplateCatalogItem instanceof ImageryLayerCatalogItem).toBe(
      true
    );
  });

  it("creates Cesium imagery provider correctly", function(done) {
    urlTemplateCatalogItem.url =
      "{s}.tiles.example.com/mylayer/{z}/{x}/{y}.png";
    urlTemplateCatalogItem.minimumLevel = 1;
    urlTemplateCatalogItem.maximumLevel = 5;
    urlTemplateCatalogItem.attribution = "Thanks to the awesome data provider!";
    urlTemplateCatalogItem.subdomains = ["a", "d"];
    urlTemplateCatalogItem.tileDiscardPolicy = new NeverTileDiscardPolicy();

    urlTemplateCatalogItem
      .load()
      .then(function() {
        var provider = urlTemplateCatalogItem._createImageryProvider();
        expect(provider.url).toBe(
          "{s}.tiles.example.com/mylayer/{z}/{x}/{y}.png"
        );
        expect(provider.minimumLevel).toBe(1);
        expect(provider.maximumLevel).toBe(5);
        expect(provider.credit.html).toBe(
          "Thanks to the awesome data provider!"
        );
        expect(provider._subdomains).toEqual(["a", "d"]);
        expect(
          provider.tileDiscardPolicy instanceof NeverTileDiscardPolicy
        ).toBe(true);
      })
      .then(done)
      .otherwise(done.fail);
  });
});
