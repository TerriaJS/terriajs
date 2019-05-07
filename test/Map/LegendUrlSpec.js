"use strict";

var LegendUrl = require("../../lib/Map/LegendUrl");

describe("LegendUrl", function() {
  describe("isImage", function() {
    it("should be true for a png mime type", function() {
      var legend = new LegendUrl("http://example.com", "image/png");
      expect(legend.isImage()).toBe(true);
    });

    it("should be false for no mime type", function() {
      var legend = new LegendUrl("http://example.com");
      expect(legend.isImage()).toBe(false);
    });

    it("should be false for non-image mime type", function() {
      var legend = new LegendUrl("http://example.com", "application/json");
      expect(legend.isImage()).toBe(false);
    });

    it("should be true for no mime type but .png extension", function() {
      var legend = new LegendUrl("http://example.com/image.png");
      expect(legend.isImage()).toBe(true);
    });

    it("should be true for png mime type and extension", function() {
      var legend = new LegendUrl("http://example.com/image.png", "image/png");
      expect(legend.isImage()).toBe(true);
    });

    it("should be false for non-image mime type but .png extension", function() {
      var legend = new LegendUrl(
        "http://example.com/image.png",
        "application/json"
      );
      expect(legend.isImage()).toBe(false);
    });

    it("should be false for non-png extension", function() {
      var legend = new LegendUrl("http://example.com/image.exe");
      expect(legend.isImage()).toBe(false);
    });
  });
});
