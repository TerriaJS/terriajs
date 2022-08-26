"use strict";

var TimelineStack = require("../../lib/Models/TimelineStack");
var CatalogItem = require("../../lib/Models/CatalogItem");
var Terria = require("../../lib/Models/Terria");

describe("TimeSeriesStack", function () {
  var clock, stack, terria;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    clock = {
      setCatalogItem: jasmine.createSpy("setCatalogItem")
    };
    stack = new TimelineStack(terria, clock);
  });

  describe("when one layer is added", function () {
    var catalogItem;

    beforeEach(function () {
      catalogItem = new CatalogItem(terria);
      stack.addLayerToTop(catalogItem);
    });

    it("topLayer should be the layer that's been added", function () {
      expect(stack.topLayer).toBe(catalogItem);
    });

    it("the global clock should take that layer's clock", function () {
      expect(clock.setCatalogItem.calls.mostRecent().args[0]).toEqual(
        catalogItem
      );
    });
  });

  describe("when two layers are added", function () {
    var catalogItem1, catalogItem2;

    beforeEach(function () {
      catalogItem1 = new CatalogItem(terria);
      catalogItem2 = new CatalogItem(terria);

      stack.addLayerToTop(catalogItem1);
      stack.addLayerToTop(catalogItem2);
    });

    it("topLayer is the second one", function () {
      expect(stack.topLayer).toBe(catalogItem2);
    });

    it("the global clock should be set to the second layer's value", function () {
      expect(clock.setCatalogItem.calls.mostRecent().args[0]).toEqual(
        catalogItem2
      );
    });
  });

  describe("when two layers are added and the second is removed", function () {
    var catalogItem1, catalogItem2;

    beforeEach(function () {
      catalogItem1 = new CatalogItem(terria);
      catalogItem2 = new CatalogItem(terria);

      stack.addLayerToTop(catalogItem1);
      stack.addLayerToTop(catalogItem2);
      stack.removeLayer(catalogItem2);
    });

    it("topLayer is the first one", function () {
      expect(stack.topLayer).toBe(catalogItem1);
    });

    it("the global clock should have been set back to the first layer", function () {
      expect(clock.setCatalogItem.calls.mostRecent().args[0]).toEqual(
        catalogItem1
      );
    });
  });

  describe("when two layers are added and the first is removed", function () {
    var catalogItem1, catalogItem2;

    beforeEach(function () {
      catalogItem1 = new CatalogItem(terria);
      catalogItem2 = new CatalogItem(terria);

      stack.addLayerToTop(catalogItem1);
      stack.addLayerToTop(catalogItem2);
      stack.removeLayer(catalogItem1);
    });

    it("topLayer is still the second one", function () {
      expect(stack.topLayer).toBe(catalogItem2);
    });

    it("the global clock should still be set to the second layer's value", function () {
      expect(clock.setCatalogItem.calls.mostRecent().args[0]).toEqual(
        catalogItem2
      );
    });
  });

  describe("when two layers are added and the first is added again", function () {
    var catalogItem1, catalogItem2;

    beforeEach(function () {
      catalogItem1 = new CatalogItem(terria);
      catalogItem2 = new CatalogItem(terria);

      stack.addLayerToTop(catalogItem1);
      stack.addLayerToTop(catalogItem2);
      stack.addLayerToTop(catalogItem1);
    });

    it("topLayer should be the first one", function () {
      expect(stack.topLayer).toBe(catalogItem1);
    });

    it("the stack should only contain two layers still", function () {
      // We don't want to abuse the inner API, so determine that there's only two in the stack by doing two removals
      // and checking that topLayer is now undefined.
      stack.removeLayer(catalogItem1);
      stack.removeLayer(catalogItem2);

      expect(stack.topLayer).toBeUndefined();
    });

    it("the global clock should still be set to the first layer's value", function () {
      expect(clock.setCatalogItem.calls.mostRecent().args[0]).toEqual(
        catalogItem1
      );
    });
  });

  it("when the stack is emptied, the global clock should stop", function () {
    var catalogItem = new CatalogItem(terria);

    stack.addLayerToTop(catalogItem);
    stack.clock.shouldAnimate = true;

    stack.removeLayer(catalogItem);

    expect(stack.clock.shouldAnimate).toBe(false);
  });

  describe("topLayer should return undefined", function () {
    it("on init", function () {});

    it("after having layers added and removed", function () {
      var catalogItem = new CatalogItem(terria);
      stack.addLayerToTop(catalogItem);
      stack.removeLayer(catalogItem);
    });

    afterEach(function () {
      expect(stack.topLayer).toBeUndefined();
    });
  });
});
